import expect from 'expect'
import {TypeormDatabase} from '../database'
import type {TemplateMutation} from '../templates'
import {Data} from './lib/model'
import {getEntityManager, useDatabase} from './util'


describe('TypeormDatabase', function() {
    useDatabase([
        `CREATE TABLE item (id text primary key, name text)`,
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
            item_id text references item
        )`
    ])

    let db!: TypeormDatabase

    beforeEach(() => {
        db = new TypeormDatabase({projectDir: __dirname, supportHotBlocks: true})
    })

    afterEach(() => db?.disconnect())

    it('initial connect', async function() {
        let state = await db.connect()
        expect(state).toMatchObject({height: -1, hash: '0x', top: []})
    })

    it('.transact() flow', async function() {
        await db.connect()

        await db.transact({
            prevHead: {height: -1, hash: '0x'},
            nextHead: {height: 10, hash: '0x10'}
        }, async store => {
            await store.insert(new Data({
                id: '1',
                text: 'hello',
                integer: 10
            }))
        })

        await db.transact({
            prevHead: {height: 10, hash: '0x10'},
            nextHead: {height: 20, hash: '0x20'}
        }, async store => {
            await store.insert(new Data({
                id: '2',
                text: 'world',
                integer: 20
            }))
        })

        let em = await getEntityManager()

        let records = await em.find(Data, {
            order: {id: 'asc'}
        })

        expect(records).toMatchObject([
            {
                id: '1',
                text: 'hello',
                integer: 10
            },
            {
                id: '2',
                text: 'world',
                integer: 20
            }
        ])

        await db.disconnect()

        expect(await db.connect()).toMatchObject({
            height: 20,
            hash: '0x20',
            top: []
        })
    })

    it('.transactHot() flow', async function() {
        let em = await getEntityManager()

        await db.connect()

        await db.transactHot({
            baseHead: {height: -1, hash: '0x'},
            newBlocks: [
                {height: 0, hash: '0'},
            ],
            finalizedHead: {height: 0, hash: '0'}
        }, async () => {})

        let a1 = new Data({
            id: '1',
            text: 'a1',
            textArray: ['a1', 'A1'],
            integer: 1,
            integerArray: [1, 10],
            bigInteger: 1000000000000000000000000000000000000000000000000000000000n,
            dateTime: new Date(1000000000000),
            bytes: Buffer.from([100, 100, 100]),
            json: [1, {foo: 'bar'}]
        })

        let a2 = new Data({
            id: '2',
            text: 'a2',
            textArray: ['a2', 'A2'],
            integer: 2,
            integerArray: [2, 20],
            bigInteger: 2000000000000000000000000000000000000000000000000000000000n,
            dateTime: new Date(2000000000000),
            bytes: Buffer.from([200, 200, 200]),
            json: [2, {foo: 'baz'}]
        })

        let a3 = new Data({
            id: '3',
            text: 'a3',
            textArray: ['a3', 'A30'],
            integer: 30,
            integerArray: [30, 300],
            bigInteger: 3000000000000000000000000000000000000000000000000000000000n,
            dateTime: new Date(3000000000000),
            bytes: Buffer.from([3, 3, 3]),
            json: [3, {foo: 'qux'}]
        })

        await db.transactHot({
            baseHead: {height: 0, hash: '0'},
            finalizedHead: {height: 0, hash: '0'},
            newBlocks: [
                {height: 1, hash: 'a-1'},
                {height: 2, hash: 'a-2'},
                {height: 3, hash: 'a-3'}
            ]
        }, async (store, block) => {
            switch(block.height) {
                case 1:
                    return await store.insert(a1)
                case 2:
                    expect(await store.get(Data, '1')).toEqual(a1)
                    await store.insert([a2, a3])
            }
        })

        expect(await em.find(Data, {order: {id: 'asc'}})).toEqual([
            a1, a2, a3
        ])

        let b1 = new Data({
            id: '1',
            text: 'b1',
            textArray: ['b1', 'B1'],
            integer: 10,
            integerArray: [10, 100],
            bigInteger: 8000000000000000000000000000000000000000000000000000000000_000_000n,
            dateTime: new Date(100000),
            bytes: Buffer.from([1, 1, 1]),
            json: ["b1", {foo: 'bar'}]
        })

        let b2 = new Data({
            id: '2',
            text: 'b2',
            textArray: ['b2', 'B2'],
            integer: 20,
            integerArray: [20, 200],
            bigInteger: 9000000000000000000000000000000000000000000000000000000000_000n,
            dateTime: new Date(2000),
            bytes: Buffer.from([2, 2, 2]),
            json: {b2: true}
        })

        await db.transactHot({
            finalizedHead: {height: 0, hash: '0'},
            baseHead: {height: 1, hash: 'a-1'},
            newBlocks: [
                {height: 2, hash: 'b-2'}
            ]
        }, async (store, block) => {
            expect(block).toEqual({height: 2, hash: 'b-2'})
            await store.save(b1)
            await store.insert(b2)
        })

        expect(await em.find(Data, {order: {id: 'asc'}})).toEqual([
            b1, b2
        ])

        await db.transactHot({
            finalizedHead: {height: 0, hash: '0'},
            baseHead: {height: 1, hash: 'a-1'},
            newBlocks: [
                {height: 2, hash: 'c-2'}
            ]
        }, async (store, block) => {
            expect(block).toEqual({height: 2, hash: 'c-2'})
            expect(await store.find(Data)).toEqual([a1])
            await store.remove(a1)
        })

        expect(await em.find(Data)).toEqual([])

        await db.transactHot({
            finalizedHead: {height: 0, hash: '0'},
            baseHead: {height: 1, hash: 'a-1'},
            newBlocks: [
                {height: 2, hash: 'd-2'}
            ]
        }, async () => {})

        expect(await em.find(Data)).toEqual([a1])

        await db.disconnect()

        expect(await db.connect()).toMatchObject({
            height: 0,
            hash: '0',
            top: [
                {height: 1, hash: 'a-1'},
                {height: 2, hash: 'd-2'}
            ]
        })
    })

    describe('templates', function() {
        it('.transact() persists templates', async function() {
            await db.connect()

            let mutations: TemplateMutation[] = [
                {type: 'add', key: 'contract', value: '0xabc', blockNumber: 5},
                {type: 'add', key: 'contract', value: '0xdef', blockNumber: 8},
            ]

            await db.transact({
                prevHead: {height: -1, hash: '0x'},
                nextHead: {height: 10, hash: '0x10'}
            }, async () => {
                return {templates: mutations}
            })

            await db.disconnect()

            let state = await db.connect()
            expect(state.height).toBe(10)
            expect(state.templates).toEqual(mutations)
        })

        it('.transact() with no templates returns empty array', async function() {
            await db.connect()

            await db.transact({
                prevHead: {height: -1, hash: '0x'},
                nextHead: {height: 10, hash: '0x10'}
            }, async () => {})

            await db.disconnect()

            let state = await db.connect()
            expect(state.templates).toEqual([])
        })

        it('.transactHot2() persists templates per hot block', async function() {
            await db.connect()

            let blocks = [
                {height: 0, hash: '0x0'},
                {height: 1, hash: '0x1'},
            ]

            await db.transactHot2({
                baseHead: {height: -1, hash: '0x'},
                finalizedHead: {height: -1, hash: '0x'},
                newBlocks: blocks,
            }, async (store, beg, end) => {
                let b = blocks[beg]
                if (b.height === 0) {
                    return {templates: [{type: 'add', key: 'token', value: '0xaaa', blockNumber: 0}]}
                }
                if (b.height === 1) {
                    return {templates: [{type: 'add', key: 'token', value: '0xbbb', blockNumber: 1}]}
                }
            })

            await db.disconnect()

            let state = await db.connect()
            expect(state.top).toEqual([
                {height: 0, hash: '0x0', templates: [{type: 'add', key: 'token', value: '0xaaa', blockNumber: 0}]},
                {height: 1, hash: '0x1', templates: [{type: 'add', key: 'token', value: '0xbbb', blockNumber: 1}]},
            ])
            expect(state.templates).toEqual([])
        })

        it('hot block rollback removes its templates', async function() {
            await db.connect()

            let blocks = [
                {height: 0, hash: '0x0'},
                {height: 1, hash: '0x1'},
            ]

            await db.transactHot2({
                baseHead: {height: -1, hash: '0x'},
                finalizedHead: {height: -1, hash: '0x'},
                newBlocks: blocks,
            }, async (store, beg, end) => {
                let b = blocks[beg]
                if (b.height === 0) {
                    return {templates: [{type: 'add', key: 'token', value: '0xaaa', blockNumber: 0}]}
                }
                if (b.height === 1) {
                    return {templates: [{type: 'add', key: 'token', value: '0xbbb', blockNumber: 1}]}
                }
            })

            await db.transactHot2({
                baseHead: {height: 0, hash: '0x0'},
                finalizedHead: {height: -1, hash: '0x'},
                newBlocks: [
                    {height: 1, hash: '0x1-fork'},
                ]
            }, async () => {
                return {templates: [{type: 'add', key: 'token', value: '0xccc', blockNumber: 1}]}
            })

            await db.disconnect()

            let state = await db.connect()
            expect(state.top).toEqual([
                {height: 0, hash: '0x0', templates: [{type: 'add', key: 'token', value: '0xaaa', blockNumber: 0}]},
                {height: 1, hash: '0x1-fork', templates: [{type: 'add', key: 'token', value: '0xccc', blockNumber: 1}]},
            ])
        })

        it('finalization moves hot templates into finalized state', async function() {
            await db.connect()

            let blocks = [
                {height: 0, hash: '0x0'},
                {height: 1, hash: '0x1'},
            ]

            await db.transactHot2({
                baseHead: {height: -1, hash: '0x'},
                finalizedHead: {height: -1, hash: '0x'},
                newBlocks: blocks,
            }, async (store, beg, end) => {
                let b = blocks[beg]
                if (b.height === 0) {
                    return {templates: [{type: 'add', key: 'token', value: '0xaaa', blockNumber: 0}]}
                }
                if (b.height === 1) {
                    return {templates: [{type: 'add', key: 'token', value: '0xbbb', blockNumber: 1}]}
                }
            })

            await db.transactHot2({
                baseHead: {height: 1, hash: '0x1'},
                finalizedHead: {height: 1, hash: '0x1'},
                newBlocks: []
            }, async () => {})

            await db.disconnect()

            let state = await db.connect()
            expect(state.templates).toEqual([
                {type: 'add', key: 'token', value: '0xaaa', blockNumber: 0},
                {type: 'add', key: 'token', value: '0xbbb', blockNumber: 1},
            ])
            expect(state.top).toEqual([])
        })

        it('.transact() rolls back hot templates and persists only new ones', async function() {
            await db.connect()

            let blocks = [
                {height: 0, hash: '0x0'},
                {height: 1, hash: '0x1'},
            ]

            await db.transactHot2({
                baseHead: {height: -1, hash: '0x'},
                finalizedHead: {height: -1, hash: '0x'},
                newBlocks: blocks,
            }, async (store, beg, end) => {
                let b = blocks[beg]
                if (b.height === 0) {
                    return {templates: [{type: 'add', key: 'token', value: '0xaaa', blockNumber: 0}]}
                }
            })

            await db.transact({
                prevHead: {height: -1, hash: '0x'},
                nextHead: {height: 5, hash: '0x5'}
            }, async () => {
                return {templates: [{type: 'add', key: 'pool', value: '0xfff', blockNumber: 3}]}
            })

            await db.disconnect()

            let state = await db.connect()
            expect(state.templates).toEqual([
                {type: 'add', key: 'pool', value: '0xfff', blockNumber: 3},
            ])
            expect(state.top).toEqual([])
        })

        it('delete mutations are ordered before add at same block_number', async function() {
            await db.connect()

            await db.transact({
                prevHead: {height: -1, hash: '0x'},
                nextHead: {height: 10, hash: '0x10'}
            }, async () => {
                return {templates: [
                    {type: 'add', key: 'token', value: '0xaaa', blockNumber: 5},
                    {type: 'delete', key: 'token', value: '0xaaa', blockNumber: 5},
                ]}
            })

            await db.disconnect()

            let state = await db.connect()
            expect(state.templates).toEqual([
                {type: 'delete', key: 'token', value: '0xaaa', blockNumber: 5},
                {type: 'add', key: 'token', value: '0xaaa', blockNumber: 5},
            ])
        })
    })
})
