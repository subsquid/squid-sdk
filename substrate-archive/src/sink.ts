import {Progress, Speed} from "@subsquid/util-internal-counters"
import assert from "assert"
import * as pg from "pg"
import {Block, BlockData, Call, Event, Extrinsic, Metadata, Warning} from "./model"
import {toJSON, toJsonString} from "./util"
import WritableStream = NodeJS.WritableStream


export interface Sink {
    write(block: BlockData): Promise<void>
}


export interface PostgresSinkOptions {
    db: pg.ClientBase
    speed?: Speed
    progress?: Progress
}


export class PostgresSink implements Sink {
    private metadataInsert = new Insert<Metadata>('metadata', {
        id: {cast: 'text'},
        spec_name: {cast: 'text'},
        spec_version: {cast: 'int'},
        block_height: {cast: 'int'},
        block_hash: {cast: 'text'},
        hex: {cast: 'text'}
    })

    private headerInsert = new Insert<Block>('block', {
        id: {cast: 'text'},
        height: {cast: 'numeric'},
        hash: {cast: 'text'},
        parent_hash: {cast: 'text'},
        timestamp: {cast: 'timestamptz'},
        spec_id: {cast: 'text'},
        validator: {cast: 'text'}
    })

    private extrinsicInsert = new Insert<Extrinsic>('extrinsic', {
        id: {cast: 'text'},
        block_id: {cast: 'text'},
        index_in_block: {cast: 'integer'},
        signature: {map: toJsonString, cast: 'jsonb'},
        success: {cast: 'bool'},
        call_id: {cast: 'text'},
        hash: {cast: 'text', map: toJSON},
        pos: {cast: 'int'}
    })

    private callInsert = new Insert<Call>('call', {
        id: {cast: 'text'},
        parent_id: {cast: 'text'},
        block_id: {cast: 'text'},
        extrinsic_id: {cast: 'text'},
        success: {cast: 'bool'},
        name: {cast: 'text'},
        args: {map: toJsonString, cast: 'jsonb'},
        pos: {cast: 'int'}
    })

    private eventInsert = new Insert<Event>('event', {
        id: {cast: 'text'},
        block_id: {cast: 'text'},
        index_in_block: {cast: 'int'},
        phase: {cast: 'text'},
        extrinsic_id: {cast: 'text'},
        call_id: {cast: 'text'},
        name: {cast: 'text'},
        args: {map: toJsonString, cast: 'jsonb'},
        pos: {cast: 'int'}
    })

    private warningInsert = new Insert<Warning>('warning', {
        block_id: {cast: 'text'},
        message: {cast: 'text'}
    })

    private db: pg.ClientBase
    private speed?: Speed
    private progress?: Progress

    constructor(options: PostgresSinkOptions) {
        this.db = options.db
        this.speed = options.speed
        this.progress = options.progress
    }

    async write(block: BlockData): Promise<void> {
        if (block.metadata) {
            this.metadataInsert.add(block.metadata)
        }
        this.headerInsert.add(block.header)
        this.extrinsicInsert.addMany(block.extrinsics)
        this.callInsert.addMany(block.calls)
        this.eventInsert.addMany(block.events)
        if (block.warnings) {
            this.warningInsert.addMany(block.warnings)
        }
        if (block.last || this.headerInsert.size > 20) {
            await this.submit()
        }
    }

    private async submit(): Promise<void> {
        let size = this.headerInsert.size
        this.speed?.start()
        let metadataInsert = this.metadataInsert.take()
        let headerInsert = this.headerInsert.take()
        let extrinsicInsert = this.extrinsicInsert.take()
        let callInsert = this.callInsert.take()
        let eventInsert = this.eventInsert.take()
        let warningInsert = this.warningInsert.take()
        await this.tx(async () => {
            await metadataInsert.query(this.db)
            await headerInsert.query(this.db)
            await extrinsicInsert.query(this.db)
            await callInsert.query(this.db)
            await eventInsert.query(this.db)
            await warningInsert.query(this.db)
        })
        if (this.speed || this.progress) {
            let time = process.hrtime.bigint()
            this.speed?.stop(size, time)
            this.progress?.inc(size, time)
        }
    }

