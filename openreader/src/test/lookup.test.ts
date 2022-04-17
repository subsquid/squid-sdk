import {isCockroach, useDatabase, useServer} from "./setup"

describe('lookup test', function () {
    useDatabase([
        `create table issue (id text primary key)`,
        `create table issue_payment (id text primary key, issue_id text not null unique, amount numeric)`,
        `create table issue_cancellation (id text primary key, issue_id text not null unique, height int)`,
        `insert into issue (id) values ('1')`,
        `insert into issue (id) values ('2')`,
        `insert into issue (id) values ('3')`,
        `insert into issue_payment (id, issue_id, amount) values ('1', '1', 2)`,
        `insert into issue_payment (id, issue_id, amount) values ('2', '2', 1)`,
        `insert into issue_cancellation (id, issue_id, height) values ('3', '3', 10)`,
    ])

    const client = useServer(`
        type Issue @entity {
            id: ID!
            payment: IssuePayment @derivedFrom(field: "issue")
            cancellation: IssueCancellation @derivedFrom(field: "issue")
        }
        
        type IssuePayment @entity {
            id: ID!
            issue: Issue! @unique
            amount: Int!
        }
        
        type IssueCancellation @entity {
            id: ID!
            issue: Issue! @unique
            height: Int!
        }
    `)

    it('fetches correctly', function () {
        return client.test(`
            query {
                issues(orderBy: [id_ASC]) {
                    id
                    payment {
                        amount
                    }
                    cancellation {
                        height
                        issue {
                            cancellation {
                                id
                            }
                        }
                    }
                }
            }
        `, {
            issues: [
                {
                    id: '1',
                    payment: {amount: 2},
                    cancellation: null
                },
                {
                    id: '2',
                    payment: {amount: 1},
                    cancellation: null
                },
                {
                    id: '3',
                    payment: null,
                    cancellation: {
                        height: 10,
                        issue: {
                            cancellation: {
                                id: '3'
                            }
                        }
                    }
                }
            ]
        })
    })

    it('supports sorting on lookup fields', function () {
        return client.test(`
            query {
                issues(orderBy: [payment_amount_ASC]) {
                    id
                }
            }
        `, {
            issues: isCockroach()
                ? [
                    {id: '3'},
                    {id: '2'},
                    {id: '1'}
                ]
                : [
                    {id: '2'},
                    {id: '1'},
                    {id: '3'}
                ]
        })
    })

    it('supports where conditions', function () {
        return client.test(`
            query {
                issues(where: {payment: {amount_gt: 1}}) {
                    id
                }
            }
        `, {
            issues: [
                {id: '1'}
            ]
        })
    })
})
