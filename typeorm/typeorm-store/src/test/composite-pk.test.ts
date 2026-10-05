import {TypeormDatabase} from '../database'
import {Versioned, VersionedWide} from './lib/model'
import {getEntityManager, useDatabase} from './util'

const SCHEMA = [
    `CREATE TABLE versioned (
        id text,
        "timestamp" timestamp with time zone,
        value text,
        PRIMARY KEY (id, "timestamp")
    )`,
    `CREATE TABLE versioned_wide (
        id text,
        "timestamp" timestamp with time zone,
        seq numeric,
        value text,
        PRIMARY KEY (id, "timestamp", seq)
    )`,
]

const T1 = new Date('2020-01-01T00:00:00.000Z')
const T2 = new Date('2020-01-02T00:00:00.000Z')

const HEAD0 = {height: -1, hash: '0x'}

async function rows(): Promise<{id: string; timestamp: Date; value: string | null}[]> {
    let em = await getEntityManager()
    return em.query('SELECT id, "timestamp", value FROM versioned ORDER BY id, "timestamp"')
}

describe('TypeormDatabase — composite primary keys', function () {
    useDatabase(SCHEMA)

    let db!: TypeormDatabase

    beforeEach(() => {
        db = new TypeormDatabase({projectDir: __dirname, supportHotBlocks: true})
    })

    afterEach(() => db?.disconnect())

    it('keeps rows sharing an id distinct', async function () {
        await db.connect()
        await db.transact({prevHead: HEAD0, nextHead: {height: 10, hash: '0x10'}}, async (store) => {
            await store.insert([
                new Versioned({id: 'a', timestamp: T1, value: 'first'}),
                new Versioned({id: 'a', timestamp: T2, value: 'second'}),
            ])
        })
        expect(await rows()).toMatchObject([
            {id: 'a', value: 'first'},
            {id: 'a', value: 'second'},
        ])
    })

    it('upsert targets the row with the matching full key', async function () {
        await db.connect()
        await db.transact({prevHead: HEAD0, nextHead: {height: 10, hash: '0x10'}}, async (store) => {
            await store.insert([
                new Versioned({id: 'a', timestamp: T1, value: 'first'}),
                new Versioned({id: 'a', timestamp: T2, value: 'second'}),
            ])
        })
        await db.transact(
            {prevHead: {height: 10, hash: '0x10'}, nextHead: {height: 20, hash: '0x20'}},
            async (store) => {
                await store.upsert(new Versioned({id: 'a', timestamp: T2, value: 'updated'}))
            },
        )
        // Only the T2 row moves — an ON CONFLICT (id) target would have
        // collapsed both rows into one instead.
        expect(await rows()).toMatchObject([
            {id: 'a', value: 'first'},
            {id: 'a', value: 'updated'},
        ])
    })

    describe('hot block rollback', function () {
        // Writes a hot block at height 20, then supersedes it with an
        // alternate block at the same height, forcing a rollback.
        async function rollbackHot(
            map: (store: any) => Promise<void>,
            base: {height: number; hash: string} = {height: 10, hash: '0x10'},
        ): Promise<void> {
            const hot = base.height + 1
            await db.transactHot(
                {baseHead: base, newBlocks: [{height: hot, hash: `0x${hot}`}], finalizedHead: base},
                async (store) => {
                    await map(store)
                },
            )
            await db.transactHot(
                {baseHead: base, newBlocks: [{height: hot, hash: `0x${hot}-alt`}], finalizedHead: base},
                async () => {},
            )
        }

        beforeEach(async () => {
            await db.connect()
            // Finalized state: one row at T1.
            await db.transact({prevHead: HEAD0, nextHead: {height: 10, hash: '0x10'}}, async (store) => {
                await store.insert(new Versioned({id: 'a', timestamp: T1, value: 'first'}))
            })
        })

        it('rolls back an insert without touching the sibling version', async function () {
            await rollbackHot(async (store) => {
                await store.insert(new Versioned({id: 'a', timestamp: T2, value: 'second'}))
            })
            // Keying the rollback DELETE on id alone would have taken the
            // finalized T1 row with it.
            expect(await rows()).toMatchObject([{id: 'a', value: 'first'}])
        })

        it('rolls back an update of one version only', async function () {
            await rollbackHot(async (store) => {
                await store.insert(new Versioned({id: 'a', timestamp: T2, value: 'second'}))
                await store.upsert(new Versioned({id: 'a', timestamp: T1, value: 'changed'}))
            })
            expect(await rows()).toMatchObject([{id: 'a', value: 'first'}])
        })

        it('distinguishes an insert from an update of a different version', async function () {
            // T1 exists and T2 does not: the tracker must record an update for
            // T1 and an insert for T2, not two updates keyed on the shared id.
            await rollbackHot(async (store) => {
                await store.upsert([
                    new Versioned({id: 'a', timestamp: T1, value: 'changed'}),
                    new Versioned({id: 'a', timestamp: T2, value: 'second'}),
                ])
            })
            expect(await rows()).toMatchObject([{id: 'a', value: 'first'}])
        })

        it('restores every version removed by an id-keyed delete', async function () {
            await db.transact(
                {prevHead: {height: 10, hash: '0x10'}, nextHead: {height: 11, hash: '0x11'}},
                async (store) => {
                    await store.insert(new Versioned({id: 'a', timestamp: T2, value: 'second'}))
                },
            )
            await rollbackHot(
                async (store) => {
                    await store.remove(Versioned, 'a')
                },
                {height: 11, hash: '0x11'},
            )
            expect(await rows()).toMatchObject([
                {id: 'a', value: 'first'},
                {id: 'a', value: 'second'},
            ])
        })

        it('restores versions removed by passing entity instances', async function () {
            await db.transact(
                {prevHead: {height: 10, hash: '0x10'}, nextHead: {height: 11, hash: '0x11'}},
                async (store) => {
                    await store.insert(new Versioned({id: 'a', timestamp: T2, value: 'second'}))
                },
            )
            // remove(entity) deletes by id, so every version of 'a' goes and
            // every one of them must come back.
            await rollbackHot(
                async (store) => {
                    await store.remove(new Versioned({id: 'a', timestamp: T2, value: 'second'}))
                },
                {height: 11, hash: '0x11'},
            )
            expect(await rows()).toMatchObject([
                {id: 'a', value: 'first'},
                {id: 'a', value: 'second'},
            ])
        })
    })

    describe('three-column key with a transformed column', function () {
        async function wideRows(): Promise<{id: string; seq: string; value: string | null}[]> {
            let em = await getEntityManager()
            return em.query('SELECT id, seq, value FROM versioned_wide ORDER BY id, "timestamp", seq')
        }

        beforeEach(async () => {
            await db.connect()
            await db.transact({prevHead: HEAD0, nextHead: {height: 10, hash: '0x10'}}, async (store) => {
                await store.insert([
                    new VersionedWide({id: 'a', timestamp: T1, seq: 1n, value: 'one'}),
                    new VersionedWide({id: 'a', timestamp: T1, seq: 2n, value: 'two'}),
                ])
            })
        })

        it('keeps rows differing only in the last key column', async function () {
            expect(await wideRows()).toMatchObject([
                {id: 'a', seq: '1', value: 'one'},
                {id: 'a', seq: '2', value: 'two'},
            ])
        })

        it('rolls back an insert, matching on all three columns', async function () {
            const base = {height: 10, hash: '0x10'}
            await db.transactHot(
                {baseHead: base, newBlocks: [{height: 11, hash: '0x11'}], finalizedHead: base},
                async (store) => {
                    await store.insert(new VersionedWide({id: 'a', timestamp: T1, seq: 3n, value: 'three'}))
                },
            )
            await db.transactHot(
                {baseHead: base, newBlocks: [{height: 11, hash: '0x11-alt'}], finalizedHead: base},
                async () => {},
            )
            expect(await wideRows()).toMatchObject([
                {id: 'a', seq: '1', value: 'one'},
                {id: 'a', seq: '2', value: 'two'},
            ])
        })

        it('rolls back an update of one row among siblings', async function () {
            const base = {height: 10, hash: '0x10'}
            await db.transactHot(
                {baseHead: base, newBlocks: [{height: 11, hash: '0x11'}], finalizedHead: base},
                async (store) => {
                    // Matching this against the stored row goes through the
                    // column transformer on `seq`, on both sides of the compare.
                    await store.upsert(new VersionedWide({id: 'a', timestamp: T1, seq: 2n, value: 'changed'}))
                },
            )
            await db.transactHot(
                {baseHead: base, newBlocks: [{height: 11, hash: '0x11-alt'}], finalizedHead: base},
                async () => {},
            )
            expect(await wideRows()).toMatchObject([
                {id: 'a', seq: '1', value: 'one'},
                {id: 'a', seq: '2', value: 'two'},
            ])
        })
    })
})
