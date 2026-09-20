import type {RawBlock} from '@subsquid/evm-normalization'
import {afterEach, describe, expect, it, vi} from 'vitest'
import {getComponentsRule} from './components'
import type {MissReason} from './message'
import {wait} from '@subsquid/util-internal'
import {RawStreamSource, type RawStreamSourceOptions, type RpcBatch, type StreamConnection} from './source'
import {
    FakeStream,
    linkOf,
    makeBlock,
    makeChain,
    makeHash,
    makeMessage,
    TimeoutError,
    verifyTestLine,
} from './test-util'

class FakeRpc {
    public bodyRequests: {from: number; to?: number; parentHash?: string}[] = []
    public hashRequests: number[] = []
    public openStreams = 0

    constructor(
        private chain: RawBlock[],
        public head = chain.length - 1,
    ) {}

    getFinalizedHead = async () => linkOf(this.chain[this.head])

    getBlockHash = async (number: number): Promise<string | undefined> => {
        this.hashRequests.push(number)
        return this.chain[number]?.hash
    }

    getBlocks = (range: {from: number; to?: number}, parentHash?: string): AsyncIterable<RpcBatch> => {
        this.bodyRequests.push({...range, parentHash})
        return this.follow(range.from, range.to ?? Number.POSITIVE_INFINITY)
    }

    // Like the real thing, gives what is finalized and waits for more when the range is not over
    private async *follow(from: number, end: number): AsyncIterable<RpcBatch> {
        this.openStreams += 1
        try {
            let next = from
            while (next <= end) {
                let head = this.head
                if (next > head) {
                    await wait(1)
                    continue
                }

                let to = Math.min(next + 2, head, end)
                yield {
                    blocks: this.chain.slice(next, to + 1),
                    finalizedHead: head,
                }
                next = to + 1
            }
        } finally {
            this.openStreams -= 1
        }
    }
}

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

class Connector {
    public connects = 0
    public closes = 0
    public failure?: Error

    constructor(private stream: FakeStream) {}

    connect = async (): Promise<StreamConnection> => {
        this.connects += 1
        if (this.failure) throw this.failure

        let closed = false
        return {
            get: this.stream.get,
            isClosed: () => closed,
            close: async () => {
                closed = true
                this.closes += 1
            },
        }
    }
}

function setup(chain: RawBlock[], stream: FakeStream, options?: Partial<RawStreamSourceOptions>) {
    let rpc = new FakeRpc(chain)
    let metrics = new Metrics()
    let connector = new Connector(stream)

    let source = new RawStreamSource({
        rpc,
        connect: connector.connect,
        rule: getComponentsRule({}),
        getVerifier: async () => verifyTestLine,
        headPollInterval: 1,
        retryInterval: 0,
        waitTimeout: 0,
        metrics,
        ...options,
    })

    return {source, rpc, metrics, connector}
}

/**
 * Requested block numbers split into walks, each of which descends one by one
 */
function countWalks(numbers: number[]): number[] {
    let walks: number[] = []
    let prev: number | undefined

    for (let number of numbers) {
        let isSameWalk = prev != null && number == prev - 1
        if (isSameWalk) {
            walks[walks.length - 1] += 1
        } else {
            walks.push(1)
        }
        prev = number
    }

    return walks
}

async function collect(stream: AsyncIterable<RawBlock[]>): Promise<{blocks: RawBlock[]; batches: number[]}> {
    let blocks: RawBlock[] = []
    let batches: number[] = []
    for await (let batch of stream) {
        blocks.push(...batch)
        batches.push(batch.length)
    }
    return {blocks, batches}
}

