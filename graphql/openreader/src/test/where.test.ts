import {Dialect} from '../dialect'
import {useDatabase, useServer} from "./setup"

describe('AND, OR on entity filters', function () {
    useDatabase([
        `create table item (id text primary key, a int, b int)`,
        `insert into item (id, a, b) values ('1', 1, 1)`,
        `insert into item (id, a, b) values ('2', 2, 2)`,
        `insert into item (id, a, b) values ('3', 3, 2)`,
        `insert into item (id, a, b) values ('4', 4, 4)`,
        `insert into item (id, a, b) values ('5', 5, 4)`,
        `insert into item (id, a, b) values ('6', 5, 6)`,
    ])

    describe('opencrud', function() {
        const client = useServer(`
            type Item @entity {
                id: ID!
                a: Int
                b: Int
            }
        `)
    
        it('{c, and: {c}}', function () {
            return client.test(`
                query {
                    items(where: {a_eq: 1, AND: {b_eq: 1}} orderBy: id_ASC) { id }
                }
            `, {
                items: [
                    {id: '1'}
                ]
            })
        })
    
        it('{and: {and: {c}, c}}', function () {
            return client.test(`
                query {
                    items(where: {AND: {b_eq: 2, AND: {a_eq: 3}}} orderBy: id_ASC) { id }
                }
            `, {
                items: [
                    {id: '3'}
                ]
            })
        })
    
        it('{and: [{c}, {c}]}', function () {
            return client.test(`
                query {
                    items(where: {AND: [{a_eq: 2}, {b_eq: 2}]} orderBy: id_ASC) { id }
                }
            `, {
                items: [
                    {id: '2'}
                ]
            })
        })
    
        it('{c, {or: {c}}}', function () {
            return client.test(`
                query {
                    items(where: {a_eq: 1, OR: {a_eq: 2}} orderBy: id_ASC) { id }
                }
            `, {
                items: [
                    {id: '1'},
                    {id: '2'}
                ]
            })
        })
    
        it('{or: [{c}, {c}]}', function () {
            return client.test(`
                query {
                    items(where: {OR: [{a_eq: 2}, {a_eq: 3}]} orderBy: id_ASC) { id }
                }
            `, {
                items: [
                    {id: '2'},
                    {id: '3'}
                ]
            })
        })
    
        it('{or: {or: {c}, c}}', function () {
            return client.test(`
                query {
                    items(where: {OR: {a_eq: 1, OR: {b_eq: 2}}} orderBy: id_ASC) { id }
                }
            `, {
                items: [
                    {id: '1'},
                    {id: '2'},
                    {id: '3'}
                ]
            })
        })
    
        it('{and: [{or: {c}, c}, {or: {c}, c}]}', function () {
            return client.test(`
                query {
                    items(where: {AND: [{OR: {a_eq: 5}, a_eq: 4}, {OR: {b_eq: 2}, b_eq: 4}]} orderBy: id_ASC) { id }
                }
            `, {
                items: [
                    {id: '4'},
                    {id: '5'}
                ]
            })
        })
    
        it('{c, and: {c}, or: {c}}', function () {
            return client.test(`
                query {
                    items(where: { a_eq: 4, AND: {b_eq: 4}, OR: {b_eq: 6} } orderBy: id_ASC) { id }
                }
            `, {
                items: [
                    {id: '4'},
                    {id: '6'}
                ]
            })
        })
    
        it('handles empty wheres', function () {
            return client.test(`
                query {
                    items(where: { a_eq: 4, AND: { OR: {}, AND: {} }, OR: { OR: {AND: {} } } } orderBy: id_ASC) { id }
                }
            `, {
                items: [
                    {id: '4'}
                ]
            })
        })
    })
    
    describe('thegraph', function() {
        const client = useServer(`
            type Item @entity {
                id: ID!
                a: Int
                b: Int
            }
        `, {dialect: Dialect.TheGraph})
    
        it('{c, and: {c}}', function () {
            return client.test(`
                query {
                    items(where: {a: 1, and: {b: 1}}, orderBy: id, orderDirection: asc) { id }
                }
            `, {
                items: [
                    {id: '1'}
                ]
            })
        })
    
        it('{and: {and: {c}, c}}', function () {
            return client.test(`
                query {
                    items(where: {and: {b: 2, and: {a: 3}}}, orderBy: id, orderDirection: asc) { id }
                }
            `, {
                items: [
                    {id: '3'}
                ]
            })
        })
    
        it('{and: [{c}, {c}]}', function () {
            return client.test(`
                query {
                    items(where: {and: [{a: 2}, {b: 2}]}, orderBy: id, orderDirection: asc) { id }
                }
            `, {
                items: [
                    {id: '2'}
                ]
            })
        })
    
        it('{c, {or: {c}}}', function () {
            return client.test(`
                query {
                    items(where: {a: 1, or: {a: 2}}, orderBy: id, orderDirection: asc) { id }
                }
            `, {
                items: [
                    {id: '1'},
                    {id: '2'}
                ]
            })
        })
    
        it('{or: [{c}, {c}]}', function () {
            return client.test(`
                query {
                    items(where: {or: [{a: 2}, {a: 3}]}, orderBy: id, orderDirection: asc) { id }
                }
            `, {
                items: [
                    {id: '2'},
                    {id: '3'}
                ]
            })
        })
    
        it('{or: {or: {c}, c}}', function () {
            return client.test(`
                query {
                    items(where: {or: {a: 1, or: {b: 2}}}, orderBy: id, orderDirection: asc) { id }
                }
            `, {
                items: [
                    {id: '1'},
                    {id: '2'},
                    {id: '3'}
                ]
            })
        })
    
        it('{and: [{or: {c}, c}, {or: {c}, c}]}', function () {
            return client.test(`
                query {
                    items(where: {and: [{or: {a: 5}, a: 4}, {or: {b: 2}, b: 4}]}, orderBy: id, orderDirection: asc) { id }
                }
            `, {
                items: [
                    {id: '4'},
                    {id: '5'}
                ]
            })
        })
    
        it('{c, and: {c}, or: {c}}', function () {
            return client.test(`
                query {
                    items(where: { a: 4, and: {b: 4}, or: {b: 6} }, orderBy: id, orderDirection: asc) { id }
                }
            `, {
                items: [
                    {id: '4'},
                    {id: '6'}
                ]
            })
        })
    
        it('handles empty wheres', function () {
            return client.test(`
                query {
                    items(where: { a: 4, and: { or: {}, and: {} }, or: { or: {and: {} } } }, orderBy: id, orderDirection: asc) { id }
                }
            `, {
                items: [
                    {id: '4'}
                ]
            })
        })
    })
})
