import {Dialect} from '../dialect'
import {useDatabase, useServer} from './setup'


describe('primary key queries', function () {
    useDatabase([
        `create table account (id text primary key, wallet text)`,
        `create table transfer (
            id text,
            "timestamp" timestamp with time zone,
            amount numeric,
            primary key (id, "timestamp")
        )`,
        `insert into account (id, wallet) values ('1', 'a')`,
        `insert into account (id, wallet) values ('2', 'b')`,
        `insert into transfer (id, "timestamp", amount) values ('t1', '2020-01-01T00:00:00Z', 10)`,
        `insert into transfer (id, "timestamp", amount) values ('t1', '2020-01-02T00:00:00Z', 20)`,
        `insert into transfer (id, "timestamp", amount) values ('t2', '2020-01-01T00:00:00Z', 30)`,
    ])

    const client = useServer(`
        type Account @entity {
            id: ID!
            wallet: String!
        }

        type Transfer @entity(pk: ["id", "timestamp"]) {
            id: ID!
            timestamp: DateTime!
            amount: Int!
        }
    `)

    describe('single-column key', function () {
        it('still supports the byId query', function () {
            return client.test(
                `query {
                    a: accountById(id: "1") { id wallet }
                    nonexistent: accountById(id: "foo") { id }
                }`,
                {
                    a: {id: '1', wallet: 'a'},
                    nonexistent: null,
                }
            )
        })

        it('supports the byPks query with the same argument', function () {
            return client.test(
                `query {
                    a: accountByPks(id: "2") { id wallet }
                    nonexistent: accountByPks(id: "foo") { id }
                }`,
                {
                    a: {id: '2', wallet: 'b'},
                    nonexistent: null,
                }
            )
        })
    })

    describe('composite key', function () {
        it('selects the row matching the full key', function () {
            return client.test(
                `query {
                    first: transferByPks(id: "t1", timestamp: "2020-01-01T00:00:00Z") {
                        id
                        amount
                    }
                    second: transferByPks(id: "t1", timestamp: "2020-01-02T00:00:00Z") {
                        id
                        amount
                    }
                }`,
                {
                    first: {id: 't1', amount: 10},
                    second: {id: 't1', amount: 20},
                }
            )
        })

        it('returns null when only part of the key matches', function () {
            return client.test(
                `query {
                    t: transferByPks(id: "t2", timestamp: "2020-01-02T00:00:00Z") {
                        id
                    }
                }`,
                {t: null}
            )
        })

        it('serves the byPks query over a subscription too', function () {
            return client.subscriptionTest(
                `subscription {
                    transferByPks(id: "t2", timestamp: "2020-01-01T00:00:00Z") { id amount }
                }`,
                async (take: any) => {
                    expect(await take()).toEqual({
                        data: {transferByPks: {id: 't2', amount: 30}}
                    })
                }
            )
        })

        it('does not install a byId query for a composite key', function () {
            // `id` alone does not identify a row here, so exposing byId would
            // promise a uniqueness the table cannot deliver.
            return client.httpErrorTest(
                `query {
                    t: transferById(id: "t1") { id }
                }`,
                {
                    errors: [
                        expect.objectContaining({
                            message: expect.stringContaining('transferById')
                        })
                    ]
                }
            )
        })
    })

    describe('queryName override', function () {
        const renamed = useServer(`
            type Transfer @entity(pk: ["id", "timestamp"], queryName: "oneTransfer") {
                id: ID!
                timestamp: DateTime!
                amount: Int!
            }
        `)

        it('renames the byPks query of a composite-key entity', function () {
            // With a composite key ByPks is the single-entity lookup, so
            // queryName applies to it rather than to a byId that isn't there.
            return renamed.test(
                `query {
                    t: oneTransfer(id: "t1", timestamp: "2020-01-02T00:00:00Z") { id amount }
                }`,
                {t: {id: 't1', amount: 20}}
            )
        })
    })

    describe('thegraph dialect', function () {
        const graph = useServer(`
            type Transfer @entity(pk: ["id", "timestamp"]) {
                id: ID!
                timestamp: DateTime!
                amount: Int!
            }
        `, {dialect: Dialect.TheGraph})

        it('keeps the subgraph-style name and takes the key as arguments', function () {
            return graph.test(
                `query {
                    t: transfer(id: "t1", timestamp: "2020-01-02T00:00:00Z") { id amount }
                }`,
                {t: {id: 't1', amount: 20}}
            )
        })
    })
})
