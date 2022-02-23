import {useDatabase} from "./util/db"
import {useServer} from "./util/server"

describe('resolvers extension', function () {
    useDatabase([
        `create table scalar (id text primary key, "bool" bool, date timestamptz, big_number numeric, "bytes" bytea)`,
        `insert into scalar (id, bool, date, big_number, "bytes") values ('1', true, '2021-09-24T00:00:00.000Z', 1000000000000000, decode('aa', 'hex'))`,
        `create table parent (id text primary key , name text)`,
        `create table child (id text primary key , name text, parent_id text references parent)`,
        `insert into parent (id, name) values ('1', 'hello')`,
        `insert into child (id, name, parent_id) values ('2', 'world', '1')`
    ])

    const client = useServer('lib/test/resolvers-extension')

    it('scalars', function () {
        return client.test(`
            query {
                scalarsExtension {
                    id
                    bool
                    date
                    bigNumber
                    bytes
                }
            }
        `, {
            scalarsExtension: [{
                id: '1',
                bool: true,
                date: '2021-09-24T00:00:00.000Z',
                bigNumber: '1000000000000000',
                bytes: '0xaa'
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
                    bigNumber
                    bytes
                }
            }
        `, {
            scalars: [{
                id: '1',
                bool: true,
                date: '2021-09-24T00:00:00.000Z',
                bigNumber: '1000000000000000',
                bytes: '0xaa'
            }]
        })
    })

    it('not enough columns in result regression', function() {
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
})
