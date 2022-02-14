import * as pg from "pg"
import {Block, Metadata, Event, Extrinsic, Call} from './model'
import {toJsonString} from "./util"


export interface SyncData {
    block: Block
    extrinsics: Extrinsic[]
    events: Event[]
    calls: Call[]
    metadata?: Metadata
}


export class Sync {
    constructor(private db: pg.ClientBase) {}

    write(data: SyncData) {
        return this.tx(async () => {
            if (data.metadata) {
                this.saveMetadata(data.metadata)
            }
            await this.saveBlock(data.block)
            await this.saveExtrinsics(data.extrinsics)
            await this.saveCalls(data.calls)
            await this.saveEvents(data.events)
        })
    }

    private saveMetadata(metadata: Metadata) {
        return this.db.query(
            "INSERT INTO metadata (spec_version, block_height, block_hash, hex) VALUES ($1, $2, $3, $4)",
            [metadata.spec_version, metadata.block_height, metadata.block_hash, metadata.hex]
        )
    }

    private saveBlock(block: Block) {
        return this.db.query(
            "INSERT INTO block (id, height, hash, parent_hash, timestamp) VALUES ($1, $2, $3, $4, $5)",
            [block.id, block.height, block.hash, block.parent_hash, block.timestamp]
        )
    }

    private saveExtrinsics(extrinsics: Extrinsic[]) {
        let columns = ['id', 'block_id', 'index_in_block', 'name', 'signature', 'success', 'hash']
        return this.insertMany('extrinsic', columns, extrinsics, (values, ex) => {
            values.push(ex.id, ex.block_id, ex.index_in_block, ex.name, toJsonString(ex.signature), ex.success, ex.hash)
        })
    }

    private saveCalls(calls: Call[]) {
        let columns = ['id', 'index', 'extrinsic_id', 'parent_id', 'success', 'args']
        return this.insertMany('call', columns, calls, (values, call) => {
            values.push(call.id, call.index, call.extrinsic_id, call.parent_id, call.success, toJsonString(call.args))
        })
    }

    private saveEvents(events: Event[]) {
        let columns = ['id', 'block_id', 'index_in_block', 'phase', 'extrinsic_id', 'call_id', 'name', 'args']
        return this.insertMany('event', columns, events, (values, e) => {
            values.push(e.id, e.block_id, e.index_in_block, e.phase, e.extrinsic_id, e.call_id, e.name, toJsonString(e.args))
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
