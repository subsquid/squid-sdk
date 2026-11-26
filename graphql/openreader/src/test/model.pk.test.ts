import {parse} from 'graphql'
import {buildModel, buildSchema} from '../model.schema'
import {validateModel} from '../model.tools'
import type {Entity, Model} from '../model'


function model(schema: string): Model {
    return buildModel(buildSchema(parse(schema)))
}


function entity(schema: string, name: string): Entity {
    let item = model(schema)[name]
    expect(item.kind).toBe('entity')
    return item as Entity
}


describe('@entity(pk:)', function () {
    describe('parsing', function () {
        it('leaves pk unset when the argument is absent', function () {
            expect(entity(`type Transfer @entity { id: ID! }`, 'Transfer').pk).toBeUndefined()
        })

        it('leaves pk unset for an explicit single-column key', function () {
            // ['id'] is the default, so it must not be distinguishable from
            // not opting in — otherwise it would reach codegen as a composite.
            expect(entity(`type Transfer @entity(pk: ["id"]) { id: ID! }`, 'Transfer').pk).toBeUndefined()
        })

        it('records a composite key in declaration order', function () {
            let e = entity(`
                type Transfer @entity(pk: ["id", "timestamp"]) {
                    id: ID!
                    timestamp: DateTime!
                }
            `, 'Transfer')
            expect(e.pk).toEqual(['id', 'timestamp'])
        })

        it('accepts a key over several columns', function () {
            let e = entity(`
                type Transfer @entity(pk: ["id", "timestamp", "block"]) {
                    id: ID!
                    timestamp: DateTime!
                    block: Int!
                }
            `, 'Transfer')
            expect(e.pk).toEqual(['id', 'timestamp', 'block'])
        })

        it('accepts a key on an entity that does not declare id', function () {
            // `id` is synthesized for entities that omit it, so it is valid in
            // a pk even though it is absent from the type's fields.
            let e = entity(`
                type Transfer @entity(pk: ["id", "timestamp"]) {
                    timestamp: DateTime!
                }
            `, 'Transfer')
            expect(e.pk).toEqual(['id', 'timestamp'])
        })

        it('accepts an enum column', function () {
            let e = entity(`
                enum Network { ETHEREUM POLYGON }
                type Transfer @entity(pk: ["id", "network"]) {
                    id: ID!
                    network: Network!
                }
            `, 'Transfer')
            expect(e.pk).toEqual(['id', 'network'])
        })
    })

    describe('validation', function () {
        it('rejects an empty key', function () {
            expect(() => model(`type Transfer @entity(pk: []) { id: ID! }`))
                .toThrow(/no fields were listed/)
        })

        it('rejects a key that does not start with id', function () {
            expect(() => model(`
                type Transfer @entity(pk: ["timestamp", "id"]) {
                    id: ID!
                    timestamp: DateTime!
                }
            `)).toThrow(/must start with 'id'/)
        })

        it('rejects a repeated column', function () {
            expect(() => model(`
                type Transfer @entity(pk: ["id", "timestamp", "timestamp"]) {
                    id: ID!
                    timestamp: DateTime!
                }
            `)).toThrow(/listed twice/)
        })

        it('rejects an unknown column', function () {
            expect(() => model(`type Transfer @entity(pk: ["id", "nope"]) { id: ID! }`))
                .toThrow(/doesn't have a field 'nope'/)
        })

        it('rejects a nullable column', function () {
            expect(() => model(`
                type Transfer @entity(pk: ["id", "timestamp"]) {
                    id: ID!
                    timestamp: DateTime
                }
            `)).toThrow(/must be non-nullable/)
        })

        it('rejects a list column', function () {
            expect(() => model(`
                type Transfer @entity(pk: ["id", "tags"]) {
                    id: ID!
                    tags: [String!]!
                }
            `)).toThrow(/it is a list/)
        })

        it('rejects a JSON column', function () {
            expect(() => model(`
                type Transfer @entity(pk: ["id", "payload"]) {
                    id: ID!
                    payload: JSON!
                }
            `)).toThrow(/JSON is not supported there/)
        })

        it('rejects a Bytes column', function () {
            // Bytes is normalized to a hex string on its way into the change
            // log, so it would not match the entity-side value on rollback.
            expect(() => model(`
                type Transfer @entity(pk: ["id", "hash"]) {
                    id: ID!
                    hash: Bytes!
                }
            `)).toThrow(/Bytes is not supported there/)
        })

        it('rejects an entity reference', function () {
            expect(() => model(`
                type Account @entity { id: ID! }
                type Transfer @entity(pk: ["id", "from"]) {
                    id: ID!
                    from: Account!
                }
            `)).toThrow(/not a scalar or enum/)
        })
    })

    describe('validateModel()', function () {
        // Guards models assembled programmatically, which never pass through
        // the GraphQL directive checks above.
        function withPk(pk: string[]): Model {
            return {
                Transfer: {
                    kind: 'entity',
                    properties: {
                        id: {type: {kind: 'scalar', name: 'ID'}, nullable: false},
                        timestamp: {type: {kind: 'scalar', name: 'DateTime'}, nullable: false},
                        note: {type: {kind: 'scalar', name: 'String'}, nullable: true},
                        payload: {type: {kind: 'scalar', name: 'JSON'}, nullable: false},
                        hash: {type: {kind: 'scalar', name: 'Bytes'}, nullable: false},
                    },
                    pk,
                },
            }
        }

        it('accepts a well-formed composite key', function () {
            expect(() => validateModel(withPk(['id', 'timestamp']))).not.toThrow()
        })

        it('rejects a key not starting with id', function () {
            expect(() => validateModel(withPk(['timestamp']))).toThrow(/must start with 'id'/)
        })

        it('rejects an unknown property', function () {
            expect(() => validateModel(withPk(['id', 'missing']))).toThrow(/doesn't have a property missing/)
        })

        it('rejects a nullable property', function () {
            expect(() => validateModel(withPk(['id', 'note']))).toThrow(/it is nullable/)
        })

        it('rejects a JSON property', function () {
            expect(() => validateModel(withPk(['id', 'payload']))).toThrow(/JSON is not supported there/)
        })

        it('rejects a Bytes property', function () {
            expect(() => validateModel(withPk(['id', 'hash']))).toThrow(/Bytes is not supported there/)
        })

        it('rejects an empty pk', function () {
            expect(() => validateModel(withPk([]))).toThrow(/empty pk/)
        })

        it('rejects a repeated property', function () {
            expect(() => validateModel(withPk(['id', 'timestamp', 'timestamp'])))
                .toThrow(/listed twice/)
        })

        it('rejects a property that is neither a scalar nor an enum', function () {
            let model: Model = {
                Account: {kind: 'entity', properties: {id: {type: {kind: 'scalar', name: 'ID'}, nullable: false}}},
                Transfer: {
                    kind: 'entity',
                    properties: {
                        id: {type: {kind: 'scalar', name: 'ID'}, nullable: false},
                        from: {type: {kind: 'fk', entity: 'Account'}, nullable: false},
                    },
                    pk: ['id', 'from'],
                },
            }
            expect(() => validateModel(model)).toThrow(/can't be a part of a pk/)
        })
    })
})
