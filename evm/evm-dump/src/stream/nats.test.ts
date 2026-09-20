import {describe, expect, it} from 'vitest'
import {getComponentsRule} from './components'
import {connectNatsStream, getBlockSubject, getStreamName, isDatasetName} from './nats'
import {linkOf, makeBlock, makeChain, makeHash, makeMessage, verifyTestLine} from './test-util'
import {walk} from './walk'

// Needs a NATS server with JetStream enabled, e.g. `docker run -p 4222:4222 nats:2-alpine -js`
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

describe.skipIf(!url)('NATS JetStream', () => {
    let dataset = `test-${Date.now()}`

    async function publish(chain: ReturnType<typeof makeChain>, target = dataset, allowDirect = true): Promise<void> {
        // `headers` is re-exported through a subpath the compiler does not resolve here
        let {connect, headers}: any = await import('@nats-io/transport-node')
        let {jetstream, jetstreamManager} = await import('@nats-io/jetstream')

        let nc = await connect({servers: new URL(url!).host})
        try {
            let jsm = await jetstreamManager(nc)
            await jsm.streams.add({
                name: getStreamName(target),
                subjects: [`raw.${target}.>`],
                allow_direct: allowDirect,
            })

            let js = jetstream(nc)
            for (let block of chain) {
                let msg = makeMessage(block)
                let h = headers()
                for (let name of [
                    'hash',
                    'parent_hash',
                    'parent_number',
                    'components',
                    'schema',
                    'feed',
                    'payload_crc32',
                ]) {
                    h.set(name, msg.headers.get(name)!)
                }
                await js.publish(getBlockSubject(target, linkOf(block)), msg.data, {headers: h})
            }
        } finally {
            await nc.close()
        }
    }

    it('walks blocks by direct get and reports an absent one', async () => {
        let chain = makeChain(100, 110)
        let orphan = makeBlock(105, 'fork', 'main')
        await publish([...chain.slice(3), orphan])

        let connection = await connectNatsStream({
            url: url!,
            dataset,
            connectTimeout: 5000,
            requestTimeout: 5000,
        })

        try {
            let res = await walk({
                get: connection.get,
                rule: getComponentsRule({}),
                verify: verifyTestLine,
                top: linkOf(chain[10]),
                from: 100,
                parsedBudget: 1_000_000,
                payloadBudget: 1_000_000,
            })

            expect(res.miss).toMatchObject({number: 102, reason: 'not_found'})
            expect(res.blocks.map((b) => b.getBlock())).toEqual(chain.slice(3))

            let absent = await connection.get({number: 105, hash: makeHash('nobody')})
            expect(absent).toBeUndefined()
        } finally {
            await connection.close()
        }

        expect(connection.isClosed()).toBe(true)
    })

    it('fails within the timeout when there is no such stream', async () => {
        let connection = await connectNatsStream({
            url: url!,
            dataset: 'absent-dataset',
            connectTimeout: 5000,
            requestTimeout: 1000,
        })

        try {
            let started = Date.now()
            await expect(connection.get({number: 1, hash: makeHash('x')})).rejects.toThrow()
            expect(Date.now() - started).toBeLessThan(3000)
        } finally {
            await connection.close()
        }
    })

    it('fails right away when the stream gives no direct access', async () => {
        let closed = `${dataset}-closed`
        await publish(makeChain(1, 2), closed, false)

        let connection = await connectNatsStream({
            url: url!,
            dataset: closed,
            connectTimeout: 5000,
            requestTimeout: 1000,
        })

        try {
            await expect(connection.get(linkOf(makeBlock(2)))).rejects.toThrow()
        } finally {
            await connection.close()
        }
    })

    it('takes no forged block published under real hashes', async () => {
        let forgedDataset = `${dataset}-forged`
        let chain = makeChain(200, 210)

        let forged = chain.map((block) => ({
            ...block,
            stateRoot: makeHash(`junk state of ${block.number}`),
            transactions: [{hash: makeHash(`junk tx of ${block.number}`)}],
        })) as unknown as typeof chain

        await publish(forged, forgedDataset)

        let connection = await connectNatsStream({
            url: url!,
            dataset: forgedDataset,
            connectTimeout: 5000,
            requestTimeout: 5000,
        })

        try {
            let res = await walk({
                get: connection.get,
                rule: getComponentsRule({}),
                verify: verifyTestLine,
                top: linkOf(chain[10]),
                from: 200,
                parsedBudget: 1_000_000,
                payloadBudget: 1_000_000,
            })

            expect(res.miss).toMatchObject({number: 210, reason: 'hash'})
            expect(res.blocks).toEqual([])
        } finally {
            await connection.close()
        }
    })
})
