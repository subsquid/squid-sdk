import {wait} from "@subsquid/util-internal"
import expect from "expect"
import {databaseExecute, useDatabase, useServer} from "./setup"


describe("subscriptions", function() {
    useDatabase([
        `create table "order" (id text primary key, kind text not null, name text)`,
        `create table item (id text primary key, order_id text, name text)`,
    ])

    const client = useServer(`
        type Order @entity {
            id: ID!
            kind: String!
            name: String
            items: [Item!]! @derivedFrom(field: "order")
        }
        
        type Item @entity {
            id: ID!
            order: Order
            name: String
        }
    `)

    it("entity list", function() {
        return client.subscriptionTest(`
            subscription {
                orders(where: {kind_eq: "list"}, orderBy: id_ASC) {
                    id
                    name
                    items(orderBy: id_ASC) {
                        name
                    }
                }
            }
        `, async take => {
            await wait(100)
            expect(await take()).toEqual({data: {orders: []}})
            await databaseExecute([
                `insert into "order" (id, kind) values ('1', 'list')`,
                `insert into "order" (id, kind) values ('2', 'foo')`,
            ])
            expect(await take()).toEqual({
                data: {
                    orders: [{id: '1', name: null, items: []}]
                }
            })
            await databaseExecute([`
                update "order" set name = 'hello' where id in ('1', '2');
                insert into item (id, "order_id", name) values ('1-1', '1', '123')
            `])
            expect(await take()).toEqual({
                data: {
                    orders: [
                        {id: '1', name: 'hello', items: [{name: '123'}]}
                    ]
                }
            })
        })
    })

    it("entity by id", async function() {
        await databaseExecute([
            `insert into "order" (id, kind) values ('3', 'by id')`,
            `insert into item (id, "order_id", name) values ('3-1', '3', 'hello')`
        ])
        await client.subscriptionTest(`
            subscription {
                third: orderById(id: "3") {
                    name
                    items(orderBy: id_ASC) {
                        name
                    }
                }
            }
        `, async take => {
            await wait(100)
            expect(await take()).toEqual({
                data: {
                    third: {
                        name: null,
                        items: [
                            {name: 'hello'}
                        ]
                    }
                }
            })
            await databaseExecute([`
                start transaction;
                update "order" set name = 'foo' where id = '3';
                insert into item (id, "order_id", name) values ('3-2', '3', 'world');
                commit;
            `])
            expect(await take()).toEqual({
                data: {
                    third: {
                        name: 'foo',
                        items: [
                            {name: 'hello'},
                            {name: 'world'}
                        ]
                    }
                }
            })
        })
    })
})
