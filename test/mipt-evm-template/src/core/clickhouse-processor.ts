import {createLogger} from '@subsquid/logger'
import type {BlockBase, BlockRef} from '@subsquid/portal-tools'
import {last, runProgram} from '@subsquid/util-internal'
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
    clickhouseTables?: Record<string, TableOptions>
    source: DataSource<B>
    map: (block: B) => R
}


export function runClickhouseProcessing<B extends BlockBase, R extends {[P in keyof R]: object[]}>(args: ProcessorArgs<B, R>): void {
    runProgram(async () => {
        let clickhouse = new ClickhouseClient({url: args.clickhouse})
        let writer = new BlockWriter(clickhouse, args.clickhouseTables ?? {})
        let {source, map} = args
        try {
            for await (let batch of source.createDataStream()) {
                if (log.isDebug()) {
                    let {blocks, ...props} = batch
                    log.debug({
                        size: batch.blocks.length,
                        ...props
                    }, 'data batch')
                }

                for (let block of batch.blocks) {
                    let tables = await map(block)
                    await writer.drain()
                    writer.push({
                        header: block.header,
                        tables
                    })
                }
                if (batch.blocks.length == 0 || (batch.headNumber ?? -1) <= last(batch.blocks).header.number) {
                    await writer.flush()
                }
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
    }, err => {
        log.fatal(err)
    })
}
