import assert from "assert"
import * as pg from "pg"
import {Block, BlockData, Call, Event, Extrinsic, Metadata} from "./model"
import {toJSON} from "./util/json"
import WritableStream = NodeJS.WritableStream


export interface Sink {
    write(block: BlockData): Promise<void>
}


export class PostgresSink implements Sink {
    constructor(private db: pg.ClientBase) {}

    write(block: BlockData): Promise<void> {
        return this.tx(async () => {
            if (block.metadata) {
                await this.saveMetadata(block.metadata)
            }
            await this.saveHeader(block.header)
            await this.saveExtrinsics(block.extrinsics)
            await this.saveCalls(block.calls)
            await this.saveEvents(block.events)
        })
    }

    private saveMetadata(metadata: Metadata) {
        return this.db.query(
            "INSERT INTO metadata (spec_version, block_height, block_hash, hex) VALUES ($1, $2, $3, $4)",
            [metadata.spec_version, metadata.block_height, metadata.block_hash, metadata.hex]
        )
    }

    private saveHeader(block: Block) {
        return this.db.query(
            "INSERT INTO block (id, height, hash, parent_hash, timestamp) VALUES ($1, $2, $3, $4, $5)",
            [block.id, block.height, block.hash, block.parent_hash, block.timestamp]
        )
    }

    private saveExtrinsics(extrinsics: Extrinsic[]) {
        let columns = ['id', 'block_id', 'index_in_block', 'name', 'signature', 'success', 'hash']
        return this.insertMany('extrinsic', columns, extrinsics, (values, ex) => {
            values.push(ex.id, ex.block_id, ex.index_in_block, ex.name, toJSON(ex.signature), ex.success, ex.hash)
        })
    }

    private saveCalls(calls: Call[]) {
        let columns = ['id', 'index', 'extrinsic_id', 'parent_id', 'success', 'args']
        return this.insertMany('call', columns, calls, (values, call) => {
            values.push(call.id, call.index, call.extrinsic_id, call.parent_id, call.success, toJSON(call.args))
        })
    }

    private saveEvents(events: Event[]) {
        let columns = ['id', 'block_id', 'index_in_block', 'phase', 'extrinsic_id', 'call_id', 'name', 'args']
        return this.insertMany('event', columns, events, (values, e) => {
            values.push(e.id, e.block_id, e.index_in_block, e.phase, e.extrinsic_id, e.call_id, e.name, toJSON(e.args))
        })
    }

    private insertMany<T>(table: string, columns: string[], data: T[], mapFn: (values: any[], entity: T) => void) {
        let placeholders = []
        let values: any = []
        let pos = 0
        for (let i = 0; i < data.length; i++) {
            let entity = data[i]
            placeholders.push('(' + Array.from({length: columns.length}, () => '$' + ++pos).join(', ') + ')')
            mapFn(values, entity)
        }
        return this.db.query(
            `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders.join(', ')}`,
            values
        )
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


export class WritableSink implements Sink {
    private error?: Error
    private drainHandle?: {resolve: () => void, reject: (err: Error) => void}

    constructor(private writable: WritableStream) {
        this.writable.on('error', this.onError)
        this.writable.on('drain', this.onDrain)
    }

    close(): void {
        this.writable.off('error', this.onError)
        this.writable.off('drain', this.onDrain)
    }

    async write(block: BlockData): Promise<void> {
        if (this.error) throw this.error
        let json = JSON.stringify(toJSON(block))
        this.writable.write(json)
        let wait = !this.writable.write('\n')
        if (wait) {
            await this.drain()
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
