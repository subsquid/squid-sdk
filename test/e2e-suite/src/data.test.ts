import {gql, waitForHeight} from "./setup"


describe('data', function () {
    before(() => waitForHeight(3))

    it('one-to-one lookups', function () {
        return gql.test(`
            query {
                issues(orderBy: id_ASC) {
                    id
                    payment {
                        amount
                    }
                    cancellation {
                        block
                    }
                }
            }
        `, {
            issues: [
                {
                    id: '1',
                    payment: {
                        amount: 10,
                    },
                    cancellation: null,
                },
                {
                    id: '2',
                    payment: null,
                    cancellation: {
                        block: 100,
                    },
                },
            ],
        })
    })

    it('typed json objects', function () {
        return gql.test(`
            query {
                systemEvents {
                    params {
                        name
                        type
                        value
                        additionalData {
                            data
                        }
                    }
                }
            }
        `, {
            systemEvents: [
                {
                    params: {
                        name: 'account',
                        type: 'string',
                        value: '0x000',
                        additionalData: [
                            {data: '0xaabb'}
                        ]
                    }
                }
            ]
        })
    })

    it('typed json list', function () {
        return gql.test(`
            query {
                eventBs {
                    statusList {
                        ... on HappyPoor {
                            isMale
                        }
                    }    
                }
            }
        `, {
            eventBs: [
                {statusList: [{isMale: true}]}
            ]
        })
    })

    it('array_containsAny', function () {
        return gql.test(`
            query {
                systemEvents(where: { arrayField_containsAny: ["aaa"] }) {
                    id
                }
            }
        `, {
            systemEvents: [
                {id: 'se-1'}
            ]
        })
    })

    it('connection.totalCount query with where condition on relation', function () {
        return gql.test(`
            query {
                connection: blockHooksConnection(
                    orderBy: blockNumber_ASC
                    where: { timestamp: { timestamp_gt: "0" } }
                ) {
                    totalCount
                }
            }
        `, {
            connection: {
                totalCount: 2
            }
        })
    })

    it('scalars', function() {
        return gql.test(`
            query {
                scalarRaws(orderBy: id_ASC) {
                    float
                    bigdecimal
                    nested {
                        float
                        bigdecimal
                        json
                        enumInJson
                    }
                    json
                }
            }
        `, {
            scalarRaws: [
                {
                    float: 0,
                    bigdecimal: '1.23',
                    nested: {float: 0, bigdecimal: null, json: [1, 2, 3], enumInJson: 'A'},
                    json: {foo: 1}
                },
                {
                    float: 0.7,
                    bigdecimal: null,
                    nested: {float: 0.8, bigdecimal: '0.01', json: null, enumInJson: null},
                    json: null
                }
            ]
        })
    })
})