    private async tx<T>(cb: () => Promise<T>): Promise<T> {
        await this.db.query('BEGIN')
        try {
            let result = await cb()
            await this.db.query('COMMIT')
            return result
        } catch(e: any) {
            await this.db.query('ROLLBACK').catch(() => {})
            throw e
        }
    }
}


type TableColumns<E> = {
    [name in keyof E]: {map?: (val: E[name]) => unknown, cast?: string}
}


class Insert<E> {
    private sql: string
    private columns: Record<string, unknown[]>

    constructor(private table: string, private mapping: TableColumns<E>, sql?: string, columns?: Record<string, unknown[]>) {
        if (sql == null) {
            let names = Object.keys(mapping) as (keyof E)[]
            let args = names.map((name, idx) => {
                let param = '$' + (idx + 1)
                let cast = mapping[name].cast
                if (cast) {
                    param += '::' + cast + '[]'
                }
                return param
            })
            this.sql = `INSERT INTO ${table} (${names.join(', ')}) SELECT * FROM unnest(${args.join(', ')}) AS i(${names.join(', ')})`
        } else {
            this.sql = sql
        }
        this.columns = columns || this.makeColumns()
    }

    async query(db: pg.ClientBase): Promise<void> {
        if (this.size == 0) return
        await db.query(this.sql, Object.values(this.columns))
    }

    add(row: E): void {
        for (let name in this.mapping) {
            let def = this.mapping[name]
            this.columns[name].push(def.map ? def.map(row[name]) : row[name])
        }
    }

    addMany(rows: E[]): void {
        for (let i = 0; i < rows.length; i++) {
            this.add(rows[i])
        }
    }

    get size(): number {
        for (let key in this.columns) {
            let col = this.columns[key]
            return col.length
        }
        return 0
    }

    take(): Insert<E> {
        let insert = new Insert(this.table, this.mapping, this.sql, this.columns)
        this.columns = this.makeColumns()
        return insert
    }

    private makeColumns(): Record<string, unknown[]> {
        let columns: Record<string, unknown[]> = {}
        for (let name in this.mapping) {
            columns[name] = []
        }
        return columns
    }
}


export interface WritableSinkOptions {
    writable: WritableStream
    speed?: Speed
    progress?: Progress
}


export class WritableSink implements Sink {
    private writable: WritableStream
    private speed?: Speed
    private progress?: Progress
    private error?: Error
    private drainHandle?: {resolve: () => void, reject: (err: Error) => void}

    constructor(options: WritableSinkOptions) {
        this.writable = options.writable
        this.speed = options.speed
        this.progress = options.progress
        this.writable.on('error', this.onError)
        this.writable.on('drain', this.onDrain)
    }

    close(): void {
        this.writable.off('error', this.onError)
        this.writable.off('drain', this.onDrain)
    }

    async write(block: BlockData): Promise<void> {
        if (this.error) throw this.error
        this.speed?.start()
        this.writable.write(toJsonString(block))
        let wait = !this.writable.write('\n')
        if (wait) {
            await this.drain()
        }
        if (this.speed || this.writable) {
            let time = process.hrtime.bigint()
            this.speed?.stop(1, time)
            this.progress?.inc(1, time)
        }
    }

    private drain(): Promise<void> {
        assert(this.drainHandle == null)
        return new Promise((resolve, reject) => {
            this.drainHandle = {resolve, reject}
        })
    }

    private onDrain = () => {
        if (this.drainHandle) {
            this.drainHandle.resolve()
            this.drainHandle = undefined
        }
    }

    private onError = (err: Error) => {
        this.close()
        this.error = err
        if (this.drainHandle) {
            this.drainHandle.reject(err)
            this.drainHandle = undefined
        }
    }
}
