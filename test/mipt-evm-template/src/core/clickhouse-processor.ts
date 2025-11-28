import {createLogger} from '@subsquid/logger'
import type {BlockBase, BlockRef} from '@subsquid/portal-tools'
import {groupBy, last, maybeLast, runProgram, Timer} from '@subsquid/util-internal'
import {Speed} from '@subsquid/util-internal-counters'
import {ClickhouseClient} from './clickhouse-client'
import {BlockWriter} from './clickhouse-writer/block-writer'
import {TableOptions} from './clickhouse-writer/table-writer'


const log = createLogger('processor')


export interface DataBatch<B> {
    blocks: B[]
    headNumber?: number
}


export interface DataSource<B> {
    createDataStream(afterBlock?: BlockRef): AsyncIterable<DataBatch<B>>
}


export type GetDataSourceBlock<S> = S extends DataSource<infer B> ? B : never


export interface ProcessorArgs<B, R> {
    clickhouse: string
    clickhouseDatabase: string
    clickhouseTables?: Record<string, TableOptions>
    source: DataSource<B>
    map: (block: B) => R
}


export function runClickhouseProcessing<B extends BlockBase, R extends {[P in keyof R]: object[]}>(args: ProcessorArgs<B, R>): void {
    runProgram(async () => {
        let clickhouse = new ClickhouseClient(args.clickhouse)

        let tableList = await inspectDatabase(clickhouse, args.clickhouseDatabase)

        let head = await clickhouse.query<BlockRef>(
            `SELECT number, hash FROM ${args.clickhouseDatabase}.blocks ORDER BY number DESC LIMIT 1`
        ).then(res => {
            return maybeLast(res.data)
        })

        await clearPartialData(clickhouse, args.clickhouseDatabase, tableList, head)

        let tableMap: Record<string, TableOptions> = {}
        for (let table of tableList) {
            tableMap[table] = args.clickhouseTables?.[table] ?? {}
        }

        let writer = new BlockWriter(
            clickhouse,
            args.clickhouseDatabase,
            tableMap
        )

        let metrics = new Metrics()

        let {source, map} = args
        try {
            for await (let batch of source.createDataStream(head)) {
                let nRows = 0

                for (let block of batch.blocks) {
                    let tables = await map(block)
                    await writer.drain()
                    writer.push({
                        header: block.header,
                        tables
                    })

                    // track number of inserted rows for performance stats
                    nRows += 1
                    for (let table in tables) {
                        nRows += tables[table].length
                    }
                }

                if (batch.blocks.length == 0 || (batch.headNumber ?? -1) <= last(batch.blocks).header.number) {
                    await writer.flush()
                }

                metrics.registerBatch(batch, nRows)
            }
        } catch(err: any) {
            if (writer.isHealthy) {
                await writer.flush().catch(err => {
                    log.error(err, 'final flush of already mapped data failed')
                })
            }
            throw err
        }

        await writer.flush()

        metrics.report()
    }, err => {
        log.fatal(err)
    })
}


async function clearPartialData(
    clickhouse: ClickhouseClient,
    database: string,
    tableList: string[],
    head: BlockRef | undefined
): Promise<void>
{
    if (head) {
        for (let table of tableList) {
            await clickhouse.command(`DELETE FROM ${database}.${table} WHERE block_number > ${head.number}`)
        }
    } else {
        for (let table of tableList) {
            await clickhouse.command(`DELETE FROM ${database}.${table} WHERE block_number >= 0`)
        }
    }
}


async function inspectDatabase(clickhouse: ClickhouseClient, db: string): Promise<string[]> {
    let columns = await clickhouse.query<{table: string, name: string, type: string}>(
        'SELECT table, name, type FROM system.columns WHERE database = {db:String}',
        {db}
    ).then(res => {
        return groupBy(res.data, it => it.table)
    })

    interface TypeDef {
        match(type: string): boolean
        description: string
    }

    let BlockNumber: TypeDef = {
        description: 'only UInt32 and UInt64 types are allowed',
        match(type: string): boolean {
            return ['UInt32', 'UInt64'].includes(type)
        }
    }

    let Hash: TypeDef = {
        description: 'only String or FixedString(N) types are allowed',
        match(type: string): boolean {
            return type == 'String' || type.startsWith('FixedString')
        }
    }

    let DataTime: TypeDef = {
        description: 'only DateTime type is allowed',
        match(type: string): boolean {
            return type == 'DateTime'
        }
    }

    for (let [table, fields] of columns.entries()) {
        function assertColumn(name: string, type: TypeDef, optional?: boolean) {
            let def = fields.find(f => f.name === name)
            if (def == null) {
                if (optional) return
                throw new Error(`table '${db}.${table}' does not have column '${name}'`)
            }

            if (!type.match(def.type)) throw new Error(
                `column '${name}' of table '${db}.${table}' has unsupported type ${def.type}, ${type.description}`
            )
        }

        if (table == 'blocks') {
            assertColumn('number', BlockNumber)
            assertColumn('hash', Hash)
            assertColumn('parent_number', BlockNumber, true)
            assertColumn('parent_hash', Hash)
            assertColumn('timestamp', DataTime, true)
        } else {
            assertColumn('block_number', BlockNumber)
            assertColumn('block_hash', Hash)
            assertColumn('block_timestamp', DataTime, true)
        }
    }

    if (!columns.has('blocks')) throw new Error(`'blocks' table is not defined in database '${db}'`)

    return Array.from(columns.keys()).filter(table => table != 'blocks')
}


class Metrics {
    private lastBlock = -1
    private lastTick = process.hrtime.bigint()
    private lastReportTime = Number.NEGATIVE_INFINITY
    private blockSpeed = new Speed()
    private insertSpeed = new Speed()
    private reportTimeout = new Timer(5000, () => this.report())

    registerBatch(batch: {blocks: BlockBase[]}, rows: number): void {
        if (batch.blocks.length == 0) return

        let lastBlock = last(batch.blocks).header.number
        let now = process.hrtime.bigint()

        if (this.lastBlock < 0) {
            this.lastBlock = batch.blocks[0].header.number - 1
        }

        this.blockSpeed.push(Math.max(0, lastBlock - this.lastBlock), this.lastTick, now)
        this.insertSpeed.push(rows, this.lastTick, now)

        this.lastBlock = lastBlock
        this.lastTick = now

        this.reportUpdates()
    }

    getStatusLine(): string {
        return `last block: ${this.lastBlock}, ` +
            `rate: ${Math.round(this.blockSpeed.speed())} blocks/sec, ` +
            `${Math.round(this.insertSpeed.speed())} rows/sec`
    }

    report(): void {
        log.info(this.getStatusLine())
        this.lastReportTime = Date.now()
        this.reportTimeout.stop()
    }

    private reportUpdates(): void {
        let now = Date.now()
        let delay = 5000 - (now - this.lastReportTime)
        if (delay > 0) {
            this.reportTimeout.start(delay)
        } else {
            this.report()
        }
    }
}
