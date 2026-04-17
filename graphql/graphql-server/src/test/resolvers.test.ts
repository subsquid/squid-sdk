import {useDatabase} from "./util/db"
import {useServer} from "./util/server"

describe('resolvers extension', function () {
    useDatabase([
        `create table scalar (id text primary key, "bool" bool, date timestamptz, big_int numeric, big_decimal numeric, "bytes" bytea, attributes jsonb)`,
        `insert into scalar (id, bool, date, big_int, big_decimal, "bytes", attributes) values ('1', true, '2021-09-24T00:00:00.000Z', 1000000000000000, 0.000000000000000001, decode('aa', 'hex'), '[1, 2, 3]'::jsonb)`,
        `create table parent (id text primary key , name text)`,
        `create table child (id text primary key , name text, parent_id text references parent)`,
        `insert into parent (id, name) values ('1', 'hello')`,
        `insert into child (id, name, parent_id) values ('2', 'world', '1')`
    ])

    const client = useServer('lib/test/resolvers-extension')

    describe ('responses', () => {
        it('scalars', function () {
            return client.test(`
            query {
                scalarsExtension {
                    id
                    bool
                    date
                    bigInt
                    bigDecimal
                    bytes
                    attributes
                }
            }
        `, {
                scalarsExtension: [{
                    id: '1',
                    bool: true,
                    date: '2021-09-24T00:00:00.000Z',
                    bigInt: '1000000000000000',
                    bigDecimal: '0.000000000000000001',
                    bytes: '0xaa',
                    attributes: [1, 2, 3]
                }]
            })
        })

        it('openreader scalars continue to work', function () {
            return client.test(`
            query {
                scalars {
                    id
                    bool
                    date
                    bigInt
                    bigDecimal
                    bytes
                }
            }
        `, {
                scalars: [{
                    id: '1',
                    bool: true,
                    date: '2021-09-24T00:00:00.000000Z',
                    bigInt: '1000000000000000',
                    bigDecimal: '0.000000000000000001',
                    bytes: '0xaa'
                }]
            })
        })

        it('not enough columns in result regression', function () {
            return client.test(`
            query {
                children {
                    name
                    parent {
                        name
                    }
                }
            }
        `, {
                children: [
                    {
                        parent: {
                            name: 'hello'
                        },
                        name: 'world'
                    }
                ]
            })
        })

        it('ping-pong', function () {
            return client.test(`
            query {
                ping(msg: {message: "hello"}) {
                    message
                }
            }
        `, {
                ping: {
                    message: 'hello'
                }
            })
        })
    })

    // FIXME multiple describes don't work
    describe ('validation', () => {
        describe ('@Arg [String]', () => {
            it('should pass array', function () {
                return client.test(`query { stringArray(ids: ["1"]) }`, {stringArray: true})
            })

            it('should pass string', function () {
                return client.test(`query { stringArray(ids: "1") }`, {stringArray: true})
            })

            it('should throw if required arg is missing', function () {
                return client.httpErrorMatch(`query { stringArray }`, {
                    errors: [
                        {
                            message: `Field "stringArray" argument "ids" of type "[String!]!" is required, but it was not provided.`
                        }
                    ]
                })
            })
        })
    })
})
