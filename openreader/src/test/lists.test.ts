import {useDatabase, useServer} from "./setup"


describe('lists', function () {
    useDatabase([
        `create table lists (
            id text primary key, 
            int_array integer[], 
            bigint_array numeric[],
            bigdecimal_array numeric[], 
            enum_array text[],
            datetime_array timestamptz[],
            bytes_array bytea[],
            list_of_list_of_int jsonb, 
            list_of_json_objects jsonb
        )`,
        `insert into lists (id, int_array) values ('1', '{1, 2, 3}')`,
        `insert into lists (id, int_array) values ('2', '{4, 5, 6}')`,
        `insert into lists (id, int_array) values ('20', '{7, 8}')`,
        `insert into lists (id, bigint_array) values ('3', '{1000000000000000000000000001, 2000000000000000000000000000}')`,
        `insert into lists (id, bigint_array) values ('4', '{3000000000000000000000000000, 4000000000000000000000000000}')`,
        `insert into lists (id, list_of_list_of_int) values ('5', '[[1, 2], [3, 4], [5]]'::jsonb)`,
        `insert into lists (id, list_of_json_objects) values ('6', '[{"foo": 1, "bar": 2}, {"foo": 3, "bar": 4}]'::jsonb)`,
        `insert into lists (id, datetime_array) values ('7', array['2020-01-01T00:00:00Z', '2021-01-01T00:00:00Z']::timestamptz[])`,
        `insert into lists (id, datetime_array) values ('70', array['2020-01-01T00:00:00Z', '2022-01-01T00:00:00Z']::timestamptz[])`,
        `insert into lists (id, bytes_array) values ('8', array['hello', 'world']::bytea[])`,
        `insert into lists (id, bytes_array) values ('9', array['hello', 'big', 'world']::bytea[])`,
        `insert into lists (id, enum_array) values ('10', array['A', 'B', 'C'])`,
        `insert into lists (id, enum_array) values ('11', array['C',  'D'])`,
        `insert into lists (id, enum_array) values ('12', array['A',  'D'])`,
        `insert into lists (id, bigdecimal_array) values ('13', '{100000000000000000000000000000.1, 2000000000000000000000000000000.3}')`,
        `insert into lists (id, bigdecimal_array) values ('14', '{3.000000000000000000000000000002, 40000000000000000000000000004}')`,
    ])

    const client = useServer(`    
        type Lists @entity {
            intArray: [Int!]
            enumArray: [Enum!]
            bigintArray: [BigInt!]
            bigdecimalArray: [BigDecimal!]
            datetimeArray: [DateTime!]
            bytesArray: [Bytes!]
            listOfListOfInt: [[Int]]
            listOfJsonObjects: [Foo!]
        }
        
        enum Enum {
            A B C D E F
        }
        
        type Foo {
            foo: Int
            bar: Int
        }
    `)

    describe('integer arrays', function () {
        it('outputs correctly', function () {
            return client.test(`
                query {
                    lists(where: {id_in: ["1", "2"]} orderBy: id_ASC) {
                        intArray
                    }
                }
            `, {
                lists: [
                    {intArray: [1, 2, 3]},
                    {intArray: [4, 5, 6]}
                ]
            })
        })

        it('support where conditions', function () {
            return client.test(`
                query {
                    all: lists(where: {intArray_containsAll: [1, 3]} orderBy: id_ASC) {
                        id
                    }
                    any: lists(where: {intArray_containsAny: [4, 7]} orderBy: id_ASC) {
                        id
                    }
                    none: lists(where: {intArray_containsNone: 5} orderBy: id_ASC) {
                        id
                    }
                    nothing: lists(where: {intArray_containsNone: [1, 4, 7]} orderBy: id_ASC) {
                        id
                    }
                }
            `, {
                all: [{id: '1'}],
                any: [{id: '2'}, {id: '20'}],
                none: [{id: '1'}, {id: '20'}],
                nothing: []
            })
        })
    })

    describe('enum arrays', function () {
        it('outputs correctly', function () {
            return client.test(`
                query {
                    lists(where: {id_in: ["10", "11", "12"]} orderBy: id_ASC) {
                        id
                        enumArray
                    }
                }
            `, {
                lists: [
                    {id: '10', enumArray: ['A', 'B', 'C']},
                    {id: '11', enumArray: ['C', 'D']},
                    {id: '12', enumArray: ['A', 'D']}
                ]
            })
        })

        it('supports where conditions', function () {
            return client.test(`
                query {
                    all : lists(where: {enumArray_containsAll: [A, B]} orderBy: id_ASC) { id }
                    any : lists(where: {enumArray_containsAny: D} orderBy: id_ASC) { id }
                    none: lists(where: {enumArray_containsNone: A} orderBy: id_ASC) { id }
                }
            `, {
                all: [{id: '10'}],
                any: [{id: '11'}, {id: '12'}],
                none: [{id: '11'}],
            })
        })
    })

    describe('big integer arrays', function () {
        it('outputs correctly', function () {
            return client.test(`
                query {
                    lists(where: {id_in: ["3", "4"]} orderBy: id_ASC) {
                        bigintArray
                    }
                }
            `, {
                lists: [
                    {bigintArray: ['1000000000000000000000000001', '2000000000000000000000000000']},
                    {bigintArray: ['3000000000000000000000000000', '4000000000000000000000000000']}
                ]
            })
        })

        it('supports where conditions', function () {
            return client.test(`
                query {
                    all: lists(where: {bigintArray_containsAll: 1000000000000000000000000001} orderBy: id_ASC) {
                        id
                    }
                    any: lists(where: {bigintArray_containsAny: [3000000000000000000000000000, 2000000000000000000000000000]} orderBy: id_ASC) {
                        id
                    }
                    none: lists(where: {bigintArray_containsNone: "2000000000000000000000000000"} orderBy: id_ASC) {
                        id
                    }
                }
            `, {
                all: [{id: '3'}],
                any: [{id: '3'}, {id: '4'}],
                none: [{id: '4'}]
            })
        })
    })

    describe('big decimal arrays', function() {
        it('outputs correctly', function() {
            return client.test(`
                query {
                    lists(where: {id_in: ["13", "14"]} orderBy: id_ASC) {
                        bigdecimalArray
                    }
                }
            `, {
                lists: [
                    {bigdecimalArray: ['1.000000000000000000000000000001e+29', '2.0000000000000000000000000000003e+30']},
                    {bigdecimalArray: ['3.000000000000000000000000000002', '4.0000000000000000000000000004e+28']}
                ]
            })
        })
    })

    describe('date-time arrays', function () {
        it('outputs correctly', function () {
            return client.test(`
                query {
                    lists(where: {id_eq: "7"}) {
                        datetimeArray
                    }
                }
            `, {
                lists: [{
                    datetimeArray: [
                        '2020-01-01T00:00:00.000000Z',
                        '2021-01-01T00:00:00.000000Z'
                    ]
                }]
            })
        })

        it('supports where conditions', function () {
            return client.test(`
                query {
                    all: lists(where: {datetimeArray_containsAll: ["2020-01-01T00:00:00Z", "2022-01-01T00:00:00Z"]} orderBy: id_ASC) {
                        id
                    }
                    any: lists(where: {datetimeArray_containsAny: ["2020-01-01T00:00:00Z", "2022-01-01T00:00:00Z"]} orderBy: id_ASC) {
                        id
                    }
                    none: lists(where: {datetimeArray_containsNone: ["2024-01-01T00:00:00Z", "2022-01-01T00:00:00Z"]} orderBy: id_ASC) {
                        id
                    }
                }
            `, {
                all: [{id: '70'}],
                any: [{id: '7'}, {id: '70'}],
                none: [{id: '7'}]
            })
        })
    })

    describe('bytes array', function () {
        it('outputs correctly', function () {
            return client.test(`
                query {
                    lists(where: {id_eq: "8"}) {
                        bytesArray
                    }
                }
            `, {
                lists: [{
                    bytesArray: [
                        '0x68656c6c6f',
                        '0x776f726c64'
                    ]
                }]
            })
        })

        it('supports where conditions', function () {
            return client.test(`
                query {
                    all: lists(where: {bytesArray_containsAll: ["0x68656c6c6f", "0x626967"]} orderBy: id_ASC) {
                        id
                    }
                    any: lists(where: {bytesArray_containsAny: "0x776f726c64"} orderBy: id_ASC) {
                        id
                    }
                    none: lists(where: {bytesArray_containsNone: ["0x626967", "0xaa"]} orderBy: id_ASC) {
                        id
                    }
                }
            `, {
                all: [{id: '9'}],
                any: [{id: '8'}, {id: '9'}],
                none: [{id: '8'}],
            })
        })
    })

    describe('json lists', function () {
        it('outputs list of list of integers', function () {
            return client.test(`
                query {
                    lists(where: {id_eq: "5"}) {
                        listOfListOfInt
                    }
                }
            `, {
                lists: [
                    {listOfListOfInt: [[1, 2], [3, 4], [5]]}
                ]
            })
        })

        it('outputs list of json objects', function () {
            return client.test(`
                query {
                    lists(where: {id_eq: "6"}) {
                        listOfJsonObjects {
                            foo
                        }
                    }
                }
            `, {
                lists: [
                    {
                        listOfJsonObjects: [
                            {foo: 1},
                            {foo: 3}
                        ]
                    }
                ]
            })
        })
    })
})
