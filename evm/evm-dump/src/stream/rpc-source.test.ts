import type {RawBlock} from '@subsquid/evm-normalization'
import {EvmRpcDataSource, Rpc} from '@subsquid/evm-rpc'
import {describe, expect, it} from 'vitest'
import {getComponentsRule} from './components'
import {createRpcSource} from './rpc-source'
import {RawStreamSource} from './source'
import {FakeStream, makeChain, verifyTestLine} from './test-util'

interface RpcCall {
    method: string
    params?: any[]
}

/**
 * Serves a chain and counts what it was asked for
 */
class CountingClient {
    public readonly url = 'http://localhost'
    public calls: Record<string, number> = {}

    constructor(
        private chain: RawBlock[],
        public head: number,
    ) {}

    getConcurrency(): number {
        return 5
    }

    isConnectionError(): boolean {
        return false
    }

    async call(method: string, params?: any[], options?: any): Promise<any> {
        let result = this.respond({method, params})
        return options?.validateResult ? options.validateResult(result) : result
    }

    async batchCall(batch: RpcCall[], options?: any): Promise<any[]> {
        return Promise.all(batch.map((call) => this.call(call.method, call.params, options)))
    }

    private respond(call: RpcCall): unknown {
        switch (call.method) {
            case 'eth_chainId':
                this.count('chain id')
                return '0x1'
            case 'eth_getLogs':
                this.count('logs')
                return []
            case 'eth_getBlockByNumber':
                return this.getBlock(call.params![0], call.params![1])
            default:
                throw new Error(`unexpected call of ${call.method}`)
        }
    }

    private getBlock(ref: string, withTransactions: boolean): unknown {
        if (ref == 'finalized') {
            this.count('finalized head')
            return this.chain[this.head]
        }

        this.count(withTransactions ? 'block' : 'header')
        return this.chain[Number(ref)]
    }

    private count(what: string): void {
        this.calls[what] = (this.calls[what] ?? 0) + 1
    }
}

function setup(chain: RawBlock[], head: number) {
    let client = new CountingClient(chain, head)
    let rpc = new Rpc({client: client as any})

    let dataSource = new EvmRpcDataSource({
        rpc,
        req: {transactions: true, logs: true},
        headPollInterval: 1,
    })

    return {client, rpc, dataSource}
}

interface Follow {
    /**
     * The chain grows by that many blocks every time the consumer has got all of it
     */
    headStep: number
    lastBlock: number
}

// Makes the chain grow and tells when to leave
function onBlocks(client: CountingClient, received: number, follow?: Follow): 'leave' | undefined {
    if (follow == null) return
    if (received >= follow.lastBlock) return 'leave'

    if (received == client.head) {
        client.head += follow.headStep
    }
}

async function countWithoutStream(
    chain: RawBlock[],
    head: number,
    range: {from: number; to?: number},
    follow?: Follow,
) {
    let {client, dataSource} = setup(chain, head)

    let received = 0
    for await (let batch of dataSource.getFinalizedStream(range)) {
        received += batch.blocks.length
        if (onBlocks(client, received, follow) == 'leave') break
    }

    return {calls: client.calls, received}
}

async function countWithEmptyStream(
    chain: RawBlock[],
    head: number,
    range: {from: number; to?: number},
    follow?: Follow,
) {
    let {client, rpc, dataSource} = setup(chain, head)
    let stream = new FakeStream()

    let source = new RawStreamSource({
        rpc: createRpcSource(rpc, dataSource),
        connect: async () => ({
            get: stream.get,
            isClosed: () => false,
            close: async () => {},
        }),
        rule: getComponentsRule({}),
        getVerifier: async () => verifyTestLine,
        headPollInterval: 1,
        // the stream is asked again at every opportunity, which is the most expensive it can get
        waitTimeout: 0,
        retryInterval: 0,
    })

    let received = 0
    for await (let batch of source.getBlocks(range)) {
        received += batch.length
        if (onBlocks(client, received, follow) == 'leave') break
    }

    return {calls: client.calls, received, streamRequests: stream.requests.length}
}

describe('RPC traffic with a stream that has nothing', () => {
    it('adds a head and a header request to a range far below the head', async () => {
        let chain = makeChain(0, 700)
        let range = {from: 1, to: 600}

        let plain = await countWithoutStream(chain, 700, range)
        let streamed = await countWithEmptyStream(chain, 700, range)

        expect(plain.received).toBe(600)
        expect(streamed.received).toBe(600)
        expect(streamed.streamRequests).toBe(1)

        expect(plain.calls).toEqual({
            'chain id': 1,
            'finalized head': 1,
            block: 600,
            logs: plain.calls.logs,
        })

        expect(streamed.calls).toEqual({
            ...plain.calls,
            'finalized head': 2,
            header: 1,
        })
    })

    it('adds a head request to a range that ends at the head', async () => {
        let chain = makeChain(0, 40)
        let range = {from: 1, to: 40}

        let plain = await countWithoutStream(chain, 40, range)
        let streamed = await countWithEmptyStream(chain, 40, range)

        expect(streamed.received).toBe(40)
        expect(streamed.streamRequests).toBe(1)

        expect(streamed.calls).toEqual({
            ...plain.calls,
            'finalized head': plain.calls['finalized head'] + 1,
        })
    })

    it('fetches no block twice and no header while following the head', async () => {
        let chain = makeChain(0, 40)
        let follow = {headStep: 3, lastBlock: 40}

        let plain = await countWithoutStream(chain, 10, {from: 1}, follow)
        let streamed = await countWithEmptyStream(chain, 10, {from: 1}, follow)

        expect(plain.received).toBe(40)
        expect(streamed.received).toBe(40)

        expect(plain.calls.block).toBe(40)
        expect(streamed.calls.block).toBe(40)
        expect(streamed.calls.logs).toBe(plain.calls.logs)
        expect(streamed.calls.header).toBeUndefined()

        // the first walk and the blocks RPC has caught up with, RPC is never left for the stream
        expect(streamed.streamRequests).toBeGreaterThan(1)
    })
})
