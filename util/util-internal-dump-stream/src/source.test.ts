import {getShortHash} from '@subsquid/util-internal-dump-cli'
import {describe, expect, it} from 'vitest'
import type {MissReason} from './message'
import {RawStreamSource, type RawStreamSourceOptions} from './source'
import {FakeRpc, FakeStream, getLineSize, makeChain, type ToyBlock, toyFormat, verifyToyLine} from './test-util'

class Metrics {
    public stream = 0
    public rpc = 0
    public misses: MissReason[] = []

    blocks(source: 'stream' | 'rpc', count: number): void {
        this[source] += count
    }

    miss(reason: MissReason): void {
        this.misses.push(reason)
    }
}

function setup(chain: ToyBlock[], stream: FakeStream, options?: Partial<RawStreamSourceOptions<ToyBlock>>) {
    let rpc = new FakeRpc(chain)
    let metrics = new Metrics()

    let source = new RawStreamSource({
        rpc,
        connect: async () => ({get: stream.get, isClosed: () => false, close: async () => {}}),
        format: toyFormat,
        getVerifier: async () => verifyToyLine,
        headPollInterval: 1,
        retryInterval: 0,
        waitTimeout: 0,
        metrics,
        ...options,
    })

    return {source, rpc, metrics}
}

async function collect(stream: AsyncIterable<ToyBlock[]>): Promise<{blocks: ToyBlock[]; batches: number[]}> {
    let blocks: ToyBlock[] = []
    let batches: number[] = []
    for await (let batch of stream) {
        blocks.push(...batch)
        batches.push(batch.length)
    }
    return {blocks, batches}
}

describe('RawStreamSource', () => {
    // Every line of this chain has the same size
    const chain = makeChain(11, 20)
    const lineSize = getLineSize(chain[0])

    it('takes a chain with case sensitive hashes from the stream alone', async () => {
        let {source, rpc, metrics} = setup(chain, new FakeStream().putChain(chain))

        let {blocks} = await collect(source.getBlocks({from: 12, to: 20}, getShortHash(chain[0].hash)))

        expect(blocks).toEqual(chain.slice(1))
        expect(rpc.bodyRequests).toEqual([])
        expect(metrics).toMatchObject({stream: 9, rpc: 0, misses: []})
    })

    it('takes from RPC what lies below a gap of the stream', async () => {
        let stream = new FakeStream().putChain(chain).remove(chain[2])
        let {source, rpc, metrics} = setup(chain, stream)

        let {blocks} = await collect(source.getBlocks({from: 12, to: 20}, chain[0].hash))

        expect(blocks).toEqual(chain.slice(1))
        expect(rpc.bodyRequests).toEqual([{from: 12, to: 13, parentHash: chain[0].hash}])
        expect(metrics).toMatchObject({stream: 7, rpc: 2, misses: ['not_found']})
    })

    it('goes to RPC when the stream does not continue the archived chain', async () => {
        let {source, rpc, metrics} = setup(chain, new FakeStream().putChain(chain))

        let {blocks} = await collect(source.getBlocks({from: 13, to: 20}, getShortHash(chain[0].hash)))

        expect(blocks).toEqual(chain.slice(2))
        expect(rpc.bodyRequests).toEqual([{from: 13, to: 20, parentHash: undefined}])
        expect(metrics).toMatchObject({stream: 0, rpc: 8, misses: ['link']})
    })

    it('fills a batch up to the decompressed bytes it may hold', async () => {
        let stream = new FakeStream().putChain(chain)
        let {source} = setup(chain, stream, {batchSize: 100, batchBudget: 2 * lineSize})

        let {blocks, batches} = await collect(source.getBlocks({from: 11, to: 20}))

        expect(blocks).toEqual(chain)
        expect(batches).toEqual([2, 2, 2, 2, 2])
    })

    it('hands over a block bigger than a batch may hold on its own', async () => {
        let stream = new FakeStream().putChain(chain)
        let {source} = setup(chain, stream, {batchSize: 100, batchBudget: lineSize - 1})

        let {blocks, batches} = await collect(source.getBlocks({from: 11, to: 14}))

        expect(blocks).toEqual(chain.slice(0, 4))
        expect(batches).toEqual([1, 1, 1, 1])
    })
})
