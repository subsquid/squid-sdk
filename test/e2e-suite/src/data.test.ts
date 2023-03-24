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

    it('vectors', function() {
        return gql.test(`
            query {
                vectors(orderBy: id_ASC) {
                    id
                    bigint
                    bigdecimal
                }
            }
        `, {
            vectors: [
                {
                    id: '1',
                    bigdecimal: [
                        '4.35476437468968597076909079043524688974607909579637673567e+28',
                        '3.6457637724562456326534625623546346e-37'
                    ],
                    bigint: []
                },
                {
                    id: '2',
                    bigdecimal: [
                        '-3.141592653589793238462643383279502884197169399375105820974944592307816406286208998628034825342117067982148086513282306647093844609550582231725359408128481117450284102701938521105559644622948954930381964428810975665933446128475648233786783165271201909145648566923460348610454326648213393607260249141273724587006606315588174881520920962829254091715364367892590360011330530548820466521384146951941511609433057270365759591953092186117381932611793105118548074462379962749567351885752724891227938183011949129833673362440656643086021394946395224737190702179860943702770539217176293176752384674818467669405132000568127145263560827785771342757789609173'
                    ],
                    bigint: [
                        '-44363467586496785273658476984936472457475262346'
                    ]
                },
                {
                    id: '3',
                    bigdecimal: [],
                    bigint: [
                        '44363467586496785273658476984936472457475262346',
                        '86272327917860857843838279679766814541009538837863609506800642251252051173929848960841284886269456042419652850222106611863067442'
                    ]
                },
            ]
        })
    })
})
