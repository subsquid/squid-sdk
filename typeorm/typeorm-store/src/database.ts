import {createOrmConfig} from '@subsquid/typeorm-config'
import {assertNotNull, last, maybeLast} from '@subsquid/util-internal'
import assert from 'assert'
import {DataSource, EntityManager} from 'typeorm'
import {ChangeTracker, rollbackBlock} from './hot'
import {DatabaseState, FinalTxInfo, HashAndHeight, HotTxInfo} from './interfaces'
import {Store} from './store'

export type IsolationLevel = 'SERIALIZABLE' | 'READ COMMITTED' | 'REPEATABLE READ'

export interface TypeormDatabaseOptions {
    supportHotBlocks?: boolean
    isolationLevel?: IsolationLevel
    stateSchema?: string
    projectDir?: string
}

export class TypeormDatabase implements Database<Store> {
    private statusSchema: string
    private isolationLevel: IsolationLevel
    private con?: DataSource
    private projectDir: string
    private nonce: number = 0

    public readonly supportsHotBlocks: boolean

    constructor(options?: TypeormDatabaseOptions) {
        this.statusSchema = options?.stateSchema || 'squid_processor'
        this.isolationLevel = options?.isolationLevel || 'SERIALIZABLE'
        this.supportsHotBlocks = options?.supportHotBlocks !== false
        this.projectDir = options?.projectDir || process.cwd()
    }

    async getHead(): Promise<BlockRef | undefined> {
        if (this.con == null) {
            await this.connect()
        }

        return this._getHead(this.con!.manager)
    }

    async getFinalizedHead(): Promise<BlockRef | undefined> {
        if (this.con == null) {
            await this.connect()
        }

        return this._getFinalizedHead(this.con!.manager)
    }

    async getUnfinalizedBlocks(top: number): Promise<BlockRef[]> {
        if (this.con == null) {
            await this.connect()
        }

        return this._getUnfinalizedBlocks(this.con!.manager, top)
    }

    async commit(cb: (tx: DatabaseTransaction<Store>) => Promise<void>): Promise<void> {
        if (this.con == null) {
            await this.connect()
        }

        return this.submit(async (em) => {
            let prevHead = await this._getHead(em)
            let prevFinalizedHead = await this._getFinalizedHead(em)

            await cb({
                prevHead,
                prevFinalizedHead,
                finalize: async (head: BlockRef) => this._finalize(em, head),
                rollback: async (baseBlock: number) => this._rollback(em, baseBlock),
                processFinalizedBlocks: (lastBlock: BlockRef, cb: (store: Store) => Promise<void>) =>
                    this._processFinalizedBlocks(em, lastBlock, cb),
                processUnfinalizedBlocks: (block: BlockRef, cb: (store: Store) => Promise<void>) =>
                    this._processUnfinalizedBlocks(em, block, cb),
            })
        })
    }

    async connect(): Promise<DatabaseState> {
        assert(this.con == null, 'already connected')

        let cfg = createOrmConfig({projectDir: this.projectDir})
        this.con = new DataSource(cfg)

        await this.con.initialize()

        try {
            return await this.con.transaction('SERIALIZABLE', (em) => this.initTransaction(em))
        } catch (e: any) {
            await this.con.destroy().catch(() => {}) // ignore error
            this.con = undefined
            throw e
        }
    }

    async disconnect(): Promise<void> {
        await this.con?.destroy().finally(() => (this.con = undefined))
    }

