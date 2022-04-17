import {useDatabase, useServer} from "./setup"


describe('isNull operator', function() {
    useDatabase([
        `create table meta (id text primary key)`,
        `create table entity (id text primary key, scalar text, json jsonb, meta_id text)`,
        `insert into meta (id) values ('1')`,
        `insert into entity (id, json, meta_id) values ('1', '{"a": 1}', '1')`,
        `insert into entity (id, scalar, meta_id) values ('2', 'foo', '1')`,
        `insert into entity (id, scalar, json) values ('3', 'foo', '{"a": 2}')`,
        `insert into entity (id, scalar, json, meta_id) values ('4', 'foo', '{}', '1')`,
    ])

    const client = useServer(`
        type Meta @entity {
            id: ID!
        }
        
        type Entity @entity {
            id: ID!
            scalar: String
            json: JsonObject
            meta: Meta
        }
        
        type JsonObject {
            a: Int
        }
    `)

    it("on scalar", function() {
        return client.test(`
            query {
                entities(where: {scalar_isNull: true}) {
                    id
                }
            }
        `, {
            entities: [{id: '1'}]
        })
    })

    it("on json", function() {
        return client.test(`
            query {
                entities(where: {json_isNull: true}) {
                    id
                }
            }
        `, {
            entities: [{id: '2'}]
        })
    })

    it("on nested json prop", function() {
        return client.test(`
            query {
                entities(where: {json: {a_isNull: true}} orderBy: id_ASC) {
                    id
                }
            }
        `, {
            entities: [{id: '2'}, {id: '4'}]
        })
    })

    it("on fk", function() {
        return client.test(`
            query {
                entities(where: {meta_isNull: true}) {
                    id
                }
            }
        `, {
            entities: [{id: '3'}]
        })
    })
})
