import * as pg from "pg"
import {Block, Metadata, Event, Extrinsic, Call} from './model'


export interface SyncData {
    block: Block
    extrinsics: Extrinsic[]
    events: Event[]
    calls: Call[]
    metadata?: Metadata
}


export interface Sync {
    write(data: SyncData): Promise<void>
}


export class StdoutSync implements Sync {
    write(data: SyncData) {
        console.log(data)
        return Promise.resolve()
    }
}


export class PostgresSync implements Sync {
    constructor(private db: pg.ClientBase) {}

    write(data: SyncData) {
        return this.tx(async () => {
            if (data.metadata) {
                this.saveMetadata(data.metadata)
            }
            await this.saveBlock(data.block)
            for (const ex of data.extrinsics) {
                await this.saveExtrinsic(ex)
            }
            for (const call of data.calls) {
                await this.saveCall(call)
            }
            for (const event of data.events) {
                await this.saveEvent(event)
            }
        })
    }

    private saveMetadata(metadata: Metadata) {
        return this.db.query(
            "INSERT INTO metadata(spec_version, block_height, block_hash, hex) VALUES($1, $2, $3, $4)",
            [metadata.spec_version, metadata.block_height, metadata.block_hash, metadata.hex]
        )
    }

    private saveBlock(block: Block) {
        return this.db.query(
            "INSERT INTO block(id, height, hash, parent_hash, timestamp) VALUES($1, $2, $3, $4, $5)",
            [block.id, block.height, block.hash, block.parent_hash, block.timestamp]
        )
    }

    private saveExtrinsic(ex: Extrinsic) {
        console.log(ex)
        return this.db.query(
            "INSERT INTO extrinsic(id, block_id, index_in_block, name, signature, success, hash) VALUES($1, $2, $3, $4, $5, $6, $7)",
            [ex.id, ex.block_id, ex.index_in_block, ex.name, ex.signature, ex.success, ex.hash]
        )
    }

    private saveCall(call: Call) {
        return this.db.query(
            "INSERT INTO call(id, index, extrinsic_id, parent_id, success, args) VALUES($1, $2, $3, $4, $5, $6)",
            [call.id, call.index, call.extrinsic_id, call.parent_id, call.success, call.args]
        )
    }

    private saveEvent(e: Event) {
        return this.db.query(
            "INSERT INTO event(id, block_id, index_in_block, phase, extrinsic_id, call_id, name, args) VALUES($1, $2, $3, $4, $5, $6, $7, $8)",
            [e.id, e.block_id, e.index_in_block, e.phase, e.extrinsic_id, e.call_id, e.name, e.args]
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
