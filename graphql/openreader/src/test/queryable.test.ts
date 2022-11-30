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
        `create table one (id text primary key)`,
        `create table two (id text primary key)`,
        `create table relation (id text primary key, one_id text references one, two_id text references two)`,
        `insert into one (id) values ('1-1')`,
        `insert into one (id) values ('1-2')`,
        `insert into two (id) values ('2-1')`,
        `insert into two (id) values ('2-2')`,
        `insert into relation (id, one_id, two_id) values ('r-1', '1-1', '2-1')`,
        `insert into relation (id, one_id, two_id) values ('r-2', '1-2', '2-1')`,
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
        
        interface Number @query {
            id: ID!
            relations: [Relation!]!
        }
        
        type One implements Number @entity {
            id: ID!
            relations: [Relation!]! @derivedFrom(field: "one")
        }
        
        type Two implements Number @entity {
            id: ID!
            relations: [Relation!]! @derivedFrom(field: "two")
        }
        
        type Relation @entity {
            id: ID!
            one: One
            two: Two
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

    it('sorting by entity type', function() {
        return client.test(`
            query {
                entities(orderBy: [_type_DESC, id_ASC]) {
                    id
                }
            }
        `, {
            entities: [
                {id: 'foo-1'},
                {id: 'foo-2'},
                {id: 'baz-1'},
                {id: 'bar-1'},
                {id: 'bar-2'}
            ]
        })
    })

    it('pagination', function() {
        return client.test(`
            query {
                page1: entitiesConnection(orderBy: id_ASC, first: 2) {
                    ...fields
                }
                page2: entitiesConnection(orderBy: id_ASC, first: 2, after: "2") {
                    ...fields
                }
                page3: entitiesConnection(orderBy: id_ASC, first: 2, after: "4") {
                    ...fields
                }
            }
            
            fragment fields on EntitiesConnection {
                edges {
                    cursor
                    node { 
                        ... on Foo { foo }
                        ... on Bar { bar }
                    }
                }
                pageInfo { 
                    hasNextPage 
                    hasPreviousPage 
                    startCursor 
                    endCursor 
                }
                totalCount
            }
        `, {
            page1: {
                edges: [
                    {cursor: '1', node: {bar: 10}},
                    {cursor: '2', node: {bar: 20}},
                ],
                pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: false,
                    startCursor: '1',
                    endCursor: '2'
                },
                totalCount: 5
            },
            page2: {
                edges: [
                    {cursor: '3', node: {}},
                    {cursor: '4', node: {foo: 1}},
                ],
                pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: '3',
                    endCursor: '4'
                },
                totalCount: 5
            },
            page3: {
                edges: [
                    {cursor: '5', node: {foo: 2}},
                ],
                pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: true,
                    startCursor: '5',
                    endCursor: '5'
                },
                totalCount: 5
            }
        })
    })

    it('list lookup fields in interfaces', function() {
        return client.test(`
            query {
                numbers(orderBy: id_ASC) {
                    id
                    relations { id }
                    __typename
                }
            }
        `, {
            numbers: [
                {__typename: 'One', id: '1-1', relations: [{id: 'r-1'}]},
                {__typename: 'One', id: '1-2', relations: [{id: 'r-2'}]},
                {__typename: 'Two', id: '2-1', relations: [{id: 'r-1'}, {id: 'r-2'}]},
                {__typename: 'Two', id: '2-2', relations: []}
            ]
        })
    })
})
