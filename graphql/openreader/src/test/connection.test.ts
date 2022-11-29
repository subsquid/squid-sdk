import {useDatabase, useServer} from "./setup"

describe('relay connections', function () {
    useDatabase([
        `create table letter (id text primary key)`,
        `insert into letter (id) values ('a')`,
        `insert into letter (id) values ('b')`,
        `insert into letter (id) values ('c')`,
        `insert into letter (id) values ('d')`,
        `insert into letter (id) values ('e')`,
        `insert into letter (id) values ('f')`,
        `insert into letter (id) values ('g')`,
        `create table empty (id text primary key)`
    ])

    const client = useServer(`
        type Letter @entity {
            id: ID!
        }
        
        type Empty @entity {
            id: ID!
        }
    `)

    it('pagination', function () {
        return client.test(`
            query { 
                page1: lettersConnection(orderBy: id_ASC, first: 3) {
                    ...fields
                } 
                page2: lettersConnection(orderBy: id_ASC, first: 3, after: "3") {
                    ...fields
                } 
                page3: lettersConnection(orderBy: id_ASC, first: 3, after: "6") {
                    ...fields
                } 
            }
            fragment fields on LettersConnection {
                edges { 
                    node { id } 
                    cursor
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
                    {node: {id: 'a'}, cursor: '1'},
                    {node: {id: 'b'}, cursor: '2'},
                    {node: {id: 'c'}, cursor: '3'},
                ],
                pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: false,
                    startCursor: '1',
                    endCursor: '3'
                },
                totalCount: 7
            },
            page2: {
                edges: [
                    {node: {id: 'd'}, cursor: '4'},
                    {node: {id: 'e'}, cursor: '5'},
                    {node: {id: 'f'}, cursor: '6'},
                ],
                pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: '4',
                    endCursor: '6'
                },
                totalCount: 7
            },
            page3: {
                edges: [
                    {node: {id: 'g'}, cursor: '7'},
                ],
                pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: true,
                    startCursor: '7',
                    endCursor: '7'
                },
                totalCount: 7
            }
        })
    })

    it('pagination without nodes', function () {
        return client.test(`
            query { 
                page1: lettersConnection(orderBy: id_ASC, first: 3) {
                    ...fields
                } 
                page2: lettersConnection(orderBy: id_ASC, first: 3, after: "3") {
                    ...fields
                } 
                page3: lettersConnection(orderBy: id_ASC, first: 3, after: "6") {
                    ...fields
                } 
            }
            fragment fields on LettersConnection {
                edges { 
                    cursor
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
                    {cursor: '1'},
                    {cursor: '2'},
                    {cursor: '3'},
                ],
                pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: false,
                    startCursor: '1',
                    endCursor: '3'
                },
                totalCount: 7
            },
            page2: {
                edges: [
                    {cursor: '4'},
                    {cursor: '5'},
                    {cursor: '6'},
                ],
                pageInfo: {
                    hasNextPage: true,
                    hasPreviousPage: true,
                    startCursor: '4',
                    endCursor: '6'
                },
                totalCount: 7
            },
            page3: {
                edges: [
                    {cursor: '7'},
                ],
                pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: true,
                    startCursor: '7',
                    endCursor: '7'
                },
                totalCount: 7
            }
        })
    })

    it('request to empty table', function () {
        return client.test(`
            query {
                emptiesConnection(orderBy: id_ASC) {
                    edges { 
                        node { id } 
                        cursor
                    }
                    pageInfo { 
                        hasNextPage 
                        hasPreviousPage 
                        startCursor 
                        endCursor 
                    }
                    totalCount
                }
            }
        `, {
            emptiesConnection: {
                edges: [],
                pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    startCursor: '',
                    endCursor: ''
                },
                totalCount: 0
            }
        })
    })
})
