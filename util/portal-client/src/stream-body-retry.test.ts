import {HttpClient} from '@subsquid/http-client'
import {describe, expect, it} from 'vitest'
import {PortalClient} from './client'

function connReset(): Error {
    return Object.assign(new Error('socket hang up'), {code: 'ECONNRESET'})
}

/**
 * Each request gets a 200 whose body yields `lines(fromBlock)` and then fails with ECONNRESET.
 */
function mockPortal(lines: (fromBlock: number) => string[], retry: {retryAttempts: number; retrySchedule?: number[]}) {
    let http = new HttpClient({retryAttempts: retry.retryAttempts, retrySchedule: retry.retrySchedule})
    let requests: number[] = []
    ;(http as any).request = (_method: string, _url: string, options: any) => {
        let from = options.json.fromBlock
        requests.push(from)
        let headers = new Headers({'x-sqd-finalized-head-number': '100', 'x-sqd-head-number': '100'})
        let body = (async function* () {
            let out = lines(from)
            if (out.length) yield new TextEncoder().encode(out.join('\n') + '\n')
            throw connReset()
        })()
        return Promise.resolve({status: 200, headers, body})
    }
    return {portal: new PortalClient({url: 'http://localhost/datasets/test', http}), requests}
}

async function drain(portal: PortalClient, from: number, to: number, retryAttempts?: number) {
    let blocks: number[] = []
    let stream = portal.getFinalizedStream(
        {type: 'evm', fromBlock: from, toBlock: to},
        retryAttempts == null ? undefined : {request: {retryAttempts}},
    )
    for await (let batch of stream) {
        blocks.push(...batch.blocks.map((b) => b.header.number))
    }
    return blocks
}

describe('response bodies that fail before delivering a block', () => {
    it('are not retried with a zero retry budget', async () => {
        let {portal, requests} = mockPortal(() => [], {retryAttempts: 0})
        await expect(drain(portal, 5, 7, 0)).rejects.toMatchObject({code: 'ECONNRESET'})
        expect(requests).toEqual([5])
    })

    it('are retried within the client retry budget, then fail', async () => {
        let {portal, requests} = mockPortal(() => [], {retryAttempts: 2, retrySchedule: [1]})
        await expect(drain(portal, 5, 7)).rejects.toMatchObject({code: 'ECONNRESET'})
        expect(requests).toEqual([5, 5, 5])
    })

    it('do not use up the budget when the response delivered blocks first', async () => {
        // every response delivers one block and then fails
        let {portal, requests} = mockPortal((from) => [`{"header":{"number":${from},"hash":"0x0${from}","parentHash":"0x00"}}`], {
            retryAttempts: 1,
            retrySchedule: [1],
        })
        expect(await drain(portal, 5, 9, 0)).toEqual([5, 6, 7, 8, 9])
        expect(requests).toEqual([5, 6, 7, 8, 9])
    })
})
