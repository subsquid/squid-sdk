import * as http from 'node:http'
import type {AddressInfo} from 'node:net'
import {afterEach, describe, expect, it} from 'vitest'
import {Rpc} from '../src/rpc'
import {EvmRpcClient} from '../src/rpc-client'

// A batch that fails as a whole is retried by Rpc in halves, with the client's own retries off.
// That retry must still be counted in the client's metrics (`sqd_chain_rpc_retried_errors_total`),
// or a rate-limited endpoint looks healthy on the dashboards.

const ZERO32 = '0x' + '00'.repeat(32)
const hash = (n: number) => '0x' + n.toString(16).padStart(64, '0')

function block(n: number) {
    return {
        number: '0x' + n.toString(16),
        hash: hash(n),
        parentHash: n === 0 ? ZERO32 : hash(n - 1),
        extraData: '0x',
        gasLimit: '0x1c9c380',
        gasUsed: '0x0',
        sha3Uncles: '0x1dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d49347',
        logsBloom: '0x' + '00'.repeat(256),
        transactionsRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
        receiptsRoot: '0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421',
        stateRoot: ZERO32,
        miner: '0x' + '00'.repeat(20),
        size: '0x220',
        timestamp: '0x' + (1_700_000_000 + n).toString(16),
        transactions: [],
        uncles: [],
    }
}

let server: http.Server | undefined
let client: EvmRpcClient | undefined

afterEach(async () => {
    client?.close()
    client = undefined
    await new Promise<void>((resolve) => (server ? server.close(() => resolve()) : resolve()))
    server = undefined
})

describe('Rpc batch retries in halves', () => {
    it('counts the retry in the client metrics', async () => {
        // Rate-limits any batch of more than one block; single blocks are served.
        server = http.createServer((req, res) => {
            let body = ''
            req.on('data', (c) => (body += c))
            req.on('end', () => {
                let parsed = JSON.parse(body)
                let calls: any[] = Array.isArray(parsed) ? parsed : [parsed]
                let limited = calls.length > 1
                let answers = calls.map((c) =>
                    c.method === 'eth_chainId'
                        ? {jsonrpc: '2.0', id: c.id, result: '0x1'}
                        : limited
                          ? {jsonrpc: '2.0', id: c.id, error: {code: -32429, message: 'Throughput limit exceeded'}}
                          : {jsonrpc: '2.0', id: c.id, result: block(Number.parseInt(c.params[0], 16))},
                )
                res.setHeader('content-type', 'application/json')
                res.end(JSON.stringify(Array.isArray(parsed) ? answers : answers[0]))
            })
        })
        await new Promise<void>((resolve) => server!.listen(0, '127.0.0.1', resolve))
        let url = `http://127.0.0.1:${(server!.address() as AddressInfo).port}`
        client = new EvmRpcClient({url, retryAttempts: 0, retrySchedule: [0]})
        let rpc = new Rpc({client})

        let blocks = await rpc.getBlockBatch([1, 2])

        expect(blocks.map((b) => b.number)).toEqual([1, 2])
        expect(client.getMetrics().retriedErrors).toEqual({rate_limit: 1})
    })
})
