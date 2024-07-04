import { TypeormDatabase } from '../database';
import { Data } from './lib/model';
import { getEntityManager, useDatabase } from './util';


describe('TypeormDatabase', function() {
    useDatabase()

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
                bool: true,
                text: 'hello',
                integer: 10,
                textArray: ['a1', 'A1'],
                integerArray: [1, 10],
                bigInteger: 1000000000000000000000000000000000000000000000000000000000n,
                dateTime: new Date(1000000000000),
                bytes: Buffer.from([100, 100, 100]),
                json: [1, {foo: 'bar'}]
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

        expect(records).toEqual([
            {
                id: '1',
                bool: true,
                text: 'hello',
                integer: 10,
                textArray: ['a1', 'A1'],
                integerArray: [1, 10],
                bigInteger: 1000000000000000000000000000000000000000000000000000000000n,
                dateTime: new Date(1000000000000),
                bytes: Buffer.from([100, 100, 100]),
                json: [1, {foo: 'bar'}]
            },
            {
                id: '2',
                text: 'world',
                integer: 20,
                // WTF?
                bigInteger: undefined,
                bool: null,
                bytes: null,
                dateTime: null,
                integerArray: null,
                json: null,
                textArray: null,
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
                    expect(await store.get(Data, '1')).toMatchObject(a1)
                    await store.insert([a2, a3])
            }
        })

        {
            const data = await em.find(Data, {order: {id: 'asc'}})
            expect(data).toHaveLength(3)
            expect(data).toMatchObject([a1, a2, a3])
        }

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

        {
            const data = await em.find(Data, {order: {id: 'asc'}})
            expect(data).toHaveLength(2)
            expect(data).toMatchObject([
                b1, b2
            ])
        }

        await db.transactHot({
            finalizedHead: {height: 0, hash: '0'},
            baseHead: {height: 1, hash: 'a-1'},
            newBlocks: [
                {height: 2, hash: 'c-2'}
            ]
        }, async (store, block) => {
            expect(block).toEqual({height: 2, hash: 'c-2'})
            {
                const data = await store.find(Data)
                expect(data).toHaveLength(1)
                expect(data).toMatchObject([a1])
            }
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

        {
            const data = await em.find(Data)
            expect(data).toHaveLength(1)
            expect(data).toMatchObject([a1])
        }

        await db.disconnect()

        expect(await db.connect()).toEqual({
            height: 0,
            hash: '0',
            nonce: 5,
            top: [
                {height: 1, hash: 'a-1'},
                {height: 2, hash: 'd-2'}
            ]
        })
    })
})
