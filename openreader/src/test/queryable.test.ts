import {useDatabase, useServer} from './setup'

describe('queryable interfaces', function() {
    useDatabase([
        `create table foo (id text primary key, name text, foo int)`,
        `create table bar (id text primary key, name text, bar int)`,
        `create table ref (id text primary key, name text, foo_id text not null unique references foo, bar_id text not null unique references bar)`,
        `create table baz (id text primary key, name text, ref_id text references ref, baz int)`,
        `insert into foo (id, name, foo) values ('foo-1', 'hello-foo-1', 1)`,
        `insert into foo (id, name, foo) values ('foo-2', 'hello-foo-2', 2)`,
        `insert into bar (id, name, bar) values ('bar-1', 'hello-bar-1', 10)`,
        `insert into bar (id, name, bar) values ('bar-2', 'hello-bar-2', 20)`,
        `insert into ref (id, name, foo_id, bar_id) values ('1', 'ref-1', 'foo-1', 'bar-2')`,
        `insert into ref (id, name, foo_id, bar_id) values ('2', 'ref-2', 'foo-2', 'bar-1')`,
        `insert into baz (id, name, baz, ref_id) values ('baz-1', 'hello-baz-1', 100, '1')`,
    ])

    const client = useServer(`
        interface Entity @query {
            id: ID!
            name: String
            ref: Ref
        }
        
        type Ref @entity {
            id: ID!
            name: String
            foo: Foo! @unique
            bar: Bar! @unique
        } 
    
        type Foo implements Entity @entity {
            id: ID!
            name: String
            ref: Ref @derivedFrom(field: "foo")
            foo: Int
        }
        
        type Bar implements Entity @entity {
            id: ID!
            name: String
            ref: Ref @derivedFrom(field: "bar")
            bar: Int
        }
        
        type Baz implements Entity @entity {
            id: ID!
            name: String
            ref: Ref
            baz: Int
        }
    `)

    it('fetching', function() {
        return client.test(`
            query {
                entities(orderBy: id_ASC) {
                    id
                    name
                    ref {
                        id
                        name
                    }
                    ... on Foo { foo }
                    ... on Bar { bar }
                    ... on Baz { baz }
                }
            }
        `, {
            entities: [
                {
                    id: 'bar-1',
                    name: 'hello-bar-1',
                    ref: {
                        id: '2',
                        name: 'ref-2'
                    },
                    bar: 10
                },
                {
                    id: 'bar-2',
                    name: 'hello-bar-2',
                    ref: {
                        id: '1',
                        name: 'ref-1'
                    },
                    bar: 20
                },
                {
                    id: 'baz-1',
                    name: 'hello-baz-1',
                    ref: {
                        id: '1',
                        name: 'ref-1'
                    },
                    baz: 100
                },
                {
                    id: 'foo-1',
                    name: 'hello-foo-1',
                    ref: {
                        id: '1',
                        name: 'ref-1'
                    },
                    foo: 1
                },
                {
                    id: 'foo-2',
                    name: 'hello-foo-2',
                    ref: {
                        id: '2',
                        name: 'ref-2'
                    },
                    foo: 2
                }
            ]
        })
    })
})
