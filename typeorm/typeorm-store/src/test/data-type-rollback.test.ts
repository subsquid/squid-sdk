import {TypeormDatabase} from '../database'
import {Data, Item} from './lib/model'
import {getEntityManager, useDatabase} from './util'

// Schema matches lib/model.ts. The only non-default bit is `item_id text
// references item on delete cascade` — required for the FK-cascade test
// below. Every other test in this file also runs against this schema but
// doesn't exercise the cascade, so the addition is a no-op for them.
const SCHEMA = [
    'CREATE TABLE item (id text primary key, name text)',
    `CREATE TABLE "data" (
        id text primary key,
        "text" text,
        text_array text[],
        "integer" int4,
        integer_array int4[],
        big_integer numeric,
        date_time timestamp with time zone,
        "bytes" bytea,
        "json" jsonb,
        item_id text references item on delete cascade
    )`,
]

describe('TypeormDatabase — data-type rollback fidelity', function () {
    useDatabase(SCHEMA)

    let db!: TypeormDatabase

    beforeEach(() => {
        db = new TypeormDatabase({projectDir: __dirname, supportHotBlocks: true})
    })

    afterEach(() => db?.disconnect())

    // Helper: run a hot block that writes data, then roll it back by
    // applying an alternate hot block at the same height.
    async function runThenRollback(
        prevHead: {height: number; hash: string},
        blockHash: string,
        altHash: string,
        map: (store: {
            insert: (entity: Data | Data[]) => Promise<void>
            save: (entity: Data | Data[]) => Promise<void>
            remove: (entity: Data | Data[] | typeof Data, id?: string | string[]) => Promise<void>
        }) => Promise<void>,
    ): Promise<void> {
        const nextHeight = prevHead.height + 1
        await db.transactHot(
            {
                baseHead: prevHead,
                newBlocks: [{height: nextHeight, hash: blockHash}],
                finalizedHead: prevHead,
            },
            async (store) => {
                await map(store as never)
            },
        )
        // Alternate branch — triggers rollback of the hot block just written.
        await db.transactHot(
            {
                baseHead: prevHead,
                newBlocks: [{height: nextHeight, hash: altHash}],
                finalizedHead: prevHead,
            },
            async () => {},
        )
    }

    describe('same-row multi-op within a single hot block', () => {
        it('insert → update → rollback leaves no trace', async () => {
            await db.connect()
            const em = await getEntityManager()

            await runThenRollback({height: -1, hash: '0x'}, 'h-0', 'h-0-alt', async (store) => {
                await store.insert(new Data({id: 'x', text: 'a', integer: 1}))
                await store.save(new Data({id: 'x', text: 'b', integer: 2}))
            })

            expect(await em.count(Data)).toBe(0)
        })

        it('insert → delete → rollback leaves no trace', async () => {
            await db.connect()
            const em = await getEntityManager()

            await runThenRollback({height: -1, hash: '0x'}, 'h-0', 'h-0-alt', async (store) => {
                await store.insert(new Data({id: 'x', text: 'a'}))
                await store.remove(Data, 'x')
            })

            expect(await em.count(Data)).toBe(0)
        })

        it('update → update → rollback restores the pre-block values', async () => {
            await db.connect()

            await db.transact(
                {prevHead: {height: -1, hash: '0x'}, nextHead: {height: 10, hash: 'h-10'}},
                async (store) => {
                    await store.insert(new Data({id: 'x', text: 'ORIG', integer: 100}))
                },
            )

            await runThenRollback({height: 10, hash: 'h-10'}, 'h-11', 'h-11-alt', async (store) => {
                await store.save(new Data({id: 'x', text: 'v1', integer: 1}))
                await store.save(new Data({id: 'x', text: 'v2', integer: 2}))
            })

            const em = await getEntityManager()
            const row = await em.findOneOrFail(Data, {where: {id: 'x'}})
            expect(row.text).toBe('ORIG')
            expect(row.integer).toBe(100)
        })

        it('delete → insert → rollback restores the original row', async () => {
            await db.connect()

            await db.transact(
                {prevHead: {height: -1, hash: '0x'}, nextHead: {height: 10, hash: 'h-10'}},
                async (store) => {
                    await store.insert(new Data({id: 'x', text: 'ORIG', integer: 100}))
                },
            )

            await runThenRollback({height: 10, hash: 'h-10'}, 'h-11', 'h-11-alt', async (store) => {
                await store.remove(Data, 'x')
                await store.insert(new Data({id: 'x', text: 'REPLACED', integer: 999}))
            })

            const em = await getEntityManager()
            const row = await em.findOneOrFail(Data, {where: {id: 'x'}})
            expect(row.text).toBe('ORIG')
            expect(row.integer).toBe(100)
        })
    })

    describe('null / type rollback fidelity', () => {
        it('reverts non-null → null updates for every scalar and array type', async () => {
            await db.connect()

            const original = new Data({
                id: 'x',
                text: 'hello',
                textArray: ['a', 'b', 'c'],
                integer: 42,
                integerArray: [1, 2, 3],
                bigInteger: 123456789012345678901234567890n,
                dateTime: new Date('2024-06-15T12:34:56.789Z'),
                bytes: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
                json: {kind: 'obj', nested: {a: 1, b: [true, false]}},
            })

            await db.transact(
                {prevHead: {height: -1, hash: '0x'}, nextHead: {height: 10, hash: 'h-10'}},
                async (store) => {
                    await store.insert(original)
                },
            )

            // Hot block nulls every column.
            await runThenRollback({height: 10, hash: 'h-10'}, 'h-11', 'h-11-alt', async (store) => {
                await store.save(
                    new Data({
                        id: 'x',
                        text: null,
                        textArray: null,
                        integer: null,
                        integerArray: null,
                        bigInteger: null,
                        dateTime: null,
                        bytes: null,
                        json: null,
                    }),
                )
            })

            const em = await getEntityManager()
            const row = await em.findOneOrFail(Data, {where: {id: 'x'}})

            expect(row.text).toBe('hello')
            expect(row.textArray).toEqual(['a', 'b', 'c'])
            expect(row.integer).toBe(42)
            expect(row.integerArray).toEqual([1, 2, 3])
            expect(row.bigInteger).toBe(123456789012345678901234567890n)
            expect(row.dateTime?.toISOString()).toBe('2024-06-15T12:34:56.789Z')
            expect(Array.from(row.bytes ?? [])).toEqual([0xde, 0xad, 0xbe, 0xef])
            expect(row.json).toEqual({kind: 'obj', nested: {a: 1, b: [true, false]}})
        })

        it('reverts null → non-null updates (original row had nulls)', async () => {
            await db.connect()

            await db.transact(
                {prevHead: {height: -1, hash: '0x'}, nextHead: {height: 10, hash: 'h-10'}},
                async (store) => {
                    await store.insert(
                        new Data({
                            id: 'x',
                            text: null,
                            integer: null,
                            textArray: null,
                            bytes: null,
                            json: null,
                        }),
                    )
                },
            )

            await runThenRollback({height: 10, hash: 'h-10'}, 'h-11', 'h-11-alt', async (store) => {
                await store.save(
                    new Data({
                        id: 'x',
                        text: 'now-set',
                        integer: 7,
                        textArray: ['x'],
                        bytes: new Uint8Array([1, 2]),
                        json: {set: true},
                    }),
                )
            })

            const em = await getEntityManager()
            const row = await em.findOneOrFail(Data, {where: {id: 'x'}})
            expect(row.text).toBeNull()
            expect(row.integer).toBeNull()
            expect(row.textArray).toBeNull()
            expect(row.bytes).toBeNull()
            expect(row.json).toBeNull()
        })

        it('reverts a JSON transition object → array → null back to the original object', async () => {
            await db.connect()

            const originalJson = {tag: 'object', items: [1, 2, 3]}
            await db.transact(
                {prevHead: {height: -1, hash: '0x'}, nextHead: {height: 10, hash: 'h-10'}},
                async (store) => {
                    await store.insert(new Data({id: 'x', json: originalJson}))
                },
            )

            await runThenRollback({height: 10, hash: 'h-10'}, 'h-11', 'h-11-alt', async (store) => {
                await store.save(new Data({id: 'x', json: [{kind: 'array-now'}]}))
                await store.save(new Data({id: 'x', json: null}))
            })

            const em = await getEntityManager()
            const row = await em.findOneOrFail(Data, {where: {id: 'x'}})
            expect(row.json).toEqual(originalJson)
        })

        it('reverts a zero-length bytea', async () => {
            await db.connect()

            await db.transact(
                {prevHead: {height: -1, hash: '0x'}, nextHead: {height: 10, hash: 'h-10'}},
                async (store) => {
                    await store.insert(new Data({id: 'x', bytes: new Uint8Array([])}))
                },
            )

            await runThenRollback({height: 10, hash: 'h-10'}, 'h-11', 'h-11-alt', async (store) => {
                await store.save(new Data({id: 'x', bytes: new Uint8Array([0xff, 0x00])}))
            })

            const em = await getEntityManager()
            const row = await em.findOneOrFail(Data, {where: {id: 'x'}})
            expect(Array.from(row.bytes ?? [])).toEqual([])
        })
    })

    describe('bulk entity operations', () => {
        it('rolls back an insert of >1000 rows in a single hot block', async () => {
            // Store chunks inserts at 1000; this exercises rollback across the
            // chunk boundary. 1500 rows span two chunks.
            await db.connect()

            const ROW_COUNT = 1500
            await runThenRollback({height: -1, hash: '0x'}, 'h-0', 'h-0-alt', async (store) => {
                const rows = Array.from({length: ROW_COUNT}, (_, i) => new Data({id: `bulk-${i}`, integer: i}))
                await store.insert(rows)
            })

            const em = await getEntityManager()
            expect(await em.count(Data)).toBe(0)
        }, 30_000)
    })

    describe('FK cascade limitations', () => {
        it('restores children when the parent was deleted via FK cascade', async () => {
            await db.connect()

            await db.transact(
                {prevHead: {height: -1, hash: '0x'}, nextHead: {height: 0, hash: 'h-0'}},
                async (store) => {
                    await store.insert(new Item('parent', 'P'))
                    await store.insert(new Data({id: 'child', text: 't', item: new Item('parent')}))
                },
            )

            const em = await getEntityManager()
            expect(await em.count(Item)).toBe(1)
            expect(await em.count(Data)).toBe(1)

            // Hot block deletes the parent; ON DELETE CASCADE removes the child
            // at the DB level. ChangeTracker only records the parent deletion.
            await db.transactHot(
                {
                    baseHead: {height: 0, hash: 'h-0'},
                    newBlocks: [{height: 1, hash: 'h-1'}],
                    finalizedHead: {height: 0, hash: 'h-0'},
                },
                async (store) => {
                    await store.remove(Item, 'parent')
                },
            )
            expect(await em.count(Item)).toBe(0)
            expect(await em.count(Data)).toBe(0) // cascade fired

            // Rollback.
            await db.transactHot(
                {
                    baseHead: {height: 0, hash: 'h-0'},
                    newBlocks: [{height: 1, hash: 'h-1-alt'}],
                    finalizedHead: {height: 0, hash: 'h-0'},
                },
                async () => {},
            )

            // Parent is correctly restored from the change log…
            expect(await em.count(Item)).toBe(1)
            // …but the child, whose cascade deletion was invisible to
            // ChangeTracker, is not. Currently fails (count = 0).
            expect(await em.count(Data)).toBe(1)
        })
    })
})
