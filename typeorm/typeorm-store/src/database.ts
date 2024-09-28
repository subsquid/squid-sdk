import {createOrmConfig} from '@subsquid/typeorm-config'
import {assertNotNull, last, maybeLast} from '@subsquid/util-internal'
import assert from 'assert'
import {DataSource, EntityManager} from 'typeorm'
import {ChangeTracker} from './hot'
import {DatabaseState, HashAndHeight} from './interfaces'
import {Store} from './store'


export type IsolationLevel = 'SERIALIZABLE' | 'READ COMMITTED' | 'REPEATABLE READ'


export interface TypeormDatabaseOptions {
    supportHotBlocks?: boolean
    isolationLevel?: IsolationLevel
    stateSchema?: string
    projectDir?: string
}


export class TypeormDatabase {
    private statusSchema: string
    private isolationLevel: IsolationLevel
    private con?: DataSource
    private projectDir: string

    public readonly supportsHotBlocks: boolean

    constructor(options?: TypeormDatabaseOptions) {
        this.statusSchema = options?.stateSchema || 'squid_processor'
        this.isolationLevel = options?.isolationLevel || 'SERIALIZABLE'
        this.supportsHotBlocks = options?.supportHotBlocks !== false
        this.projectDir = options?.projectDir || process.cwd()
    }

    async connect(): Promise<DatabaseState> {
        assert(this.con == null, 'already connected')

        let cfg = createOrmConfig({projectDir: this.projectDir})
        this.con = new DataSource(cfg)

        await this.con.initialize()

        try {
            return await this.con.transaction('SERIALIZABLE', em => this.initTransaction(em))
        } catch(e: any) {
            await this.con.destroy().catch(() => {}) // ignore error
            this.con = undefined
            throw e
        }
    }

    async transaction(cb: (tx: Transaction) => Promise<void>): Promise<void> {
        return this.submit(em => cb(new Transaction(em, this.statusSchema)))
    }

    async disconnect(): Promise<void> {
        await this.con?.destroy().finally(() => this.con = undefined)
    }

    private async initTransaction(em: EntityManager): Promise<DatabaseState> {
        let schema = this.escapedSchema()

        await em.query(
            `CREATE SCHEMA IF NOT EXISTS ${schema}`
        )
        await em.query(
            `CREATE TABLE IF NOT EXISTS ${schema}.status (` +
            `id int4 primary key, ` +
            `height int4 not null, ` +
            `hash text DEFAULT '0x', ` +
            `nonce int4 DEFAULT 0`+
            `)`
        )
        await em.query( // for databases created by prev version of typeorm store
            `ALTER TABLE ${schema}.status ADD COLUMN IF NOT EXISTS hash text DEFAULT '0x'`
        )
        await em.query( // for databases created by prev version of typeorm store
            `ALTER TABLE ${schema}.status ADD COLUMN IF NOT EXISTS nonce int DEFAULT 0`
        )
        await em.query(
            `CREATE TABLE IF NOT EXISTS ${schema}.hot_block (height int4 primary key, hash text not null)`
        )
        await em.query(
            `CREATE TABLE IF NOT EXISTS ${schema}.hot_change_log (` +
            `block_height int4 not null references ${schema}.hot_block on delete cascade, ` +
            `index int4 not null, ` +
            `change jsonb not null, ` +
            `PRIMARY KEY (block_height, index)` +
            `)`
        )

        let status: (HashAndHeight & {nonce: number})[] = await em.query(
            `SELECT height, hash, nonce FROM ${schema}.status WHERE id = 0`
        )
        if (status.length == 0) {
            await em.query(`INSERT INTO ${schema}.status (id, height, hash) VALUES (0, -1, '0x')`)
            status.push({height: -1, hash: '0x', nonce: 0})
        }

        let top: HashAndHeight[] = await em.query(
            `SELECT height, hash FROM ${schema}.hot_block ORDER BY height`
        )

        return assertStateInvariants({...status[0], top})
    }

    private async submit(tx: (em: EntityManager) => Promise<void>): Promise<void> {
        let retries = 3
        while (true) {
            try {
                let con = this.con
                assert(con != null, 'not connected')
                return await con.transaction(this.isolationLevel, tx)
            } catch(e: any) {
                if (e.code == '40001' && retries) {
                    retries -= 1
                } else {
                    throw e
                }
            }
        }
    }

    private escapedSchema(): string {
        let con = assertNotNull(this.con)
        return con.driver.escape(this.statusSchema)
    }
}


export class Transaction {
    private hotHeight?: number 

    constructor(
        private em: EntityManager,
        private statusSchema: string
    ) {}

    async getState(): Promise<DatabaseState> {
        let schema = this.escapedSchema()

        let status: (HashAndHeight & {nonce: number})[] = await this.em.query(
            `SELECT height, hash, nonce FROM ${schema}.status WHERE id = 0`
        )

        assert(status.length == 1)

        let top: HashAndHeight[] = await this.em.query(
            `SELECT hash, height FROM ${schema}.hot_block ORDER BY height`
        )

        return assertStateInvariants({...status[0], top})
    }

    async performUpdates(
        cb: (store: Store) => Promise<void>,
        
    ): Promise<void> {
        let running = true

        let store = new Store(
            () => {
                assert(running, `too late to perform db updates, make sure you haven't forgot to await on db query`)
                return this.em
            },
            this.hotHeight != null ? new ChangeTracker(this.em, this.statusSchema, this.hotHeight) : undefined
        )

        try {
            await cb(store)
        } finally {
            running = false
        }
    }

    async updateStatus(next: HashAndHeight): Promise<void> {
        let schema = this.escapedSchema()

        let result: [data: any[], rowsChanged: number] = await this.em.query(
            `UPDATE ${schema}.status SET height = $1, hash = $2, nonce = nonce + 1 WHERE id = 0`,
            [next.height, next.hash]
        )

        let rowsChanged = result[1]

        // Will never happen if isolation level is SERIALIZABLE or REPEATABLE_READ,
        // but occasionally people use multiprocessor setups and READ_COMMITTED.
        assert.strictEqual(
            rowsChanged,
            1,
            RACE_MSG
        )
    }

    finalizeHotBlocks(finalizedHeight: number): Promise<void> {
        if (this.hotHeight != null && finalizedHeight >= this.hotHeight) {
            this.hotHeight = undefined
        }
        return this.em.query(
            `DELETE FROM ${this.escapedSchema()}.hot_block WHERE height <= $1`,
            [finalizedHeight]
        )
    }

    insertHotBlock(block: HashAndHeight): Promise<void> {
        assert(this.hotHeight == null || this.hotHeight < block.height)
        this.hotHeight = block.height
        return this.em.query(
            `INSERT INTO ${this.escapedSchema()}.hot_block (height, hash) VALUES ($1, $2)`,
            [block.height, block.hash]
        )
    }

    private escapedSchema(): string {
        let con = assertNotNull(this.em.connection)
        return con.driver.escape(this.statusSchema)
    }
}


const RACE_MSG = 'status table was updated by foreign process, make sure no other processor is running'


function assertStateInvariants(state: DatabaseState): DatabaseState {
    let height = state.height

    // Sanity check. Who knows what driver will return?
    assert(Number.isSafeInteger(height))

    assertChainContinuity(state, state.top)

    return state
}


function assertChainContinuity(base: HashAndHeight, chain: HashAndHeight[]) {
    let prev = base
    for (let b of chain) {
        assert(b.height === prev.height + 1, 'blocks must form a continues chain')
        prev = b
    }
}