describe('publication lag', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('waits for fixed blocks while both the publisher and the RPC head keep advancing', async () => {
        vi.useFakeTimers()
        let chain = makeChain(0, 8)
        let stream = new FakeStream().putChain(chain.slice(0, 2))
        let {source, rpc, metrics} = setup(chain, stream, {waitTimeout: undefined})
        rpc.head = 2
        let headRequests = vi.spyOn(rpc, 'getFinalizedHead')
        let batches = source.getBlocks({from: 1, to: 6}, chain[0].hash)[Symbol.asyncIterator]()
        let received: RawBlock[] = []

        for (let top of [2, 4, 6]) {
            let pending = batches.next()
            await vi.advanceTimersByTimeAsync(1000)
            expect(rpc.bodyRequests).toEqual([])

            // The publisher catches the selected block, but remains behind the advancing RPC head.
            rpc.head = top + 2
            stream.putChain(chain.slice(top, top + 2))
            await vi.advanceTimersByTimeAsync(1000)
            received.push(...(await pending).value!)
        }

        expect((await batches.next()).done).toBe(true)
        expect(received).toEqual(chain.slice(1, 7))
        expect(headRequests).toHaveBeenCalledTimes(3)
        expect(rpc.hashRequests).toEqual([])
        expect(rpc.bodyRequests).toEqual([])
        expect(metrics).toMatchObject({stream: 6, rpc: 0, misses: []})
        for (let top of [2, 4, 6]) {
            expect(stream.requests.filter((block) => block.number === top)).toEqual([
                linkOf(chain[top]),
                linkOf(chain[top]),
                linkOf(chain[top]),
            ])
        }
    })

    it('falls back after the default ten-minute waiting budget and counts a single miss', async () => {
        vi.useFakeTimers()
        let chain = makeChain(0, 3)
        let stream = new FakeStream()
        let {source, rpc, metrics} = setup(chain, stream, {waitTimeout: undefined})
        let pending = collect(source.getBlocks({from: 1, to: 3}, chain[0].hash))

        await vi.advanceTimersByTimeAsync(599_999)
        expect(rpc.bodyRequests).toEqual([])
        await vi.advanceTimersByTimeAsync(1)

        expect((await pending).blocks).toEqual(chain.slice(1))
        expect(rpc.bodyRequests).toHaveLength(1)
        expect(stream.requests).toHaveLength(601)
        expect(stream.requests.every((block) => block.hash === chain[3].hash)).toBe(true)
        expect(metrics).toMatchObject({stream: 0, rpc: 3, misses: ['not_found']})
    })

    it('recovers from RPC when publication lags behind a moving finalized head', async () => {
        vi.useFakeTimers()
        let chain = makeChain(0, 12)
        let stream = new FakeStream().putChain(chain.slice(0, 4))
        let {source, rpc, connector, metrics} = setup(chain, stream, {waitTimeout: 3000})
        connector.failure = new Error('connection refused')
        rpc.head = 4
        let batches = source.getBlocks({from: 1, to: 8}, chain[0].hash)[Symbol.asyncIterator]()

        expect((await batches.next()).value).toEqual(chain.slice(1, 4))
        connector.failure = undefined
        let pending = batches.next()
        await vi.advanceTimersByTimeAsync(1000)
        rpc.head = 8
        stream.putChain(chain.slice(4, 8))
        await vi.advanceTimersByTimeAsync(1000)
        expect((await pending).value).toEqual([chain[4]])

        // the block is given away before the stream is asked for it, so RPC is left on the next request
        pending = batches.next()
        await vi.advanceTimersByTimeAsync(1000)
        rpc.head = 12
        stream.putChain(chain.slice(8, 12))
        await vi.advanceTimersByTimeAsync(1000)
        expect((await pending).value).toEqual(chain.slice(5, 9))
        expect(rpc.openStreams).toBe(0)
        expect((await batches.next()).done).toBe(true)
        expect(rpc.bodyRequests).toHaveLength(1)
        expect(metrics).toMatchObject({stream: 4, rpc: 4, misses: ['error']})
    })

    it('gives away what RPC has fetched before waiting for the stream to publish it', async () => {
        vi.useFakeTimers()
        let chain = makeChain(0, 5)
        let stream = new FakeStream()
        let {source} = setup(chain, stream, {waitTimeout: 600_000})
        let batches = source.getBlocks({from: 1}, chain[0].hash)[Symbol.asyncIterator]()

        // the first walk waits out the whole budget, then RPC takes over
        let first = batches.next()
        await vi.advanceTimersByTimeAsync(600_000)
        expect((await first).value).toEqual(chain.slice(1, 4))

        // the blocks that caught up with the head are in hand, the probe of the stream must not hold them
        expect((await batches.next()).value).toEqual(chain.slice(4, 6))

        await batches.return?.()
    })

    it('does not wait for historical blocks below the finalized head', async () => {
        vi.useFakeTimers()
        let chain = makeChain(0, 20)
        let stream = new FakeStream()
        let {source, metrics} = setup(chain, stream, {waitTimeout: 10_000})

        expect((await collect(source.getBlocks({from: 1, to: 10}))).blocks).toEqual(chain.slice(1, 11))
        expect(stream.requests).toEqual([linkOf(chain[10])])
        expect(metrics).toMatchObject({stream: 0, rpc: 10, misses: ['not_found']})
        expect(vi.getTimerCount()).toBe(0)
    })

    it('does not wait for a missing ancestor once the finalized head is published', async () => {
        vi.useFakeTimers()
        let chain = makeChain(0, 10)
        let stream = new FakeStream().putChain(chain).remove(chain[8])
        let {source, metrics} = setup(chain, stream, {waitTimeout: 10_000})

        expect((await collect(source.getBlocks({from: 1, to: 10}))).blocks).toEqual(chain.slice(1))
        expect(stream.requests.map((block) => block.number)).toEqual([10, 9, 8])
        expect(metrics).toMatchObject({stream: 2, rpc: 8, misses: ['not_found']})
        expect(vi.getTimerCount()).toBe(0)
    })

    it.each(['timeout', 'hash'] as const)('does not wait after a %s failure', async (reason) => {
        vi.useFakeTimers()
        let chain = makeChain(0, 3)
        let stream = new FakeStream().putChain(chain)
        if (reason === 'timeout') {
            stream.fail(chain[3], new TimeoutError('timeout'))
        } else {
            stream.put({...chain[3], stateRoot: makeHash('invalid state')})
        }
        let {source, metrics} = setup(chain, stream, {waitTimeout: 10_000})

        expect((await collect(source.getBlocks({from: 1, to: 3}))).blocks).toEqual(chain.slice(1))
        expect(metrics).toMatchObject({stream: 0, rpc: 3, misses: [reason]})
        expect(vi.getTimerCount()).toBe(0)
    })

    it('stops waiting when a publication retry has a transport failure', async () => {
        vi.useFakeTimers()
        let chain = makeChain(0, 3)
        let stream = new FakeStream()
        let {source, metrics, connector} = setup(chain, stream, {waitTimeout: 10_000})
        let pending = collect(source.getBlocks({from: 1, to: 3}))
        await vi.advanceTimersByTimeAsync(1000)
        stream.failure = new TimeoutError('timeout')
        await vi.advanceTimersByTimeAsync(1000)

        expect((await pending).blocks).toEqual(chain.slice(1))
        expect(metrics).toMatchObject({stream: 0, rpc: 3, misses: ['timeout']})
        expect(connector.closes).toBe(1)
        expect(vi.getTimerCount()).toBe(0)
    })
})

