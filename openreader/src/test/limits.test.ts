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
        maxResponseNodes: 50
    })

    it('unlimited requests fail', async function() {
        let result = await client.query(`
            query {
                order1s {
                    id
                }
            }
        `)
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
})
