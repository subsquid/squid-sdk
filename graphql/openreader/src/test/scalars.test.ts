import {useDatabase, useServer} from "./setup"

describe('scalars', function() {
    useDatabase([
        `create table scalar (id text primary key, "boolean" bool, "bigint" numeric, "bigdecimal" numeric, "string" text, enum text, date_time timestamptz, "bytes" bytea, "json" jsonb, deep jsonb)`,
        `insert into scalar (id, "boolean") values ('1', true)`,
        `insert into scalar (id, "boolean", deep) values ('2', false, '{"boolean": true}'::jsonb)`,
        `insert into scalar (id, "bigint", deep) values ('3', 1000000000000000000000000000000000000, '{"bigint": "1000000000000000000000000000000000000"}'::jsonb)`,
        `insert into scalar (id, "bigint", deep) values ('4', 2000000000000000000000000000000000000, '{"bigint": "2000000000000000000000000000000000000"}'::jsonb)`,
        `insert into scalar (id, "bigint", deep) values ('5', 5, '{"bigint": "5"}'::jsonb)`,
        `insert into scalar (id, "string") values ('6', 'foo bar baz')`,
        `insert into scalar (id, "string") values ('7', 'bar baz foo')`,
        `insert into scalar (id, "string") values ('8', 'baz foo bar')`,
        `insert into scalar (id, "string") values ('9', 'hello')`,
        `insert into scalar (id, "string") values ('9-1', 'A fOo B')`,
        `insert into scalar (id, "date_time", deep) values ('10', '2021-09-24T15:43:13.400Z', '{"dateTime": "2021-09-24T00:00:00.120Z"}'::jsonb)`,
        `insert into scalar (id, "date_time", deep) values ('11', '2021-09-24T00:00:00.000Z', '{"dateTime": "2021-09-24T00:00:00Z"}'::jsonb)`,
        `insert into scalar (id, "date_time", deep) values ('12', '2021-09-24 02:00:00.001 +01:00', '{"dateTime": "2021-09-24T00:00:00.1Z"}'::jsonb)`,
        `insert into scalar (id, "bytes", deep) values ('13', decode('aa', 'hex'), '{"bytes": "0xaa"}'::jsonb)`,
        `insert into scalar (id, "bytes", deep) values ('14', decode('bb', 'hex'), '{"bytes": "0xCCDD"}'::jsonb)`,
        `insert into scalar (id, "enum") values ('15', 'A')`,
        `insert into scalar (id, "enum") values ('16', 'B')`,
        `insert into scalar (id, "enum") values ('17', 'C')`,
        `insert into scalar (id, "json") values ('18', '{"key1": "value1"}'::jsonb)`,
        `insert into scalar (id, "json") values ('19', '{"key2": "value2"}'::jsonb)`,
        `insert into scalar (id, "bigdecimal", deep) values ('20', 1.00000000000000000000000000000000002, '{"bigdecimal": "100.00000000000000000000000000000000002"}'::jsonb)`,
        `insert into scalar (id, "bigdecimal", deep) values ('21', 1.00000000000000000000000000000000001, '{"bigdecimal": "12.00000000000000000000000000000000001"}'::jsonb)`,
        `insert into scalar (id, "bigdecimal", deep) values ('22', 5, '{"bigdecimal": "5"}'::jsonb)`,
    ])

    const client = useServer(`
        type Scalar @entity {
            id: ID!
            boolean: Boolean
            string: String
            enum: Enum
            bigint: BigInt
            bigdecimal: BigDecimal
            dateTime: DateTime
            bytes: Bytes
            json: JSON,
            deep: DeepScalar
        }
        
        type DeepScalar {
            bigint: BigInt
            bigdecimal: BigDecimal
            dateTime: DateTime
            bytes: Bytes
            boolean: Boolean
        }
        
        enum Enum {
            A B C
        }
    `)

    describe('Boolean', function () {
        it('outputs correctly', function () {
            return client.test(`
                query {
                    scalars(where: {id_in: ["1", "2"]} orderBy: id_ASC) {
                        id
                        boolean
                    }
                }
            `, {
                scalars: [
                    {id: '1', boolean: true},
                    {id: '2', boolean: false}
                ]
            })
        })

        it('output from nested object', function () {
            return client.test(`
                query {
                    scalars(where: {id_eq: "2"}) {
                       deep {
                            boolean
                       } 
                    }
                }
            `, {
                scalars: [
                    {deep: {boolean: true}}
                ]
            })
        })

        it('supports where conditions', function () {
            return client.test(`
                query {
                    t: scalars(where: {boolean_eq: true}) { id }
                    f: scalars(where: {boolean_eq: false}) { id }
                    nt: scalars(where: {boolean_not_eq: true}) { id }
                    nf: scalars(where: {boolean_not_eq: false}) { id }
                }
            `, {
                t: [{id: '1'}],
                f: [{id: '2'}],
                nt: [{id: '2'}],
                nf: [{id: '1'}]
            })
        })
    })

    describe('String', function () {
        it('supports where conditions', function () {
            return client.test(`
                query {
                    starts_with: scalars(where: {string_startsWith: "foo"} orderBy: id_ASC) { id }
                    not_starts_with: scalars(where: {string_not_startsWith: "foo"} orderBy: id_ASC) { id }
                    ends_with: scalars(where: {string_endsWith: "foo"} orderBy: id_ASC) { id }
                    not_ends_with: scalars(where: {string_not_endsWith: "foo"} orderBy: id_ASC) { id }
                    contains: scalars(where: {string_contains: "foo"} orderBy: id_ASC) { id }
                    not_contains: scalars(where: {string_not_contains: "foo"} orderBy: id_ASC) { id }
                    contains_insensitive: scalars(where: {string_containsInsensitive: "FoO"} orderBy: id_ASC) { id }
                    not_contains_insensitive: scalars(where: {string_not_containsInsensitive: "FoO"} orderBy: id_ASC) { id }
                }
            `, {
                starts_with: [{id: '6'}],
                not_starts_with: [{id: '7'}, {id: '8'}, {id: '9'}, {id: '9-1'}],
                ends_with: [{id: '7'}],
                not_ends_with: [{id: '6'}, {id: '8'}, {id: '9'}, {id: '9-1'}],
                contains: [{id: '6'}, {id: '7'}, {id: '8'}],
                not_contains: [{id: '9'}, {id: '9-1'}],
                contains_insensitive: [{id: '6'}, {id: '7'}, {id: '8'}, {id: '9-1'}],
                not_contains_insensitive: [{id: '9'}]
            })
        })
    })

    describe('Enum', function () {
        it('outputs correctly', function () {
            return client.test(`
                query {
                    scalars(where: {id_in: ["15", "16", "17"]} orderBy: id_ASC) {
                        id
                        enum
                    }
                }
            `, {
                scalars: [
                    {id: '15', enum: 'A'},
                    {id: '16', enum: 'B'},
                    {id: '17', enum: 'C'},
                ]
            })
        })

        it('supports where conditions', function () {
            return client.test(`
                query {
                    eq: scalars(where: {enum_eq: A} orderBy: id_ASC) { id }
                    not_eq: scalars(where: {enum_not_eq: A} orderBy: id_ASC) { id }
                    in: scalars(where: {enum_in: [A, B]} orderBy: id_ASC) { id }
                    not_in: scalars(where: {enum_not_in: B} orderBy: id_ASC) { id }
                }
            `, {
                eq: [{id: '15'}],
                not_eq: [{id: '16'}, {id: '17'}],
                in: [{id: '15'}, {id: '16'}],
                not_in: [{id: '15'}, {id: '17'}],
            })
        })
    })

    describe('BigInt', function () {
        it('outputs correctly', function () {
            return client.test(`
                query {
                    scalars(where: {id_in: ["3", "4", "5"]} orderBy: id_ASC) {
                        id
                        bigint
                        deep { bigint }
                    }
                }
            `, {
                scalars: [
                    {
                        id: '3',
                        bigint: '1000000000000000000000000000000000000',
                        deep: {bigint: '1000000000000000000000000000000000000'}
                    },
                    {
                        id: '4',
                        bigint: '2000000000000000000000000000000000000',
                        deep: {bigint: '2000000000000000000000000000000000000'}
                    },
                    {
                        id: '5',
                        bigint: '5',
                        deep: {bigint: '5'}
                    }
                ]
            })
        })

        it('supports where conditions', function () {
            return client.test(`
                query {
                    eq: scalars(where: {bigint_eq: 2000000000000000000000000000000000000} orderBy: id_ASC) { id }
                    not_eq: scalars(where: {bigint_not_eq: 2000000000000000000000000000000000000} orderBy: id_ASC) { id }
                    gt: scalars(where: {bigint_gt: 1000000000000000000000000000000000000} orderBy: id_ASC) { id }
                    gte: scalars(where: {bigint_gte: 1000000000000000000000000000000000000} orderBy: id_ASC) { id }
                    lt: scalars(where: {bigint_lt: 1000000000000000000000000000000000000} orderBy: id_ASC) { id }
                    lte: scalars(where: {bigint_lte: 1000000000000000000000000000000000000} orderBy: id_ASC) { id }
                    in: scalars(where: {bigint_in: [1000000000000000000000000000000000000, 5]} orderBy: id_ASC) { id }
                    not_in: scalars(where: {bigint_not_in: [1000000000000000000000000000000000000, 5]} orderBy: id_ASC) { id }
                }
            `, {
                eq: [{id: '4'}],
                not_eq: [{id: '3'}, {id: '5'}],
                gt: [{id: '4'}],
                gte: [{id: '3'}, {id: '4'}],
                lt: [{id: '5'}],
                lte: [{id: '3'}, {id: '5'}],
                in: [{id: '3'}, {id: '5'}],
                not_in: [{id: '4'}]
            })
        })

        it('json sort', function () {
            return client.test(`
                query {
                    scalars(orderBy: deep_bigint_ASC where: {id_in: ["3", "4", "5"]}) {
                        id
                    }
                }
            `, {
                scalars: [
                    {id: '5'},
                    {id: '3'},
                    {id: '4'}
                ]
            })
        })
    })

    describe('BigDecimal', function () {
        it('outputs correctly', function () {
            return client.test(`
                query {
                    scalars(where: {id_in: ["20", "21", "22"]} orderBy: id_ASC) {
                        id
                        bigdecimal
                        deep { bigdecimal }
                    }
                }
            `, {
                scalars: [
                    {
                        id: '20',
                        bigdecimal: '1.00000000000000000000000000000000002',
                        deep: {bigdecimal: '100.00000000000000000000000000000000002'}
                    },
                    {
                        id: '21',
                        bigdecimal: '1.00000000000000000000000000000000001',
                        deep: {bigdecimal: '12.00000000000000000000000000000000001'}
                    },
                    {
                        id: '22',
                        bigdecimal: '5',
                        deep: {bigdecimal: '5'}
                    }
                ]
            })
        })

        it('supports where conditions', function () {
            return client.test(`
                query {
                    eq: scalars(where: {bigdecimal_eq: 1.00000000000000000000000000000000002} orderBy: id_ASC) { id }
                    not_eq: scalars(where: {bigdecimal_not_eq: 1.00000000000000000000000000000000002} orderBy: id_ASC) { id }
                    gt: scalars(where: {bigdecimal_gt: 1.00000000000000000000000000000000001} orderBy: id_ASC) { id }
                    gte: scalars(where: {bigdecimal_gte: 1.00000000000000000000000000000000002} orderBy: id_ASC) { id }
                    lt: scalars(where: {bigdecimal_lt: 1.00000000000000000000000000000000002} orderBy: id_ASC) { id }
                    lte: scalars(where: {bigdecimal_lte: 1.00000000000000000000000000000000002} orderBy: id_ASC) { id }
                    in: scalars(where: {bigdecimal_in: [1.00000000000000000000000000000000001, 5.0]} orderBy: id_ASC) { id }
                    not_in: scalars(where: {bigdecimal_not_in: [1.00000000000000000000000000000000001, 5.0]} orderBy: id_ASC) { id }
                }
            `, {
                eq: [{id: '20'}],
                not_eq: [{id: '21'}, {id: '22'}],
                gt: [{id: '20'}, {id: '22'}],
                gte: [{id: '20'}, {id: '22'}],
                lt: [{id: '21'}],
                lte: [{id: '20'}, {id: '21'}],
                in: [{id: '21'}, {id: '22'}],
                not_in: [{id: '20'}]
            })
        })

        it('json sort', function () {
            return client.test(`
                query {
                    scalars(orderBy: deep_bigdecimal_ASC where: {id_in: ["20", "21", "22"]}) {
                        id
                    }
                }
            `, {
                scalars: [
                    {id: '22'},
                    {id: '21'},
                    {id: '20'}
                ]
            })
        })
    })

    describe('DateTime', function () {
        it('outputs correctly', function () {
            return client.test(`
                query {
                    scalars(where: {id_in: ["10", "11", "12"]} orderBy: id_ASC) {
                        id
                        dateTime
                        deep { dateTime }
                    }
                }
            `, {
                scalars: [
                    {id: '10', dateTime: '2021-09-24T15:43:13.400000Z', deep: {dateTime: '2021-09-24T00:00:00.120Z'}},
                    {id: '11', dateTime: '2021-09-24T00:00:00.000000Z', deep: {dateTime: '2021-09-24T00:00:00Z'}},
                    {id: '12', dateTime: '2021-09-24T01:00:00.001000Z', deep: {dateTime: '2021-09-24T00:00:00.1Z'}}
                ]
            })
        })

        it('supports where conditions', function () {
            return client.test(`
                query {
                    gt: scalars(orderBy: id_ASC, where: {dateTime_gt: "2021-09-24T00:00:00Z"}) { id }
                    gte: scalars(orderBy: id_ASC, where: {dateTime_gte: "2021-09-24T00:00:00Z"}) { id }
                    lt: scalars(orderBy: id_ASC, where: {dateTime_lt: "2021-09-24T00:00:00Z"}) { id }
                    lte: scalars(orderBy: id_ASC, where: {dateTime_lte: "2021-09-24T00:00:00Z"}) { id }
                    in: scalars(orderBy: id_ASC, where: {dateTime_in: ["2021-09-24T00:00:00Z", "2021-09-24T15:43:13.400Z"]}) { id }
                    not_in: scalars(orderBy: id_ASC, where: {dateTime_not_in: ["2021-09-24T00:00:00Z", "2021-09-24T15:43:13.400Z"]}) { id }
                }
            `, {
                gt: [{id: '10'}, {id: '12'}],
                gte: [{id: '10'}, {id: '11'}, {id: '12'}],
                lt: [],
                lte: [{id: '11'}],
                in: [{id: '10'}, {'id': '11'}],
                not_in: [{'id': '12'}]
            })
        })

        it('json sort', function () {
            return client.test(`
                query {
                    scalars(orderBy: deep_dateTime_ASC where: {id_in: ["10", "11", "12"]}) {
                        id
                    }
                }
            `, {
                scalars: [
                    {id: '11'},
                    {id: '12'},
                    {id: '10'}
                ]
            })
        })
    })

    describe('Bytes', function () {
        it('outputs correctly', function () {
            return client.test(`
                query {
                    scalars(where: {id_in: ["13", "14"]} orderBy: id_ASC) {
                        id
                        bytes
                        deep { bytes }
                    }
                }
            `, {
                scalars: [
                    {id: '13', bytes: '0xaa', deep: {bytes: '0xaa'}},
                    {id: '14', bytes: '0xbb', deep: {bytes: '0xccdd'}},
                ]
            })
        })

        it('supports where conditions', function () {
            return client.test(`
                query {
                    eq: scalars(where: {bytes_eq: "0xaa"} orderBy: id_ASC) { id }
                    deep_eq: scalars(where: {deep: {bytes_eq: "0xccdd"}} orderBy: id_ASC) { id }
                }
            `, {
                eq: [{id: '13'}],
                deep_eq: [{id: '14'}]
            })
        })
    })

    describe('JSON', function () {
        it('outputs correctly', function() {
            return client.test(`
                query {
                    scalars(where: {id_in: ["18"]}, orderBy: id_ASC) {
                        id
                        json
                    }
                }
            `, {
                scalars: [
                    {id: '18', json: {'key1': 'value1'}},
                ]
            })
        })

        it('supports where conditions', function () {
            return client.test(`
                query {
                    eq: scalars(where: {json_eq: {key1: "value1"}}) { id }
                    jsonHasKey: scalars(where: {json_jsonHasKey: "key1"}) { id }
                    jsonContains: scalars(where: {json_jsonContains: {key2: "value2"}}) { id }
                    missingKey: scalars(where: {json_jsonHasKey: {foo: 1}}) { id }
                }
            `, {
                eq: [{id: '18'}],
                jsonHasKey: [{id: '18'}],
                jsonContains: [{id: '19'}],
                missingKey: []
            })
        })
    })
})
