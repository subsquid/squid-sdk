import expect from 'expect'
import {parse} from 'graphql'
import {buildModel, buildSchema, SchemaError} from '../model.schema'
import {useDatabase, useServer} from './setup'


function model(schema: string) {
    return buildModel(buildSchema(parse(schema)))
}


describe('@disableForeignKeyConstraint', function () {
    describe('schema validation', function () {
        it('parses valid usage and sets disableConstraint flag', function () {
            let m = model(`
                type Account @entity {
                    id: ID!
                }
                type Transfer @entity {
                    id: ID!
                    from: Account @disableForeignKeyConstraint
                }
            `)
            expect(m.Transfer).toBeDefined()
            expect(m.Transfer.kind).toBe('entity')
            if (m.Transfer.kind === 'entity') {
                let fromProp = m.Transfer.properties.from
                expect(fromProp.type).toEqual({
                    kind: 'fk',
                    entity: 'Account',
                    disableConstraint: true,
                })
            }
        })

        it('rejects non-nullable FK field', function () {
            expect(() =>
                model(`
                    type Account @entity {
                        id: ID!
                    }
                    type Transfer @entity {
                        id: ID!
                        from: Account! @disableForeignKeyConstraint
                    }
                `)
            ).toThrow(SchemaError)
        })

        it('rejects directive on scalar field', function () {
            expect(() =>
                model(`
                    type Account @entity {
                        id: ID!
                        name: String @disableForeignKeyConstraint
                    }
                `)
            ).toThrow(SchemaError)
        })

        it('rejects directive on enum field', function () {
            expect(() =>
                model(`
                    enum Status { ACTIVE INACTIVE }
                    type Account @entity {
                        id: ID!
                        status: Status @disableForeignKeyConstraint
                    }
                `)
            ).toThrow(SchemaError)
        })

        it('rejects directive on list (derivedFrom) field', function () {
            expect(() =>
                model(`
                    type Account @entity {
                        id: ID!
                        transfers: [Transfer!] @derivedFrom(field: "from") @disableForeignKeyConstraint
                    }
                    type Transfer @entity {
                        id: ID!
                        from: Account
                    }
                `)
            ).toThrow(SchemaError)
        })

        it('rejects directive on @derivedFrom lookup field', function () {
            expect(() =>
                model(`
                    type Account @entity {
                        id: ID!
                        profile: Profile @derivedFrom(field: "account") @disableForeignKeyConstraint
                    }
                    type Profile @entity {
                        id: ID!
                        account: Account! @unique
                    }
                `)
            ).toThrow(SchemaError)
        })

        it('rejects directive on non-entity type', function () {
            expect(() =>
                model(`
                    type Account @entity {
                        id: ID!
                    }
                    type Metadata {
                        ref: Account @disableForeignKeyConstraint
                    }
                    type Transfer @entity {
                        id: ID!
                        meta: Metadata
                    }
                `)
            ).toThrow(SchemaError)
        })
    })

    describe('runtime (opencrud)', function () {
        // Database setup: transfer table has from_id and to_id columns
        // with NO foreign key constraints. Some IDs reference accounts
        // that don't exist, simulating @disableForeignKeyConstraint behavior.
        useDatabase([
            `create table account (id text primary key, name text)`,
            `create table transfer (id text primary key, from_id text, to_id text, amount numeric)`,
            // account '1' exists, account '2' exists, but account 'missing' does NOT exist
            `insert into account (id, name) values ('1', 'Alice')`,
            `insert into account (id, name) values ('2', 'Bob')`,
            `insert into transfer (id, from_id, to_id, amount) values ('t1', '1', '2', 100)`,
            `insert into transfer (id, from_id, to_id, amount) values ('t2', '2', 'missing', 50)`,
            `insert into transfer (id, from_id, to_id, amount) values ('t3', 'missing', '1', 75)`,
            `insert into transfer (id, from_id, to_id, amount) values ('t4', null, '1', 25)`,
        ])

        const client = useServer(`
            type Account @entity {
                id: ID!
                name: String
                transfersFrom: [Transfer!] @derivedFrom(field: "from")
                transfersTo: [Transfer!] @derivedFrom(field: "to")
            }

            type Transfer @entity {
                id: ID!
                from: Account @disableForeignKeyConstraint
                to: Account @disableForeignKeyConstraint
                amount: Int!
            }
        `)

        it('returns null for FK relation when referenced row is missing, but exposes raw ID via {field}Id', function () {
            return client.test(`
                query {
                    transfers(orderBy: [id_ASC]) {
                        id
                        from { id name }
                        fromId
                        to { id name }
                        toId
                        amount
                    }
                }
            `, {
                transfers: [
                    {id: 't1', from: {id: '1', name: 'Alice'}, fromId: '1', to: {id: '2', name: 'Bob'}, toId: '2', amount: 100},
                    {id: 't2', from: {id: '2', name: 'Bob'}, fromId: '2', to: null, toId: 'missing', amount: 50},
                    {id: 't3', from: null, fromId: 'missing', to: {id: '1', name: 'Alice'}, toId: '1', amount: 75},
                    {id: 't4', from: null, fromId: null, to: {id: '1', name: 'Alice'}, toId: '1', amount: 25},
                ]
            })
        })

        it('can query only {field}Id without the relation', function () {
            return client.test(`
                query {
                    transfers(orderBy: [id_ASC]) {
                        id
                        fromId
                        toId
                    }
                }
            `, {
                transfers: [
                    {id: 't1', fromId: '1', toId: '2'},
                    {id: 't2', fromId: '2', toId: 'missing'},
                    {id: 't3', fromId: 'missing', toId: '1'},
                    {id: 't4', fromId: null, toId: '1'},
                ]
            })
        })

        it('supports {field}Id_eq filter', function () {
            return client.test(`
                query {
                    transfers(where: {fromId_eq: "missing"}, orderBy: [id_ASC]) {
                        id
                        fromId
                    }
                }
            `, {
                transfers: [
                    {id: 't3', fromId: 'missing'},
                ]
            })
        })

        it('supports {field}Id_not_eq filter', function () {
            return client.test(`
                query {
                    transfers(where: {fromId_not_eq: "missing"}, orderBy: [id_ASC]) {
                        id
                        fromId
                    }
                }
            `, {
                transfers: [
                    {id: 't1', fromId: '1'},
                    {id: 't2', fromId: '2'},
                ]
            })
        })

        it('supports {field}Id_in filter', function () {
            return client.test(`
                query {
                    transfers(where: {fromId_in: ["1", "missing"]}, orderBy: [id_ASC]) {
                        id
                        fromId
                    }
                }
            `, {
                transfers: [
                    {id: 't1', fromId: '1'},
                    {id: 't3', fromId: 'missing'},
                ]
            })
        })

        it('supports {field}Id_not_in filter', function () {
            return client.test(`
                query {
                    transfers(where: {fromId_not_in: ["1", "missing"]}, orderBy: [id_ASC]) {
                        id
                        fromId
                    }
                }
            `, {
                transfers: [
                    {id: 't2', fromId: '2'},
                ]
            })
        })

        it('supports {field}Id_isNull filter', function () {
            return client.test(`
                query {
                    transfers(where: {fromId_isNull: true}, orderBy: [id_ASC]) {
                        id
                        fromId
                    }
                }
            `, {
                transfers: [
                    {id: 't4', fromId: null},
                ]
            })
        })

        it('supports {field}Id_contains filter', function () {
            return client.test(`
                query {
                    transfers(where: {fromId_contains: "iss"}, orderBy: [id_ASC]) {
                        id
                        fromId
                    }
                }
            `, {
                transfers: [
                    {id: 't3', fromId: 'missing'},
                ]
            })
        })

        it('supports {field}Id_startsWith filter', function () {
            return client.test(`
                query {
                    transfers(where: {fromId_startsWith: "mis"}, orderBy: [id_ASC]) {
                        id
                        fromId
                    }
                }
            `, {
                transfers: [
                    {id: 't3', fromId: 'missing'},
                ]
            })
        })

        it('supports {field}Id_endsWith filter', function () {
            return client.test(`
                query {
                    transfers(where: {toId_endsWith: "2"}, orderBy: [id_ASC]) {
                        id
                        toId
                    }
                }
            `, {
                transfers: [
                    {id: 't1', toId: '2'},
                ]
            })
        })

        it('supports {field}Id_gt and {field}Id_lt filters', function () {
            return client.test(`
                query {
                    transfers(where: {fromId_gt: "1", fromId_lt: "missing"}, orderBy: [id_ASC]) {
                        id
                        fromId
                    }
                }
            `, {
                transfers: [
                    {id: 't2', fromId: '2'},
                ]
            })
        })

        it('can combine {field}Id filter with other filters', function () {
            return client.test(`
                query {
                    transfers(where: {fromId_eq: "2", amount_gt: 40}, orderBy: [id_ASC]) {
                        id
                        fromId
                        amount
                    }
                }
            `, {
                transfers: [
                    {id: 't2', fromId: '2', amount: 50},
                ]
            })
        })

        it('can combine {field}Id filter with relation filter in OR', function () {
            return client.test(`
                query {
                    transfers(where: {OR: [{fromId_eq: "missing"}, {from: {name_eq: "Alice"}}]}, orderBy: [id_ASC]) {
                        id
                        fromId
                    }
                }
            `, {
                transfers: [
                    {id: 't1', fromId: '1'},
                    {id: 't3', fromId: 'missing'},
                ]
            })
        })
    })
})
