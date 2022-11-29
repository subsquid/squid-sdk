import {isCockroach, useDatabase, useServer} from "./setup"


function tsvector(columns: string[]) {
    return columns.map(col => `setweight(to_tsvector('english', coalesce(${col}, '')), 'A')`).join(' || ')
}


isCockroach() || describe.skip('full text search', function () {
    useDatabase([
        `create table foo (
            id text primary key, 
            foo int, 
            comment text, 
            search_tsv tsvector generated always as ( ${tsvector(['comment'])} ) stored
        )`,
        `create table bar (
            id text primary key, 
            bar text, 
            description text, 
            search_tsv tsvector generated always as ( ${tsvector(['bar', 'description'])} ) stored
        )`,
        `insert into foo (id, foo, comment) values ('1', 1, 'Some man greeted me with hello')`,
        `insert into foo (id, foo, comment) values ('2', 2, 'Deeply buried lorem ipsum dolor sit amet, then comes baz')`,
        `insert into foo (id, foo, comment) values ('3', 3, 'Lorem ipsum dolor sit amet')`,
        `insert into bar (id, bar, description) values ('1', 'every bar is followed by baz. Baz!', 'Absolutely!')`,
        `insert into bar (id, bar, description) values ('2', 'qux', 'Baz should be here! Baz! Baz! Baz!')`,
    ])

    const client = useServer(`
        type Foo @entity {
            id: ID!
            foo: Int
            comment: String @fulltext(query: "search")
        }
        
        type Bar @entity {
            id: ID!
            bar: String @fulltext(query: "search")
            description: String @fulltext(query: "search")
        }
    `)

    it('finds "hello" across entities in Foo.comment and highlights it', function () {
        return client.test(`
            query {
                search(text: "hello") {
                    item {
                        ... on Foo { id, foo }
                    }
                    highlight
                }
            }
        `, {
            search: [{
                item: {id: '1', foo: 1},
                highlight: 'Some man greeted me with <b>hello</b>'
            }]
        })
    })

    it('finds "absolute" across entities in Bar.description and highlights it', function () {
        return client.test(`
            query {
                search(text: "absolute") {
                    item {
                        ... on Bar { id, bar }
                    }
                    highlight
                }
            }
        `, {
            search: [{
                item: {id: '1', bar: 'every bar is followed by baz. Baz!'},
                highlight: 'every bar is followed by baz. Baz!\n\n<b>Absolutely</b>!'
            }]
        })
    })

    it('finds and arranges "Baz"', function () {
        return client.test(`
            query {
                search(text: "baz") {
                    item {
                        ... on Foo { id foo }
                        ... on Bar { id bar }
                    }
                }
            }
        `, {
            search: [
                {item: {id: '2', bar: 'qux'}},
                {item: {id: '1', bar: 'every bar is followed by baz. Baz!'}},
                {item: {id: '2', foo: 2}},
            ]
        })
    })

    it('supports where conditions', function () {
        return client.test(`
            query {
                search(text: "baz" whereBar: {bar_eq: "qux"}) {
                    item {
                        ... on Foo { id foo }
                        ... on Bar { id bar }
                    }
                }
            }
        `, {
            search: [
                {item: {id: '2', bar: 'qux'}},
                {item: {id: '2', foo: 2}}
            ]
        })
    })
})
