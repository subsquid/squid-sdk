import {useDatabase, useServer} from "./setup"


describe('basic tests', function() {
    useDatabase([
        `create table account (id text primary key, wallet text, balance numeric)`,
        `create table historical_balance (id text primary key, account_id text references account(id), balance numeric)`,
        `insert into account (id, wallet, balance) values ('1', 'a', 100)`,
        `insert into account (id, wallet, balance) values ('2', 'b', 200)`,
        `insert into account (id, wallet, balance) values ('3', 'c', 300)`,
        `insert into historical_balance (id, account_id, balance) values ('1-1', '1', 20)`,
        `insert into historical_balance (id, account_id, balance) values ('1-2', '1', 80)`,
        `insert into historical_balance (id, account_id, balance) values ('2-1', '2', 50)`,
        `insert into historical_balance (id, account_id, balance) values ('2-2', '2', 90)`,
        `insert into historical_balance (id, account_id, balance) values ('2-3', '2', 60)`,
        `insert into historical_balance (id, account_id, balance) values ('3-1', '3', 300)`,
    ])

    const client = useServer(`
        interface HasBalance {
            balance: Int!
        }
    
        type Account implements HasBalance @entity {
            id: ID!
            wallet: String!
            balance: Int!
            history: [HistoricalBalance!] @derivedFrom(field: "account")
        }

        "Historical record of account balance"
        type HistoricalBalance implements HasBalance @entity {
            "Unique identifier"
            id: ID!
            
            "Related account"
            account: Account!
            
            "Balance"
            balance: Int!
        }
    `)

    it('can fetch all accounts', function() {
        return client.test(
            `query {
                accounts(orderBy: id_ASC) {
                    id
                    wallet
                    balance
                    history(orderBy: id_ASC) { balance }
                }
            }`,
            {
                accounts: [
                    {id: '1', wallet: 'a', balance: 100, history: [{balance: 20}, {balance: 80}]},
                    {id: '2', wallet: 'b', balance: 200, history: [{balance: 50}, {balance: 90}, {balance: 60}]},
                    {id: '3', wallet: 'c', balance: 300, history: [{balance: 300}]},
                ]
            }
        )
    })

    it('supports filtering by id', function () {
        return client.test(
            `query {
                accounts(where: {id_eq: "3"}) {
                    id
                    wallet
                }
            }`,
            {
                accounts: [{id: '3', wallet: 'c'}]
            }
        )
    })

    it('supports by id query', function () {
        return client.test(
            `query {
                a3: accountById(id: "3") {
                    id
                    wallet
                }
                nonexistent: accountById(id: "foo") {
                    id
                    wallet
                }
            }`,
            {
                a3: {id: '3', wallet: 'c'},
                nonexistent: null
            }
        )
    })

    it('supports by unique input query', function () {
        return client.test(
            `query {
                a2: accountByUniqueInput(where: {id: "2"}) {
                    id
                    wallet
                }
                nonexistent: accountByUniqueInput(where: {id: "foo"}) {
                    id
                    wallet
                }
            }`,
            {
                a2: {id: '2', wallet: 'b'},
                nonexistent: null
            }
        )
    })

    it('can fetch deep relations', function () {
        return client.test(
            `query {
                accounts(where: {id_eq: "3"}) {
                    id
                    history {
                        id
                        account {
                            wallet
                            history {
                                balance
                                account {
                                    id
                                }
                            }
                        }
                    }
                }
            }`,
            {
                accounts: [{
                    id: '3',
                    history: [{
                        id: '3-1',
                        account: {
                            wallet: 'c',
                            history: [{
                                balance: 300,
                                account: {
                                    id: '3'
                                }
                            }]
                        }
                    }]
                }]
            }
        )
    })

    it('supports *_some filter', function () {
        return client.test(
            `query {
                accounts(where: {history_some: {balance_lt: 50}}) {
                    id
                }
            }`,
            {
                accounts: [{id: '1'}]
            }
        )
    })

    it('supports *_every filter', function () {
        return client.test(
            `query {
                accounts(where: {history_every: {balance_gt: 20}}) {
                    wallet
                }
            }`,
            {
                accounts: [{wallet: 'b'}, {wallet: 'c'}]
            }
        )
    })

    it('supports *_none filter', function () {
        return client.test(
            `query {
                accounts(where: {history_none: {balance_lt: 60}}) {
                    wallet
                }
            }`,
            {
                accounts: [{wallet: 'c'}]
            }
        )
    })

    it('supports gql aliases', function () {
        return client.test(
            `query {
                accounts(where: {id_eq: "1"}) {
                    balance
                    bag: wallet
                    purse: wallet
                    payment1: history(where: {id_eq: "1-1"}) {
                        balance
                    }
                    payment2: history(where: {id_eq: "1-2"}) {
                        balance
                    }
                }
            }`,
            {
                accounts: [{
                    balance: 100,
                    bag: 'a',
                    purse: 'a',
                    payment1: [{balance: 20}],
                    payment2: [{balance: 80}]
                }]
            }
        )
    })

    it('supports gql fragments', function () {
        return client.test(
            `query {
                accounts(where: {id_eq: "1"}) {
                    ...accountFields
                    history {
                        ...historicalBalance
                    }
                }
            }
            
            fragment accountFields on Account {
                id
                wallet
            }
            
            fragment historicalBalance on HistoricalBalance {
                balance
            }`,
            {
                accounts: [{
                    id: '1',
                    wallet: 'a',
                    history: [{balance: 20}, {balance: 80}]
                }]
            }
        )
    })

    it('supports gql fragments on interfaces', function () {
        return client.test(
            `query {
                accounts(where: {id_eq: "1"}) {
                    ...balance
                    history {
                        ...balance
                    }
                }
            }
            
            fragment balance on HasBalance {
                ... on Account {
                    accountBalance: balance
                }
                ... on HistoricalBalance {
                    payment: balance
                }
            }`,
            {
                accounts: [{
                    accountBalance: 100,
                    history: [{payment: 20}, {payment: 80}]
                }]
            }
        )
    })

    it('supports sorting', function () {
        return client.test(
            `query {
                historicalBalances(orderBy: balance_ASC) {
                    balance
                }
            }`,
            {
                historicalBalances: [
                    {balance: 20},
                    {balance: 50},
                    {balance: 60},
                    {balance: 80},
                    {balance: 90},
                    {balance: 300}
                ]
            }
        )
    })

    it('supports sorting by referenced entity field', function () {
        return client.test(
            `query {
                historicalBalances(orderBy: [account_wallet_ASC, balance_DESC]) {
                    balance
                }
            }`,
            {
                historicalBalances: [
                    {balance: 80},
                    {balance: 20},
                    {balance: 90},
                    {balance: 60},
                    {balance: 50},
                    {balance: 300}
                ]
            }
        )
    })

    it('supports descriptions', function () {
        return client.test(`
            query {
                HistoricalBalance: __type(name: "HistoricalBalance") {
                    description
                    fields {
                        description
                    }
                }
            }
        `, {
            HistoricalBalance: {
                description: 'Historical record of account balance',
                fields: [
                    {description: 'Unique identifier'},
                    {description: 'Related account'},
                    {description: 'Balance'},
                ]
            }
        })
    })
})
