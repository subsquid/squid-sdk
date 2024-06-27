import { assertNotNull } from '@subsquid/util-internal';
import { Equal } from 'typeorm';
import { CacheMode, FlushMode, ResetMode, Store } from '../store';
import { Child, Item, Order, Parent } from './lib/model';
import { getEntityManager, useDatabase } from './util';
import { sortMetadatasInCommitOrder } from '../utils/commitOrder';
import { StateManager } from '../utils/stateManager';


describe("Store", function() {
    describe(`with flushMode=AUTO`, function() {
        describe(".upsert()", function () {
            useDatabase([
                `CREATE TABLE item (id text primary key , name text)`
            ])

            it("should upsert a single entity", async function () {
                let store = await createStore()
                await store.upsert(new Item('1', 'a'))
                await expect(getItems(store)).resolves.toEqual([{id: '1', name: 'a'}])
            })

            it("should upsert multiple entities", async function () {
                let store = await createStore()
                await store.upsert([new Item('1', 'a'), new Item('2', 'b')])
                await expect(getItems(store)).resolves.toEqual([
                    {id: '1', name: 'a'},
                    {id: '2', name: 'b'}
                ])
            })

            it("should upsert a large amount of entities splitting by batches", async function () {
                let store = await createStore()
                let items: Item[] = []
                for (let i = 0; i < 20000; i++) {
                    items.push(new Item('' + i))
                }
                await store.upsert(items)
                expect(await store.count(Item)).toEqual(items.length)
            })

            it("should apply multiple updates", async function () {
                let store = await createStore()
                await store.upsert(new Item('1', 'a'))
                await store.upsert([
                    new Item('1', 'foo'),
                    new Item('2', 'b')
                ])
                await expect(getItems(store)).resolves.toEqual([
                    {id: '1', name: 'foo'},
                    {id: '2', name: 'b'}
                ])
            })
        })

        describe(".delete()", function () {
            useDatabase([
                `CREATE TABLE item (id text primary key , name text)`,
                `INSERT INTO item (id, name) values ('1', 'a')`,
                `INSERT INTO item (id, name) values ('2', 'b')`,
                `INSERT INTO item (id, name) values ('3', 'c')`
            ])

            it("should delete an entire entity", async function () {
                let store = await createStore()
                await store.delete(new Item('1'))
                await expect(getItemIds(store)).resolves.toEqual(['2', '3'])
            })

            it("should delete an array of entities", async function () {
                let store = await createStore()
                await store.delete([
                    new Item('1'),
                    new Item('3')
                ])
                await expect(getItemIds(store)).resolves.toEqual(['2'])
            })

            it("should delete by id", async function () {
                let store = await createStore()
                await store.delete(Item, '1')
                await expect(getItemIds(store)).resolves.toEqual(['2', '3'])
            })

            it("should delete by an array of ids", async function () {
                let store = await createStore()
                await store.delete(Item, ['1', '2'])
                await expect(getItemIds(store)).resolves.toEqual(['3'])
            })
        })

        describe("Update with un-fetched reference", function () {
            useDatabase([
                `CREATE TABLE item (id text primary key , name text)`,
                `CREATE TABLE "order" (id text primary key, item_id text REFERENCES item, qty int4)`,
                `INSERT INTO item (id, name) values ('1', 'a')`,
                `INSERT INTO "order" (id, item_id, qty) values ('1', '1', 3)`,
                `INSERT INTO item (id, name) values ('2', 'b')`,
                `INSERT INTO "order" (id, item_id, qty) values ('2', '2', 3)`
            ])

            it(".upsert() doesn't clear reference (single row update)", async function () {
                let store = await createStore()
                let order = assertNotNull(await store.get(Order, '1'))
                order.qty = 5
                await store.upsert(order)
                let newOrder = await store.findOneOrFail(Order, {
                    where: {id: Equal('1')},
                    relations: {
                        item: true
                    }
                })
                expect(newOrder.qty).toEqual(5)
                expect(newOrder.item.id).toEqual('1')
            })

            it(".upsert() doesn't clear reference (multi row update)", async function () {
                let store = await createStore()
                let orders = await store.find(Order, {order: {id: 'ASC'}})
                let items = await store.find(Item, {order: {id: 'ASC'}})

                orders[0].qty = 5
                orders[1].qty = 1
                orders[1].item = items[0]
                await store.upsert(orders)

                let newOrders = await store.find(Order, {
                    relations: {
                        item: true
                    },
                    order: {id: 'ASC'}
                })

                expect(newOrders).toEqual([
                    {
                        id: '1',
                        item: {
                            id: '1',
                            name: 'a'
                        },
                        qty: 5
                    },
                    {
                        id: '2',
                        item: {
                            id: '1',
                            name: 'a'
                        },
                        qty: 1
                    }
                ])
            })
        })

        describe(".get()", function () {
            useDatabase([
                `CREATE TABLE item (id text primary key , name text)`,
                `INSERT INTO item (id, name) values ('1', 'a')`,
                `INSERT INTO item (id, name) values ('2', 'b')`,
            ])

            it('should return item if it is not in cache', async () => {
                let store = await createStore()
                await expect(store.get(Item, '1')).resolves.toMatchObject({id: '1'})
            });

            it('should call database only once', async () => {
                let store = await createStore()
                const spy = jest.spyOn(store, 'findOne')

                await expect(store.get(Item, '1')).resolves.toMatchObject({id: '1'})
                await expect(store.get(Item, '1')).resolves.toMatchObject({id: '1'})

                expect(spy.mock.calls.length).toEqual(1);
                spy.mockReset()
            });

            it('should call database only once', async () => {
                let store = await createStore({
                    flushMode: FlushMode.AUTO
                })
                const spy = jest.spyOn(store, 'findOne');

                await expect(store.get(Item, '1')).resolves.toMatchObject({id: '1'})
                expect(spy.mock.calls.length).toEqual(1);
                await store.flush();

                await expect(store.get(Item, '1')).resolves.toMatchObject({id: '1'})
                expect(spy.mock.calls.length).toEqual(2);

                spy.mockReset()
            });

            it('should call', async () => {
                let store = await createStore({
                    flushMode: FlushMode.COMMIT
                })

                await expect(getItems(store)).resolves.toMatchObject([{id: '1'}, {id: "2"}])
                await store.insert(new Item('3', 'c'))
                await expect(getItems(store)).resolves.toMatchObject([{id: "1"}, {id: "2"}])
                await store.flush()
                await expect(getItems(store)).resolves.toMatchObject([{id: "1"}, {id: "2"}, {id: "3"}])
            });
        })
    })

    describe(`with flushMode=BATCH`, function() {
        useDatabase([
            `CREATE TABLE item (id text primary key , name text)`,
        ])

        describe(".insert()",  () => {
            it('should insert an entity', async () => {
                let store = await createStore({flushMode: FlushMode.COMMIT})
                const metadata =  store._em.connection.getMetadata(Item)
                const item = new Item('1', 'a')

                await store.insert(item)
                expect(store._state.isInserted(metadata, '1')).toEqual(true)

                await store.flush()
                await expect(getItems(store)).resolves.toEqual([{ id: '1', name: 'a'}])
            })

            it('should not insert an entity twice', async () => {
                let store = await createStore({flushMode: FlushMode.COMMIT})
                const item = new Item('1', 'a')

                await store.insert(item)
                // second insert before flush should throw
                await expect(store.insert(item)).rejects.toThrow('Entity Item 1 is already marked as insert')

                await store.flush()
                // now we are okay to insert the same entity again
                await store.insert(item)
                // but database will fail because of duplicate key
                await expect(store.flush()).rejects.toThrow('duplicate key value violates unique constraint "item_pkey"')
            })

            it('should insert a previously deleted entity', async () => {
                let store = await createStore({flushMode: FlushMode.COMMIT})

                await store.delete(new Item('1', 'a'))
                await store.insert(new Item('1', 'b'))

                await expect(getItems(store)).resolves.toEqual([])
                await store.flush()
                await expect(getItems(store)).resolves.toEqual([{ id: '1', name: 'b'}])
            })
        })

        describe(".upsert()",  () => {
            it('should upsert an entity', async () => {
                let store = await createStore({flushMode: FlushMode.COMMIT})
                const metadata =  store._em.connection.getMetadata(Item)
                const item = new Item('1', 'a')

                await store.upsert(item)
                expect(store._state.isUpserted(metadata, '1')).toEqual(true)

                await expect(getItems(store)).resolves.toEqual([])
                await store.flush()
                await expect(getItems(store)).resolves.toEqual([{ id: '1', name: 'a'}])
            })

            it('should upsert an entity twice', async () => {
                let store = await createStore({flushMode: FlushMode.COMMIT})

                await store.upsert(new Item('1', 'a'))
                await store.upsert(new Item('1', 'b'))

                await expect(getItems(store)).resolves.toEqual([])
                await store.flush()
                await expect(getItems(store)).resolves.toEqual([{ id: '1', name: 'b'}])
            })

            it('should upsert a previously deleted entity', async () => {
                let store = await createStore({flushMode: FlushMode.COMMIT})

                await store.delete(new Item('1', 'a'))
                await store.upsert(new Item('1', 'b'))

                await expect(getItems(store)).resolves.toEqual([])
                await store.flush()
                await expect(getItems(store)).resolves.toEqual([{ id: '1', name: 'b'}])
            })
        })

        describe(".delete()", function () {
            it('should delete an entity', async () => {
                let store = await createStore({ flushMode: FlushMode.COMMIT })
                const metadata =  store._em.connection.getMetadata(Item)

                const item = new Item('1', 'a')
                await store.insert(item)
                expect(store._state.isInserted(metadata, '1')).toEqual(true)

                await store.delete(item)
                expect(store._state.isNoop(metadata, '1')).toEqual(true)

                await expect(getItems(store)).resolves.toEqual([])
                await store.flush()
                await expect(getItems(store)).resolves.toEqual([])
            });

            it('should deleted an entity twice', async () => {
                let store = await createStore({flushMode: FlushMode.COMMIT})
                const item = new Item('1', 'a')

                await store.upsert(item)
                await store.flush()
                await expect(getItems(store)).resolves.toEqual([{ id: '1', name: 'a'}])

                await store.delete(item)
                await store.delete(item)
                await store.flush()

                await expect(getItems(store)).resolves.toEqual([])
            })


        })
    })

    describe(`with flushMode=BATCH`, function() {
        useDatabase([
            `CREATE TABLE parent (id text primary key, name text)`,
            `CREATE TABLE child (id text primary key, name text, parent_id text references parent)`,
            `INSERT INTO parent (id, name) values ('1', 'p1')`,
            `INSERT INTO child (id, name, parent_id) values ('1', 'c1', '1')`,
        ])


        it('should get all child entities', async () => {
            let store = await createStore({ flushMode: FlushMode.COMMIT })

            const parent = await store.get(Parent, {
              id: '1',
              relations: {
                  children: true
              }
            })

            expect(parent?.id).toEqual('1')
            expect(parent?.children).toHaveLength(1)


        });

        it('should re-fetch child after reset', async () => {
            let store = await createStore({ flushMode: FlushMode.COMMIT })
            await store.get(Parent, {
                id: '1',
                relations: {
                    children: true
                }
            })

            {
                const spy = jest.spyOn(store, 'findOne')
                await store.get(Child, '1');
                expect(spy.mock.calls.length).toEqual(0);
                spy.mockReset()
            }

            store.reset()

            {
                const spy = jest.spyOn(store, 'findOne')
                await store.get(Child, '1');
                expect(spy.mock.calls.length).toEqual(1);
                spy.mockReset()
            }
        })
    })
})


export async function createStore({ flushMode }: { flushMode?: FlushMode  } = {}): Promise<Store> {
    const em = await getEntityManager()
    return new Store({
        em,
        state: new StateManager({
            commitOrder: sortMetadatasInCommitOrder(em.connection),
        }),
        cacheMode: CacheMode.ALL,
        flushMode: flushMode || FlushMode.AUTO,
        resetMode: ResetMode.COMMIT,
    })
}


export async function getItems(store: Store): Promise<Item[]> {
    return store.find(Item, {where: {}})
}

export async function getItemIds(store: Store): Promise<string[]> {
    const items = await getItems(store);

    return items.map((it) => it.id).sort();
}