    private async initTransaction(em: EntityManager): Promise<DatabaseState> {
        let schema = this.escapedSchema()

        await em.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`)
        await em.query(
            `CREATE TABLE IF NOT EXISTS ${schema}.status (` +
                `id int4 primary key, ` +
                `height int4 not null, ` +
                `hash text DEFAULT '0x', ` +
                `nonce int4 DEFAULT 0` +
                `)`
        )
        await em.query(
            // for databases created by prev version of typeorm store
            `ALTER TABLE ${schema}.status ADD COLUMN IF NOT EXISTS hash text DEFAULT '0x'`
        )
        await em.query(
            // for databases created by prev version of typeorm store
            `ALTER TABLE ${schema}.status ADD COLUMN IF NOT EXISTS nonce int DEFAULT 0`
        )
        await em.query(`CREATE TABLE IF NOT EXISTS ${schema}.hot_block (height int4 primary key, hash text not null)`)
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
        this.nonce = status[0].nonce

        let top: HashAndHeight[] = await em.query(`SELECT height, hash FROM ${schema}.hot_block ORDER BY height`)

        return assertStateInvariants({...status[0], top})
    }

    private async getState(em: EntityManager): Promise<DatabaseState> {
        let schema = this.escapedSchema()

        let status: (HashAndHeight & {nonce: number})[] = await em.query(
            `SELECT height, hash, nonce FROM ${schema}.status WHERE id = 0`
        )

        assert(status.length == 1)

        let top: HashAndHeight[] = await em.query(`SELECT hash, height FROM ${schema}.hot_block ORDER BY height`)

        return assertStateInvariants({...status[0], top})
    }

    private async _getFinalizedHead(em: EntityManager): Promise<BlockRef | undefined> {
        let schema = this.escapedSchema()

        let finalizedHead = await em.query<BlockRef[]>(
            `SELECT height as "number", hash FROM ${schema}.status WHERE id = 0`
        )
        return fixHead(finalizedHead[0])
    }

    private async _getUnfinalizedBlocks(em: EntityManager, top: number): Promise<BlockRef[]> {
        let schema = this.escapedSchema()

        let blocks = await em.query<BlockRef[]>(`SELECT hash, height as "number" FROM ${schema}.hot_block WHERE height <= ${top} ORDER BY height`)
        return blocks
    }

    private async _getHead(em: EntityManager): Promise<BlockRef | undefined> {
        let schema = this.escapedSchema()

        let head = await em.query<BlockRef[]>(
            `(SELECT hash, height as "number" FROM ${schema}.hot_block ORDER BY height DESC LIMIT 1)
                UNION ALL
                (SELECT hash, height as "number" FROM ${schema}.status WHERE id = 0 LIMIT 1)
                LIMIT 1`,
        )
        return fixHead(head[0])
    }

    private async _finalize(em: EntityManager, head: BlockRef) {
        await this.deleteHotBlocks(em, head.number)
        await this.updateStatus(em, {hash: head.hash, height: head.number})
    }

    private async _rollback(em: EntityManager, baseBlock: number) {
        let schema = this.escapedSchema()

        let hotBlocks = await em.query(`SELECT height FROM ${schema}.hot_block WHERE height > $1 ORDER BY height DESC`, [baseBlock])
        for (let block of hotBlocks) {
            await rollbackBlock(this.statusSchema, em, block.height)
        }
    }

    private async _processFinalizedBlocks(em: EntityManager, lastBlock: BlockRef, cb: (store: Store) => Promise<void>) {
        await this.performUpdates(cb, em)
        await this._finalize(em, lastBlock)
    }

    private async _processUnfinalizedBlocks(em: EntityManager, block: BlockRef, cb: (store: Store) => Promise<void>) {
        await this.insertHotBlock(em, {hash: block.hash, height: block.number})
        await this.performUpdates(cb, em, new ChangeTracker(em, this.statusSchema, block.number))
    }

    transact(info: FinalTxInfo, cb: (store: Store) => Promise<void>): Promise<void> {
        return this.submit(async (em) => {
            let state = await this.getState(em)
            let {prevHead: prev, nextHead: next} = info

            assert(state.hash === info.prevHead.hash, RACE_MSG)
            assert(state.height === prev.height)
            assert(prev.height < next.height)
            assert(prev.hash != next.hash)

            for (let i = state.top.length - 1; i >= 0; i--) {
                let block = state.top[i]
                await rollbackBlock(this.statusSchema, em, block.height)
            }

            await this.performUpdates(cb, em)

            await this.updateStatus(em, next)
        })
    }

    transactHot(info: HotTxInfo, cb: (store: Store, block: HashAndHeight) => Promise<void>): Promise<void> {
        return this.transactHot2(info, async (store, sliceBeg, sliceEnd) => {
            for (let i = sliceBeg; i < sliceEnd; i++) {
                await cb(store, info.newBlocks[i])
            }
        })
    }

    transactHot2(
        info: HotTxInfo,
        cb: (store: Store, sliceBeg: number, sliceEnd: number) => Promise<void>
    ): Promise<void> {
        return this.submit(async (em) => {
            let state = await this.getState(em)
            let chain = [state, ...state.top]

            assertChainContinuity(info.baseHead, info.newBlocks)
            assert(info.finalizedHead.height <= (maybeLast(info.newBlocks) ?? info.baseHead).height)

            assert(
                chain.find((b) => b.hash === info.baseHead.hash),
                RACE_MSG
            )
            if (info.newBlocks.length == 0) {
                assert(last(chain).hash === info.baseHead.hash, RACE_MSG)
            }
            assert(chain[0].height <= info.finalizedHead.height, RACE_MSG)

            let rollbackPos = info.baseHead.height + 1 - chain[0].height

            for (let i = chain.length - 1; i >= rollbackPos; i--) {
                await rollbackBlock(this.statusSchema, em, chain[i].height)
            }

            if (info.newBlocks.length) {
                let finalizedEnd = info.finalizedHead.height - info.newBlocks[0].height + 1
                if (finalizedEnd > 0) {
                    await this.performUpdates((store) => cb(store, 0, finalizedEnd), em)
                } else {
                    finalizedEnd = 0
                }
                for (let i = finalizedEnd; i < info.newBlocks.length; i++) {
                    let b = info.newBlocks[i]
                    await this.insertHotBlock(em, b)
                    await this.performUpdates(
                        (store) => cb(store, i, i + 1),
                        em,
                        new ChangeTracker(em, this.statusSchema, b.height)
                    )
                }
            }

            chain = chain.slice(0, rollbackPos).concat(info.newBlocks)

            let finalizedHeadPos = info.finalizedHead.height - chain[0].height
            assert(chain[finalizedHeadPos].hash === info.finalizedHead.hash)
            await this.deleteHotBlocks(em, info.finalizedHead.height)

            await this.updateStatus(em, info.finalizedHead)
        })
    }

    private deleteHotBlocks(em: EntityManager, finalizedHeight: number): Promise<void> {
        return em.query(`DELETE FROM ${this.escapedSchema()}.hot_block WHERE height <= $1`, [finalizedHeight])
    }

    private insertHotBlock(em: EntityManager, block: HashAndHeight): Promise<void> {
        return em.query(`INSERT INTO ${this.escapedSchema()}.hot_block (height, hash) VALUES ($1, $2)`, [
            block.height,
            block.hash,
        ])
    }

    private async updateStatus(em: EntityManager, next: HashAndHeight): Promise<void> {
        let schema = this.escapedSchema()

        let result: [data: any[], rowsChanged: number] = await em.query(
            `UPDATE ${schema}.status SET height = $1, hash = $2, nonce = nonce + 1 WHERE id = 0 AND nonce = $3`,
            [next.height, next.hash, this.nonce]
        )

        let rowsChanged = result[1]
        this.nonce += 1

        // Will never happen if isolation level is SERIALIZABLE or REPEATABLE_READ,
        // but occasionally people use multiprocessor setups and READ_COMMITTED.
        assert.strictEqual(rowsChanged, 1, RACE_MSG)
    }

    private async performUpdates(
        cb: (store: Store) => Promise<void>,
        em: EntityManager,
        changeTracker?: ChangeTracker
    ): Promise<void> {
        let running = true

        let store = new Store(() => {
            assert(running, `too late to perform db updates, make sure you haven't forgot to await on db query`)
            return em
        }, changeTracker)

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
            } catch (e: any) {
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

export interface BlockRef {
    number: number
    hash: string
}

export interface DatabaseTransaction<S> {
    /**
     * Last finalized head at the start of transaction
     */
    readonly prevFinalizedHead: BlockRef | undefined
    /**
     * Last commited block at the start of transaction
     */
    readonly prevHead: BlockRef | undefined
    /**
     * Revert database to the state, that it had after `baseBlock` were processed.
     *
     * Pass `-1` to revert everything
     */
    rollback(baseBlock: number): Promise<void>
    /**
     * Move the finalized head to `head`
     *
     * `.submitFinalizedBlockBatch()` should be called instead of this method to achieve the same effect,
     * when there are final blocks to commit, that lie above the current database head.
     */
    finalize(head: BlockRef): Promise<void>
    /**
     * Persist updates from a batch of finalized blocks where the last block is `lastBlock`.
     *
     * Moves both the head and finalized head to `lastBlock`.
     */
    processFinalizedBlocks(lastBlock: BlockRef, cb: (store: S) => Promise<void>): Promise<void>
    /**
     * Persist updates from a batch of unfinalized blocks where the last block is `lastBlock`.
     *
     * Moves the database head to `block`.
     */
    processUnfinalizedBlocks(block: BlockRef, cb: (store: S) => Promise<void>): Promise<void>
}

export interface Database<S> {
    /**
     * Last commited block
     */
    getHead(): Promise<BlockRef | undefined>
    /**
     * Last commited finalized head
     */
    getFinalizedHead(): Promise<BlockRef | undefined>
    /**
     * Get the list of unfinalized blocks such as `block.number <= top`.
     *
     * Implementations may limit the number of returned blocks
     * and are not required to give all at once.
     *
     * Block sequence returned by this method may have gaps.
     */
    getUnfinalizedBlocks(top: number): Promise<BlockRef[]>
    /**
     * Perform database transaction.
     *
     * Callback might be called multiple times due to optimistic update conflict
     * or any other retryable error.
     */
    commit(cb: (tx: DatabaseTransaction<S>) => Promise<void>): Promise<void>
}

function fixHead(head?: BlockRef) {
    return head === undefined || head.number === -1 ? undefined : head
}