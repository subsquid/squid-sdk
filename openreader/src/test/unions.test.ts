import {useDatabase, useServer} from "./setup"

describe('unions', function () {
    useDatabase([
        `create table "user" (id text primary key, login text)`,
        `create table equipment (id text primary key, name text, owner jsonb)`,
        `insert into "user" (id, login) values ('1', 'farmer')`,
        `insert into "user" (id, login) values ('2', 'programmer')`,
        `insert into equipment (id, name, owner) values ('1', 'combine', '{"isTypeOf": "Farmer", "user": "1", "crop": 100}'::jsonb)`,
        `insert into equipment (id, name, owner) values ('2', 'computer', '{"isTypeOf": "Programmer", "user": "2", "stack": "Python"}'::jsonb)`
    ])

    const client = useServer(`
        type User @entity {
            id: ID!
            login: String!
        }
        
        type Farmer {
            user: User!
            crop: Int
        }
        
        type Programmer {
            user: User!
            stack: String
        }
        
        union Owner = Farmer | Programmer
        
        type Equipment @entity {
            name: String!
            owner: Owner!
        }
    `)

    it('output', function () {
        return client.test(`
            query {
                equipment(orderBy: id_ASC) {
                    name
                    owner {
                        ... on Farmer {
                            user { login }
                            crop
                        }
                        ... on Programmer {
                            user { login }
                            stack
                        }
                    }
                }
            }
        `, {
            equipment: [
                {
                    name: 'combine',
                    owner: {
                        user: {login: 'farmer'},
                        crop: 100
                    }
                },
                {
                    name: 'computer',
                    owner: {
                        user: {login: 'programmer'},
                        stack: 'Python'
                    }
                }
            ]
        })
    })

    it('filtering', function () {
        return client.test(`
            query {
                type_farmer:  equipment(where: {owner: {isTypeOf_eq: "Farmer"}}) { id }
                stack_Python: equipment(where: {owner: {stack_eq:    "Python"}}) { id }
            }
        `, {
            type_farmer: [{id: '1'}],
            stack_Python: [{id: '2'}]
        })
    })
})