describe('RawStreamSource', () => {
    it('takes a range from the stream without asking RPC for bodies', async () => {
        let chain = makeChain(0, 30)
        let {source, rpc, metrics} = setup(chain, new FakeStream().putChain(chain))

        let {blocks, batches} = await collect(source.getBlocks({from: 5, to: 30}, chain[4].hash))

        expect(blocks).toEqual(chain.slice(5))
        expect(batches.every((size) => size > 0 && size <= 10)).toBe(true)
        expect(rpc.bodyRequests).toEqual([])
        expect(metrics).toMatchObject({stream: 26, rpc: 0, misses: []})
    })

    it('sizes a walk to the payload budget at the weight the last one has shown', async () => {
        let chain = makeChain(0, 30)
        let stream = new FakeStream().putChain(chain)

        // room for three blocks, which the source only learns after the first walk
        let budget = makeMessage(chain[30]).data.length * 3
        let {source, rpc, metrics} = setup(chain, stream, {payloadBudget: budget, walkSize: 8, batchSize: 100})

        let {blocks} = await collect(source.getBlocks({from: 1, to: 30}, chain[0].hash))

        expect(blocks).toEqual(chain.slice(1))
        expect(metrics).toMatchObject({misses: []})

        // the first walk stops on the budget and the gap below it goes to RPC, every later walk fits
        let walks = countWalks(stream.requests.map((block) => block.number))
        expect(walks[0]).toBeLessThanOrEqual(4)
        expect(walks.every((size) => size <= 4)).toBe(true)
        expect(rpc.bodyRequests).toHaveLength(1)
    })

    it('accepts the short hash of the block archived before', async () => {
        let chain = makeChain(0, 12)
        let {source, rpc} = setup(chain, new FakeStream().putChain(chain))

        let {blocks} = await collect(source.getBlocks({from: 5, to: 12}, chain[4].hash.slice(-8)))

        expect(blocks).toEqual(chain.slice(5))
        expect(rpc.bodyRequests).toEqual([])
    })

    it('goes to RPC when the stream does not continue the archived chain', async () => {
        let chain = makeChain(0, 12)
        let {source, rpc, metrics} = setup(chain, new FakeStream().putChain(chain))

        let archived = makeBlock(4, 'fork')
        let {blocks} = await collect(source.getBlocks({from: 5, to: 12}, archived.hash.slice(-8)))

        // RPC gives the same blocks here, the generic dumper check is what rejects them
        expect(blocks).toEqual(chain.slice(5))
        expect(rpc.bodyRequests).toEqual([{from: 5, to: 12, parentHash: undefined}])
        expect(metrics).toMatchObject({stream: 0, rpc: 8, misses: ['link']})
    })

    it('takes what lies below a gap from RPC and what is above from the stream', async () => {
        let chain = makeChain(0, 20)
        let stream = new FakeStream().putChain(chain).remove(chain[12])
        let {source, rpc, metrics} = setup(chain, stream)

        let {blocks} = await collect(source.getBlocks({from: 5, to: 20}, chain[4].hash))

        expect(blocks).toEqual(chain.slice(5))
        expect(rpc.bodyRequests).toEqual([{from: 5, to: 12, parentHash: chain[4].hash}])
        expect(metrics).toMatchObject({stream: 8, rpc: 8, misses: ['not_found']})
    })

    it('drops the stream blocks that do not continue what RPC gave', async () => {
        let canonical = makeChain(0, 10)
        let published = [...makeChain(0, 10, 'fork')]
        let stream = new FakeStream().putChain(published.slice(6))

        let {source, rpc, metrics} = setup(canonical, stream)
        rpc.getFinalizedHead = async () => linkOf(published[10])

        let {blocks} = await collect(source.getBlocks({from: 1, to: 10}, canonical[0].hash))

        expect(blocks).toEqual(canonical.slice(1))
        expect(rpc.bodyRequests.map((r) => [r.from, r.to])).toEqual([
            [1, 5],
            [6, 10],
        ])
        expect(metrics).toMatchObject({stream: 0, rpc: 10, misses: ['not_found', 'link']})
    })

    it('walks a long range in chunks anchored by block hashes from RPC', async () => {
        let chain = makeChain(0, 25)
        let stream = new FakeStream().putChain(chain)
        let {source, rpc, metrics} = setup(chain, stream, {walkSize: 10})

        let {blocks} = await collect(source.getBlocks({from: 1, to: 25}, chain[0].hash))

        expect(blocks).toEqual(chain.slice(1))
        expect(rpc.hashRequests).toEqual([10, 20])
        expect(rpc.bodyRequests).toEqual([])
        expect(metrics).toMatchObject({stream: 25, rpc: 0})
    })

    it('stays with RPC up to the finalized head when the stream is unreachable and tries the stream again then', async () => {
        let chain = makeChain(0, 20)
        let {source, rpc, metrics, connector} = setup(chain, new FakeStream().putChain(chain))
        connector.failure = new Error('connection refused')
        rpc.head = 10

        let received: RawBlock[] = []
        for await (let batch of source.getBlocks({from: 1, to: 20}, chain[0].hash)) {
            received.push(...batch)
            connector.failure = undefined

            if (received.length == 10) {
                rpc.head = 20
            }
        }

        expect(received).toEqual(chain.slice(1))
        expect(rpc.bodyRequests).toEqual([{from: 1, to: 20, parentHash: chain[0].hash}])
        expect(rpc.openStreams).toBe(0)
        expect(connector.connects).toBe(2)
        expect(metrics).toMatchObject({stream: 10, rpc: 10, misses: ['error']})
    })

    it('asks RPC for the rest of the range once, not window by window', async () => {
        let chain = makeChain(0, 30)
        let {source, rpc, metrics} = setup(chain, new FakeStream(), {walkSize: 10})

        let {blocks} = await collect(source.getBlocks({from: 1, to: 30}, chain[0].hash))

        expect(blocks).toEqual(chain.slice(1))
        expect(rpc.bodyRequests).toEqual([{from: 1, to: 30, parentHash: chain[0].hash}])
        expect(rpc.hashRequests).toEqual([10])
        expect(metrics).toMatchObject({stream: 0, rpc: 30, misses: ['not_found']})
    })

    it('leaves RPC only for a stream that has the block RPC has caught up with', async () => {
        let chain = makeChain(0, 30)
        let stream = new FakeStream().putChain(chain.slice(15))
        let {source, rpc, metrics} = setup(chain, stream)
        rpc.head = 10

        let received: RawBlock[] = []
        for await (let batch of source.getBlocks({from: 1, to: 30}, chain[0].hash)) {
            received.push(...batch)

            let isAtHead = received.length == rpc.head
            if (isAtHead && rpc.head < 30) {
                rpc.head += 10
            }
        }

        expect(received).toEqual(chain.slice(1))
        expect(rpc.bodyRequests.map((r) => [r.from, r.to])).toEqual([[1, 30]])
        expect(rpc.openStreams).toBe(0)
        expect(metrics).toMatchObject({stream: 10, rpc: 20, misses: ['not_found', 'not_found']})

        // the top of the first walk, then the blocks RPC has caught up with
        expect(stream.requests.slice(0, 3).map((r) => r.number)).toEqual([10, 10, 20])
    })

    it('warns about a block that fails a check once', async () => {
        let chain = makeChain(0, 20)
        let stream = new FakeStream().putChain(chain)

        for (let number of [8, 18]) {
            stream.put({...chain[number], stateRoot: makeHash('junk')})
        }

        let warnings: unknown[][] = []
        let log: any = {
            warn: (...args: unknown[]) => warnings.push(args),
            info: () => {},
            debug: () => {},
        }

        let {source, metrics} = setup(chain, stream, {walkSize: 10, log})
        let {blocks} = await collect(source.getBlocks({from: 1, to: 20}, chain[0].hash))

        expect(blocks).toEqual(chain.slice(1))
        expect(metrics).toMatchObject({stream: 4, rpc: 16, misses: ['hash', 'hash']})
        expect(warnings).toHaveLength(1)
        expect(warnings[0][0]).toContain('block 8 and what is below it go to RPC, stream miss: hash')
    })

    it('leaves a failed stream alone for the retry interval', async () => {
        let chain = makeChain(0, 30)
        let {source, rpc, metrics, connector} = setup(chain, new FakeStream().putChain(chain), {
            retryInterval: 60_000,
        })
        connector.failure = new Error('connection refused')
        rpc.head = 10

        let received: RawBlock[] = []
        for await (let batch of source.getBlocks({from: 1, to: 30}, chain[0].hash)) {
            received.push(...batch)
            connector.failure = undefined

            // RPC has caught up with the head more than once, the stream is still not asked
            let isAtHead = received.length == rpc.head
            if (isAtHead && rpc.head < 30) {
                rpc.head += 10
            }
        }

        expect(received).toEqual(chain.slice(1))
        expect(rpc.bodyRequests.map((r) => [r.from, r.to])).toEqual([[1, 30]])
        expect(connector.connects).toBe(1)
        expect(metrics).toMatchObject({stream: 0, rpc: 30, misses: ['error']})
    })

    it('counts a miss for the blocks that skip a stream left alone', async () => {
        let chain = makeChain(0, 20)
        let stream = new FakeStream().putChain(chain).fail(chain[8], new TimeoutError('timeout'))
        let {source, rpc, metrics, connector} = setup(chain, stream, {
            walkSize: 10,
            retryInterval: 60_000,
        })

        let {blocks} = await collect(source.getBlocks({from: 1, to: 20}, chain[0].hash))

        expect(blocks).toEqual(chain.slice(1))
        expect(rpc.bodyRequests.map((r) => [r.from, r.to])).toEqual([
            [1, 8],
            [11, 20],
        ])
        expect(connector.connects).toBe(1)
        expect(metrics).toMatchObject({stream: 2, rpc: 18, misses: ['timeout', 'error']})
    })

    it('replaces the connection after a timeout', async () => {
        let chain = makeChain(0, 20)
        let stream = new FakeStream().putChain(chain).fail(chain[8], new TimeoutError('timeout'))
        let {source, rpc, metrics, connector} = setup(chain, stream, {walkSize: 10})

        let {blocks} = await collect(source.getBlocks({from: 1, to: 20}, chain[0].hash))

        expect(blocks).toEqual(chain.slice(1))
        expect(rpc.bodyRequests).toEqual([{from: 1, to: 8, parentHash: chain[0].hash}])
        expect(metrics).toMatchObject({stream: 12, rpc: 8, misses: ['timeout']})
        expect(connector.connects).toBe(2)
        expect(connector.closes).toBe(2)
    })

    it('works with an empty stream', async () => {
        let chain = makeChain(0, 9)
        let {source, metrics} = setup(chain, new FakeStream())

        let {blocks} = await collect(source.getBlocks({from: 0, to: 9}))

        expect(blocks).toEqual(chain)
        expect(metrics).toMatchObject({stream: 0, rpc: 10, misses: ['not_found']})
    })

    it('waits for the finalized head to advance', async () => {
        let chain = makeChain(0, 6)
        let {source, rpc} = setup(chain, new FakeStream().putChain(chain))

        let head = 3
        let polls = 0
        rpc.getFinalizedHead = async () => {
            polls += 1
            if (polls % 3 == 0 && head < 6) {
                head += 1
            }
            return linkOf(chain[head])
        }

        let {blocks} = await collect(source.getBlocks({from: 1, to: 6}, chain[0].hash))

        expect(blocks).toEqual(chain.slice(1))
        expect(rpc.bodyRequests).toEqual([])
    })

    it('follows an open ended range and closes the connection when the consumer leaves', async () => {
        let chain = makeChain(0, 12)
        let {source, rpc, connector} = setup(chain, new FakeStream().putChain(chain))

        let received: RawBlock[] = []
        for await (let batch of source.getBlocks({from: 5}, chain[4].hash)) {
            received.push(...batch)
            if (received.length == 8) break
        }

        expect(received).toEqual(chain.slice(5))
        expect(rpc.bodyRequests).toEqual([])
        expect(connector.connects).toBe(1)
        expect(connector.closes).toBe(1)
    })

    it('closes the RPC stream of an open ended range when the consumer leaves', async () => {
        let chain = makeChain(0, 12)
        let {source, rpc, connector} = setup(chain, new FakeStream(), {retryInterval: 60_000})

        let received: RawBlock[] = []
        for await (let batch of source.getBlocks({from: 5}, chain[4].hash)) {
            received.push(...batch)
            if (received.length == 8) break
        }

        expect(received).toEqual(chain.slice(5))
        expect(rpc.bodyRequests).toEqual([{from: 5, to: undefined, parentHash: chain[4].hash}])
        expect(rpc.openStreams).toBe(0)
        expect(connector.closes).toBe(1)
    })

    it('takes hashes from RPC and from the archive in any case', async () => {
        let chain = makeChain(0, 25)
        let {source, rpc, metrics} = setup(chain, new FakeStream().putChain(chain), {walkSize: 10})

        let upper = (hash: string) => `0x${hash.slice(2).toUpperCase()}`

        rpc.getFinalizedHead = async () => ({number: 25, hash: upper(chain[25].hash)})
        rpc.getBlockHash = async (number) => upper(chain[number].hash)

        let {blocks} = await collect(source.getBlocks({from: 1, to: 25}, upper(chain[0].hash)))

        expect(blocks).toEqual(chain.slice(1))
        expect(rpc.bodyRequests).toEqual([])
        expect(metrics).toMatchObject({stream: 25, rpc: 0, misses: []})
    })

    it('goes to RPC when RPC has no hash to start a walk from', async () => {
        let chain = makeChain(0, 25)
        let stream = new FakeStream().putChain(chain)
        let {source, rpc, metrics} = setup(chain, stream, {walkSize: 10})

        rpc.getBlockHash = async () => undefined

        let {blocks} = await collect(source.getBlocks({from: 1, to: 25}, chain[0].hash))

        expect(blocks).toEqual(chain.slice(1))
        expect(stream.requests).toEqual([])
        expect(rpc.bodyRequests).toEqual([{from: 1, to: 25, parentHash: chain[0].hash}])
        expect(metrics).toMatchObject({stream: 0, rpc: 25, misses: ['error']})
    })

    it('reports a failing stream once and its recovery only after a request has been answered', async () => {
        let chain = makeChain(0, 40)
        let stream = new FakeStream().putChain(chain)
        stream.failure = new Error('no responders')

        let events: {level: string; args: unknown[]}[] = []
        let log: any = {
            warn: (...args: unknown[]) => events.push({level: 'warn', args}),
            info: (...args: unknown[]) => events.push({level: 'info', args}),
            debug: () => {},
        }

        let {source, rpc, metrics, connector} = setup(chain, stream, {log})
        rpc.head = 10

        let received: RawBlock[] = []
        for await (let batch of source.getBlocks({from: 1, to: 40}, chain[0].hash)) {
            received.push(...batch)

            let isAtHead = received.length == rpc.head
            if (isAtHead && rpc.head < 40) {
                rpc.head += 10
            }

            if (rpc.head == 30) {
                stream.failure = undefined
            }
        }

        expect(received).toEqual(chain.slice(1))

        // a walk and one attempt to find the block RPC has caught up with fail, the second attempt is answered
        expect(metrics).toMatchObject({stream: 20, rpc: 20, misses: ['error', 'error']})
        expect(rpc.bodyRequests.map((r) => [r.from, r.to])).toEqual([[1, 40]])

        // every failed request was made over a connection that has been established all right
        expect(connector.connects).toBe(3)

        expect(events).toEqual([
            {level: 'warn', args: [new Error('no responders'), 'block stream is not available, falling back to RPC']},
            {level: 'info', args: ['block stream is available again']},
        ])
    })

    it('reports an unreachable stream once', async () => {
        let chain = makeChain(0, 20)
        let warnings: unknown[][] = []
        let log: any = {
            warn: (...args: unknown[]) => warnings.push(args),
            info: () => {},
            debug: () => {},
        }

        let {source, rpc, connector} = setup(chain, new FakeStream().putChain(chain), {log})
        connector.failure = new Error('connection refused')
        rpc.head = 10

        for await (let batch of source.getBlocks({from: 1, to: 20}, chain[0].hash)) {
            if (Number(batch[batch.length - 1].number) == 10) {
                rpc.head = 20
            }
        }

        expect(connector.connects).toBe(2)
        expect(warnings).toHaveLength(1)
    })
})
