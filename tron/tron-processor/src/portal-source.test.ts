import {HttpClient} from '@subsquid/http-client'
import {PortalClient} from '@subsquid/portal-client'
import {describe, expect, it} from 'vitest'
import {getFields} from './data/fields'
import {INT64, MILLIS} from './portal/data-schema'
import {getPortalFields, TronPortal, toPortalQuery} from './portal/source'

describe('toPortalQuery', () => {
    it('sends item requests flat and keeps the range', () => {
        let q = toPortalQuery({
            range: {from: 10, to: 20},
            request: {
                fields: getFields({}),
                includeAllBlocks: true,
                logs: [{where: {address: ['aa'], topic0: ['bb']}, include: {transaction: true}}],
                triggerSmartContractTransactions: [
                    {where: {contract: ['41cc'], sighash: ['dd']}, include: {logs: true}},
                ],
                transactions: [],
            },
        })
        expect(q).toMatchObject({type: 'tron', fromBlock: 10, toBlock: 20, includeAllBlocks: true})
        expect(q.logs).toEqual([{address: ['aa'], topic0: ['bb'], transaction: true}])
        expect(q.triggerSmartContractTransactions).toEqual([{contract: ['41cc'], sighash: ['dd'], logs: true}])
        expect(q).not.toHaveProperty('transactions')
    })

    it('leaves the upper bound open for open ranges', () => {
        let q = toPortalQuery({range: {from: 5}, request: {fields: getFields({})}})
        expect(q.fromBlock).toBe(5)
        expect(q.toBlock).toBeUndefined()
    })
})

describe('getPortalFields', () => {
    it('always requests the fields the processor relies on', () => {
        let f = getPortalFields(getFields({block: {timestamp: true}, transaction: {hash: true}}))
        expect(f.block).toMatchObject({number: true, hash: true, parentHash: true, timestamp: true})
        expect(f.transaction).toMatchObject({transactionIndex: true, hash: true})
        expect(f.log).toMatchObject({transactionIndex: true, logIndex: true})
        expect(f.internalTransaction).toMatchObject({transactionIndex: true, internalTransactionIndex: true})
    })
})

describe('portal value formats', () => {
    it('INT64 accepts decimal strings, negative values and JSON integers', () => {
        expect(INT64.cast('123')).toBe(123n)
        expect(INT64.cast('-18395898')).toBe(-18395898n)
        expect(INT64.cast(1794673833000)).toBe(1794673833000n)
        expect(INT64.cast('1.5')).toBeInstanceOf(Object)
        expect(INT64.validate(1.5)).toBeDefined()
        expect(INT64.validate('0x10')).toBeDefined()
    })

    it('MILLIS accepts any integer, beyond 2^53 too', () => {
        expect(MILLIS.cast(1794673833000)).toBe(1794673833000)
        expect(MILLIS.cast('1529892550266')).toBe(1529892550266)
        expect(MILLIS.validate(2 ** 60)).toBeUndefined()
        expect(MILLIS.validate('abc')).toBeDefined()
    })
})


function failingPortal() {
    let http = new HttpClient()
    let streams = 0
    ;(http as any).request = (method: string) => {
        let headers = new Headers({'x-sqd-finalized-head-number': '100', 'x-sqd-head-number': '100'})
        if (method == 'GET') return Promise.resolve({status: 200, headers, body: {number: 100, hash: '00'}})
        streams += 1
        // every stream response fails before delivering a block
        let body = (async function* () {
            throw Object.assign(new Error('socket hang up'), {code: 'ECONNRESET'})
        })()
        return Promise.resolve({status: 200, headers, body})
    }
    return {client: new PortalClient({url: 'http://localhost/datasets/test', http}), streams: () => streams}
}

describe('TronPortal', () => {
    it('surfaces a failed stream with retries disabled instead of reopening it', async () => {
        let portal = failingPortal()
        let src = new TronPortal({client: portal.client, retryAttempts: 0, headPollInterval: 1})
        let run = async () => {
            for await (let _ of src.getFinalizedBlocks([{range: {from: 3}, request: {fields: getFields({})}}], true)) {
            }
        }
        await expect(run()).rejects.toMatchObject({code: 'ECONNRESET'})
        expect(portal.streams()).toBe(1)
    })

    it('looks a block hash up once the portal serves the block', async () => {
        let heads = [5, 6, 7]
        let streams = 0
        let client = {
            async getFinalizedHead() {
                return {number: heads.shift() ?? 7, hash: '00'}
            },
            getFinalizedStream(query: any) {
                streams += 1
                return (async function* () {
                    yield {blocks: [{header: {number: query.fromBlock, hash: 'h7'}}], meta: {bytes: 0}}
                })()
            },
        }
        let src = new TronPortal({client: client as any, headPollInterval: 1})
        expect(await src.getBlockHash(7)).toBe('h7')
        expect(heads).toEqual([])
        expect(streams).toBe(1)
    })

    it('retries a block hash lookup the portal answers without blocks', async () => {
        let responses = 0
        let client = {
            async getFinalizedHead() {
                return {number: 10, hash: '00'}
            },
            getFinalizedStream(query: any) {
                let n = (responses += 1)
                return (async function* () {
                    // a transient empty response first, then the block
                    while (true) {
                        yield n == 1
                            ? {blocks: [], meta: {finalizedHeadNumber: 10, bytes: 0}}
                            : {blocks: [{header: {number: query.fromBlock, hash: 'h7'}}], meta: {bytes: 0}}
                    }
                })()
            },
        }
        let src = new TronPortal({client: client as any, headPollInterval: 1})
        expect(await src.getBlockHash(7)).toBe('h7')
        expect(responses).toBe(2)
    })

    it('leaves a stream that answers without blocks and backs off', async () => {
        let heads = [10, 10, 2]
        let opened = 0
        let consumed = 0
        let client = {
            async getFinalizedHead() {
                return {number: heads.shift()!, hash: '00'}
            },
            getFinalizedStream() {
                opened += 1
                // the portal claims blocks ahead, but every response is empty
                return (async function* () {
                    while (true) {
                        consumed += 1
                        yield {blocks: [], meta: {finalizedHeadNumber: 10, bytes: 0}}
                    }
                })()
            },
        }
        let src = new TronPortal({client: client as any, headPollInterval: 1})
        for await (let _ of src.getFinalizedBlocks([{range: {from: 3}, request: {fields: getFields({})}}], true)) {
        }
        // head 10 >= 3: stream, left on its first empty batch, back off; again; then head 2 < 3: stop
        expect(opened).toBe(2)
        expect(consumed).toBe(2)
    })

    it('passes the retry budget, zero included, with every request and stops at the head', async () => {
        let seen: any[] = []
        let heads = [5, 5, 2]
        let client = {
            async getFinalizedHead(options: any) {
                seen.push(options)
                return {number: heads.shift()!, hash: '00'}
            },
            getFinalizedStream(_query: any, options: any) {
                seen.push(options.request)
                return (async function* () {})()
            },
        }
        let src = new TronPortal({
            client: client as any,
            headers: {'x-squid-id': 'test'},
            retryAttempts: 0,
            headPollInterval: 1,
        })
        expect(await src.getFinalizedHeight()).toBe(5)
        // head 5 >= 3: stream, which ends without data; then head 2 < 3: stop
        for await (let _ of src.getFinalizedBlocks([{range: {from: 3}, request: {fields: getFields({})}}], true)) {
        }
        let opts = {headers: {'x-squid-id': 'test'}, retryAttempts: 0}
        expect(seen).toEqual([opts, opts, opts, opts])
    })
})
