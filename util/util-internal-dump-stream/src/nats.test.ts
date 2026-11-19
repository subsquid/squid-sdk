import {describe, expect, it} from 'vitest'
import {connectNatsStream, getBlockSubject, getStreamName, isDatasetName, parseServers} from './nats'

// Needs a NATS server, e.g. `docker run -p 4222:4222 nats:2-alpine -js`
const url = process.env.TEST_NATS_URL

describe('stream names', () => {
    it('puts the dataset into the stream name and into subjects as it is', () => {
        expect(getStreamName('ethereum-mainnet')).toBe('raw-ethereum-mainnet')

        let subject = getBlockSubject('ethereum-mainnet', {number: 17, hash: '0xabc'})
        expect(subject).toBe('raw.ethereum-mainnet.17.0xabc')
    })

    it('takes a dataset name that is a single subject token', () => {
        expect(isDatasetName('ethereum-mainnet')).toBe(true)
        expect(isDatasetName('base_sepolia2')).toBe(true)

        for (let name of ['', 'ethereum.mainnet', 'eth*', 'eth>', 'eth mainnet', 'eth/mainnet', 'eth\n']) {
            expect(isDatasetName(name)).toBe(false)
        }
    })
})

describe('parseServers', () => {
    it('takes a single server', () => {
        expect(parseServers('nats://a:4222')).toEqual({hosts: ['a:4222'], tls: false, user: '', pass: ''})
    })

    it('takes a list of servers with their scheme and credentials', () => {
        let servers = parseServers('tls://u:p%40ss@a:4222, tls://u:p%40ss@b:4222,tls://u:p%40ss@c')

        expect(servers).toEqual({hosts: ['a:4222', 'b:4222', 'c'], tls: true, user: 'u', pass: 'p@ss'})
    })

    it.each([
        ['', 'server 1 is not a valid URL'],
        ['nats://a:4222,', 'server 2 is not a valid URL'],
        ['nats://a:4222,http://b:4222', 'server 2 must be a nats:// or tls:// URL'],
        ['nats:a', 'server 1 has no host'],
        ['nats://a:4222,tls://b:4222', 'server 2 must have the scheme and the credentials of the first one'],
        ['nats://u:p@a:4222,nats://b:4222', 'server 2 must have the scheme and the credentials of the first one'],
    ])('rejects "%s"', (value, message) => {
        expect(() => parseServers(value)).toThrow(message)
    })
})

describe.skipIf(!url)('connectNatsStream', () => {
    const host = url == null ? '' : new URL(url).host

    it('connects to the server of a list that answers', async () => {
        let connection = await connectNatsStream({
            url: `nats://127.0.0.1:1,nats://127.0.0.1:2,nats://${host}`,
            dataset: 'test',
            name: 'dump-stream-test',
            connectTimeout: 1000,
        })

        expect(connection.isClosed()).toBe(false)
        await connection.close()
    })

    it('fails when no server of a list answers', async () => {
        let connect = connectNatsStream({
            url: 'nats://127.0.0.1:1,nats://127.0.0.1:2',
            dataset: 'test',
            name: 'dump-stream-test',
            connectTimeout: 1000,
        })

        await expect(connect).rejects.toThrow()
    })
})
