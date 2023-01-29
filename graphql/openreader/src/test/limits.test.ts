import expect from 'expect'
import {useDatabase, useServer} from './setup'


describe('response size limits', function() {
    useDatabase([
        `create table "order1" (id text primary key)`,
        `create table item1 (id text primary key, order_id text, name text)`,
        `create table "order2" (id text primary key)`,
        `create table item2 (id text primary key, order_id text, name text)`,
        `create table "order3" (id text primary key)`,
        `create table item3 (id text primary key, order_id text, name text)`,
    ])

    const client = useServer(`
        type Order1 @entity {
            id: ID!
            items: [Item1!]! @derivedFrom(field: "order")
        }
        
        type Item1 @entity {
            id: ID!
            order: Order1!
            name: String
        }
        
        type Order2 @entity @cardinality(value: 10) {
            id: ID!
            items: [Item2!]! @derivedFrom(field: "order")
        }
        
        type Item2 @entity {
            id: ID!
            order: Order2!
            name: String
        }
        
        type Order3 @entity {
            id: ID!
            items: [Item3!]! @derivedFrom(field: "order") @cardinality(value: 10)
        }
        
        type Item3 @entity {
            id: ID!
            order: Order3!
            name: String @byteWeight(value: 10.0)
        }
    `, {
        maxResponseNodes: 50,
        maxRootFields: 3
    })

    it('unlimited requests fail', async function() {
        let result = await client.query(`
            query {
                order1s {
                    id
                }
            }
        `)
        expect(result).toMatchObject({
            data: null,
            errors: [
                expect.objectContaining({message: 'response might exceed the size limit', path: ['order1s']})
            ]
        })
    })

    it('limited requests work', function() {
        return client.test(`
            query {
                order1s(limit: 10) {
                    items(limit: 2) {
                        id
                    }
                }
            }
        `, {
            order1s: []
        })
    })

    it('entity level cardinalities are respected', function() {
        return client.test(`
            query {
                order2s {
                    id
                }
            }
        `, {
            order2s: []
        })
    })

    it('item cardinalities are respected', function() {
        return client.test(`
            query {
                order3s(limit: 1) {
                    items { id }
                }
            }
        `, {
            order3s: []
        })
    })

    it('@byteWeight annotations are respected', async function() {
        let result = await client.query(`
            query {
                order3s(limit: 1) {
                    items(limit: 8) { name }
                }
            }
        `)
        expect(result).toEqual({
            data: null,
            errors: [
                expect.objectContaining({
                    message: 'response might exceed the size limit',
                    path: ['order3s']
                })
            ]
        })
        await client.test(`
            query {
                order3s(limit: 1) {
                    items(limit: 4) { name }
                }
            }
        `, {
            order3s: []
        })
    })

    it('id_in conditions are understood', function() {
        return client.test(`
            query {
                order1s(where: {id_in: ["1", "2", "3"]}) {
                    id
                }
            }
        `, {
            order1s: []
        })
    })

    it('root query fields limit', async function() {
        return client.httpErrorTest(`
            query {
                a: order1ById(id: "1") { id }
                b: order1ById(id: "1") { id }
                c: order1ById(id: "1") { id }
                d: order1ById(id: "1") { id }
            }
        `, {
            errors: [
                expect.objectContaining({
                    message: 'only 3 root query fields allowed, but got 4'
                })
            ]
        })
    })
})
