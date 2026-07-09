import {useSchema} from './util/schema'
import {useServer} from './util/server'


// Feature: with DB_SCHEMA set, a server that runs through the TypeORM context
// (selected because the project defines custom resolvers) must read entity data
// from that schema. This exercises `createTypeormConnection`, whose `extra` used
// to clobber the search_path carried by @subsquid/typeorm-config.
describe('graphql-server with DB_SCHEMA (TypeORM context, live DB)', () => {
    useSchema('gql_typeorm_schema', [
        `create table scalar (id text primary key, "bool" bool, date timestamptz, big_int numeric, big_decimal numeric, "bytes" bytea, attributes jsonb)`,
        `insert into scalar (id, bool) values ('1', true)`,
    ])

    const client = useServer('lib/test/resolvers-extension')

    it('custom resolver (EntityManager) reads entities from DB_SCHEMA', () => {
        return client.test(`query { scalarsExtension { id bool } }`, {
            scalarsExtension: [{id: '1', bool: true}]
        })
    })

    it('openreader reads entities from DB_SCHEMA', () => {
        return client.test(`query { scalars { id bool } }`, {
            scalars: [{id: '1', bool: true}]
        })
    })
})
