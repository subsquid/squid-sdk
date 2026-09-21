import {useSchema} from './util/schema'
import {useServer} from './util/server'


// Feature: with DB_SCHEMA set, a server that runs through the plain pg Pool
// context (selected because the project has no custom resolvers) must read
// entity data from that schema. This exercises `createPgPool`.
describe('graphql-server with DB_SCHEMA (Pool context, live DB)', () => {
    useSchema('gql_pool_schema', [
        `create table item (id text primary key, name text)`,
        `insert into item (id, name) values ('1', 'hello')`,
    ])

    const client = useServer('lib/test/schema-plain')

    it('openreader reads entities from DB_SCHEMA', () => {
        return client.test(`query { items { id name } }`, {
            items: [{id: '1', name: 'hello'}]
        })
    })
})
