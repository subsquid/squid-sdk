import expect from "expect"
import {Item} from "./lib/model"
import {createStore, getItemIds, getItems, useDatabase} from "./util"

describe("Store", function() {
    describe(".save()", function() {
        useDatabase([
            `CREATE TABLE item (id text primary key , name text)`
        ])

        it("saving of a single entity", async function() {
            let store = createStore()
            await store.save(new Item('1', 'a'))
            await expect(getItems()).resolves.toEqual([{id: '1', name: 'a'}])
        })

        it("saving of multiple entities", async function() {
            let store = createStore()
            await store.save([new Item('1', 'a'), new Item('2', 'b')])
            await expect(getItems()).resolves.toEqual([
                {id: '1', name: 'a'},
                {id: '2', name: 'b'}
            ])
        })

        it("saving a large amount of entities", async function() {
            let store = createStore()
            let items: Item[] = []
            for (let i = 0; i < 20000; i++) {
                items.push(new Item(''+i))
            }
            await store.save(items)
            expect(await store.count(Item)).toEqual(items.length)
        })

        it("updates", async function() {
            let store = createStore()
            await store.save(new Item('1', 'a'))
            await store.save([
                new Item('1', 'foo'),
                new Item('2', 'b')
            ])
            await expect(getItems()).resolves.toEqual([
                {id: '1', name: 'foo'},
                {id: '2', name: 'b'}
            ])
        })
    })

    describe(".remove()", function() {
        useDatabase([
            `CREATE TABLE item (id text primary key , name text)`,
            `INSERT INTO item (id, name) values ('1', 'a')`,
            `INSERT INTO item (id, name) values ('2', 'b')`,
            `INSERT INTO item (id, name) values ('3', 'c')`
        ])

        it("removal by passing an entity", async function() {
            let store = createStore()
            await store.remove(new Item('1'))
            await expect(getItemIds()).resolves.toEqual(['2', '3'])
        })

        it("removal by passing an array of entities", async function() {
            let store = createStore()
            await store.remove([
                new Item('1'),
                new Item('3')
            ])
            await expect(getItemIds()).resolves.toEqual(['2'])
        })

        it("removal by passing an id", async function() {
            let store = createStore()
            await store.remove(Item, '1')
            await expect(getItemIds()).resolves.toEqual(['2', '3'])
        })

        it("removal by passing an array of ids", async function() {
            let store = createStore()
            await store.remove(Item, ['1', '2'])
            await expect(getItemIds()).resolves.toEqual(['3'])
        })
    })
})
