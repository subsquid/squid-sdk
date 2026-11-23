import {HttpClient} from '@subsquid/http-client'
import {describe, expect, it} from 'vitest'
import {PortalClient} from './client'

function streamOf(text: string): AsyncIterable<Uint8Array> {
    return (async function* () {
        yield new TextEncoder().encode(text)
    })()
}

function mockPortal(lines: string[]) {
    let http = new HttpClient()
    let calls = 0
    ;(http as any).request = () => {
        calls += 1
        let headers = new Headers({'x-sqd-finalized-head-number': '10', 'x-sqd-head-number': '10'})
        return Promise.resolve({status: 200, headers, body: streamOf(calls == 1 ? lines.join('\n') + '\n' : '')})
    }
    return new PortalClient({url: 'http://localhost/datasets/tron-mainnet', http})
}

describe('tron stream', () => {
    it('keeps int64 values above 2^53 exact', async () => {
        let portal = mockPortal([
            '{"header":{"number":5,"hash":"00"},"transactions":[{"transactionIndex":0,"timestamp":1794673917971267665,"fee":100}]}',
        ])
        let blocks: any[] = []
        for await (let batch of portal.getFinalizedStream({type: 'tron', fromBlock: 5, toBlock: 5})) {
            blocks.push(...batch.blocks)
        }
        expect(blocks).toHaveLength(1)
        expect(blocks[0].header.number).toBe(5)
        expect(blocks[0].transactions[0].timestamp).toBe('1794673917971267665')
        // safe integers stay numbers
        expect(blocks[0].transactions[0].fee).toBe(100)
    })
})
