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

    private async saveExtrinsics(extrinsics: Extrinsic[]) {
        for (let ex of extrinsics) {
            await this.db.query(
                `INSERT INTO extrinsic (id, block_id, index_in_block, name, signature, success, hash) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    ex.id, ex.block_id, ex.index_in_block, ex.name, toJSON(ex.signature), ex.success, ex.hash
                ]
            )
        }
    }

    private async saveCalls(calls: Call[]) {
        for (let call of calls) {
            await this.db.query(
                `INSERT INTO call (id, index, name, extrinsic_id, parent_id, success, args) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)`,
                [
                    call.id, call.index, call.name, call.extrinsic_id, call.parent_id, call.success, JSON.stringify(toJSON(call.args))
                ]
            )
        }
    }

    private async saveEvents(events: Event[]) {
        for (let e of events) {
            await this.db.query(
                `INSERT INTO event (id, block_id, index_in_block, name, phase, extrinsic_id, call_id, args) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
                [
                    e.id, e.block_id, e.index_in_block, e.name, e.phase, e.extrinsic_id, e.call_id, JSON.stringify(toJSON(e.args))
                ]
            )
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
