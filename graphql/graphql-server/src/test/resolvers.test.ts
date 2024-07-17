import path from 'node:path';
import {useDatabase} from "./util/db"
import {useServer} from "./util/server"
import { Child, Parent, Scalar } from './resolvers-extension/lib/model';
import { BigDecimal } from '@subsquid/big-decimal';

describe('resolvers extension', function () {
    useDatabase(path.join(__dirname, 'resolvers-extension'), [
        async ({ manager }) => {
            const parent = new Parent({id: '1', name: 'hello'})

            await manager.save(parent)
            await manager.save(new Child({id: '1', name: 'world', parent }))
            await manager.save(new Scalar({
                id: '1',
                bool: true,
                date: new Date('2021-09-24T00:00:00.000Z'),
                bigInt: 1000000000000000n,
                bigDecimal: BigDecimal('0.000000000000000001'),
                bytes: Buffer.from('aa', 'hex'),
            }))
        },
    ])

    const client = useServer('lib/test/resolvers-extension')

    it('scalars', function () {
        return client.test(`
            query {
                scalarsExtension {
                    id
                    bool
                    date
                    bigInt
                    bigDecimal
                    bytes
                    attributes
                }
            }
        `, {
            scalarsExtension: [{
                id: '1',
                bool: true,
                date: '2021-09-24T00:00:00.000Z',
                bigInt: '1000000000000000',
                bigDecimal: '0.000000000000000001',
                bytes: '0xaa',
                attributes: [1]
            }]
        })
    })

    it('openreader scalars continue to work', function () {
        return client.test(`
            query {
                scalars {
                    id
                    bool
                    date
                    bigInt
                    bigDecimal
                    bytes
                }
            }
        `, {
            scalars: [{
                id: '1',
                bool: true,
                date: '2021-09-24T00:00:00.000000Z',
                bigInt: '1000000000000000',
                bigDecimal: '0.000000000000000001',
                bytes: '0xaa'
            }]
        })
    })

    it('not enough columns in result regression', function() {
        return client.test(`
            query {
                children {
                    name
                    parent {
                        name
                    }
                }
            }
        `, {
            children: [
                {
                    parent: {
                        name: 'hello'
                    },
                    name: 'world'
                }
            ]
        })
    })

    it('ping-pong', function() {
        return client.test(`
            query {
                ping(msg: {message: "hello"}) {
                    message
                }
            }
        `, {
            ping: {
                message: 'hello'
            }
        })
    })
})
