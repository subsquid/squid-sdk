import { createOrmConfig, getDbType } from '@subsquid/typeorm-config';
import {assertNotNull, last, maybeLast} from '@subsquid/util-internal'
import assert from 'assert'
import {DataSource, EntityManager} from 'typeorm'
import {ChangeTracker, rollbackBlock} from './hot'
import {DatabaseState, FinalTxInfo, HashAndHeight, HotTxInfo} from './interfaces'
import {Store} from './store'
import { paramName, normalizedType, tableName } from './dialects';


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

    async disconnect(): Promise<void> {
        await this.con?.destroy().finally(() => this.con = undefined)
    }

    private async initTransaction(em: EntityManager): Promise<DatabaseState> {
        if(getDbType() !== 'sqlite') {
            await em.query(
                `CREATE SCHEMA IF NOT EXISTS ${this.escapedSchema()}`
            )
        }

        const statusTable = tableName('status', this.escapedSchema())
        const hotBlockTable = tableName('hot_block', this.escapedSchema())

        await em.query(
            `CREATE TABLE IF NOT EXISTS ${statusTable} (` +
            `id ${normalizedType('int4').type} primary key, ` +
            `height ${normalizedType('int4').type} not null, ` +
            `hash text DEFAULT '0x', ` +
            `nonce ${normalizedType('int4').type} DEFAULT 0`+
            `)`
        )

        if(getDbType() !== 'sqlite') {
            await em.query( // for databases created by prev version of typeorm store
                `ALTER TABLE ${statusTable} ADD COLUMN IF NOT EXISTS hash text DEFAULT '0x'`
            )
            await em.query( // for databases created by prev version of typeorm store
                `ALTER TABLE ${statusTable} ADD COLUMN IF NOT EXISTS nonce int DEFAULT 0`
            )
        }

        await em.query(
            `CREATE TABLE IF NOT EXISTS ${hotBlockTable} (height ${normalizedType('int4').type} primary key, hash text not null)`
        )


        await em.query(
            `CREATE TABLE IF NOT EXISTS ${tableName('hot_change_log', this.escapedSchema())} (` +
            `"block_height" ${normalizedType('int4').type}   not null references ${hotBlockTable}(height) on delete cascade,` +
            `"index"        ${normalizedType('int4').type}   not null, ` +
            // We can't use normalizedType here, because it produces internal 'simple-json',
            // which isn't working with raw queries
            `"change"       ${getDbType() === 'sqlite' ? 'text' : 'jsonb'}  not null, ` +

            `PRIMARY KEY ("block_height", "index")` +
            `)`
        )
        let status: (HashAndHeight & {nonce: number})[] = await em.query(
            `SELECT height, hash, nonce FROM ${statusTable} WHERE id = 0`
        )
        if (status.length == 0) {
            await em.query(`INSERT INTO ${statusTable} (id, height, hash) VALUES (0, -1, '0x')`)
            status.push({height: -1, hash: '0x', nonce: 0})
        }

        let top: HashAndHeight[] = await em.query(
            `SELECT height, hash FROM ${hotBlockTable} ORDER BY height`
        )

        return assertStateInvariants({...status[0], top})
    }

    private async getState(em: EntityManager): Promise<DatabaseState> {
        const statusTable = tableName('status', this.escapedSchema())
        const hotBlockTable = tableName('hot_block', this.escapedSchema())

        let status: (HashAndHeight & {nonce: number})[] = await em.query(
            `SELECT height, hash, nonce FROM ${statusTable} WHERE id = 0`
        )

        assert(status.length == 1)

        let top: HashAndHeight[] = await em.query(
            `SELECT hash, height FROM ${hotBlockTable} ORDER BY height`
        )

        return assertStateInvariants({...status[0], top})
    }

    transact(info: FinalTxInfo, cb: (store: Store) => Promise<void>): Promise<void> {
        return this.submit(async em => {
            let state = await this.getState(em)
            let {prevHead: prev, nextHead: next} = info

            assert(state.hash === info.prevHead.hash, RACE_MSG)
            assert(state.height === prev.height)
            assert(prev.height < next.height)
            assert(prev.hash != next.hash)

            for (let i = state.top.length - 1; i >= 0; i--) {
                let block = state.top[i]
                await rollbackBlock(this.escapedSchema(), em, block.height)
            }

            await this.performUpdates(cb, em)

            await this.updateStatus(em, state.nonce, next)
        })
    }

    transactHot(info: HotTxInfo, cb: (store: Store, block: HashAndHeight) => Promise<void>): Promise<void> {
        return this.transactHot2(info, async (store, sliceBeg, sliceEnd) => {
            for (let i = sliceBeg; i < sliceEnd; i++) {
                await cb(store, info.newBlocks[i])
            }
        })
    }

    transactHot2(info: HotTxInfo, cb: (store: Store, sliceBeg: number, sliceEnd: number) => Promise<void>): Promise<void> {
        return this.submit(async em => {
            let state = await this.getState(em)
            let chain = [state, ...state.top]

            assertChainContinuity(info.baseHead, info.newBlocks)
            assert(info.finalizedHead.height <= (maybeLast(info.newBlocks) ?? info.baseHead).height)

            assert(chain.find(b => b.hash === info.baseHead.hash), RACE_MSG)
            if (info.newBlocks.length == 0) {
                assert(last(chain).hash === info.baseHead.hash, RACE_MSG)
            }
            assert(chain[0].height <= info.finalizedHead.height, RACE_MSG)

            let rollbackPos = info.baseHead.height + 1 - chain[0].height

            for (let i = chain.length - 1; i >= rollbackPos; i--) {
                await rollbackBlock(this.escapedSchema(), em, chain[i].height)
            }

            if (info.newBlocks.length) {
                let finalizedEnd = info.finalizedHead.height - info.newBlocks[0].height + 1
                if (finalizedEnd > 0) {
                    await this.performUpdates(store => cb(store, 0, finalizedEnd), em)
                } else {
                    finalizedEnd = 0
                }
                for (let i = finalizedEnd; i < info.newBlocks.length; i++) {
                    let b = info.newBlocks[i]
                    await this.insertHotBlock(em, b)
                    await this.performUpdates(
                        store => cb(store, i, i + 1),
                        em,
                        new ChangeTracker(em, this.escapedSchema(), b.height)
                    )
                }
            }

            chain = chain.slice(0, rollbackPos).concat(info.newBlocks)

            let finalizedHeadPos = info.finalizedHead.height - chain[0].height
            assert(chain[finalizedHeadPos].hash === info.finalizedHead.hash)
            await this.deleteHotBlocks(em, info.finalizedHead.height)

            await this.updateStatus(em, state.nonce, info.finalizedHead)
        })
    }

    private async deleteHotBlocks(em: EntityManager, finalizedHeight: number): Promise<void> {
        await em.query(
            `DELETE FROM ${tableName('hot_block', this.escapedSchema())} WHERE height <= ${paramName(1)}`,
            [finalizedHeight]
        )
    }

    private insertHotBlock(em: EntityManager, block: HashAndHeight): Promise<void> {
        return em.query(
            `INSERT INTO ${tableName('hot_block', this.escapedSchema())} (height, hash) VALUES (${paramName(1)}, ${paramName(2)})`,
            [block.height, block.hash]
        )
    }

    private async updateStatus(em: EntityManager, nonce: number, next: HashAndHeight): Promise<void> {
        let result: [data: any[], rowsChanged: number] = await em.query(
            `UPDATE ${tableName('status', this.escapedSchema())} SET
                height = ${paramName(1)},
                hash = ${paramName(2)}, 
                nonce = nonce + 1
             WHERE id = 0 AND nonce = ${paramName(3)}`,
            [next.height, next.hash, nonce]
        )

        // Will never happen in cockroachdb or (???) sqlite
        if(getDbType() === 'sqlite' || getDbType() === 'cockroachdb') return

        let rowsChanged = result[1]

        // Will never happen if isolation level is SERIALIZABLE or REPEATABLE_READ,
        // but occasionally people use multiprocessor setups and READ_COMMITTED.
        assert.strictEqual(
            rowsChanged,
            1,
            RACE_MSG
        )
    }

    private async performUpdates(
        cb: (store: Store) => Promise<void>,
        em: EntityManager,
        changeTracker?: ChangeTracker
    ): Promise<void> {
        let running = true

        let store = new Store(
            () => {
                assert(running, `too late to perform db updates, make sure you haven't forgot to await on db query`)
                return em
            },
            changeTracker
        )

        try {
            await cb(store)
        } finally {
            running = false
        }
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
        let con = assertNotNull(this.con, "")

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
