import {beforeEach, afterEach, describe, expect, it, vi} from 'vitest'
import type {RpcClient} from '@subsquid/rpc-client'
import type {Block} from '@subsquid/hyperliquid-fills-data'
import {HyperliquidGateway} from './gateway'


const THRESHOLD = 60_000
const TIMEOUT = 60_000
// High enough that the liveness timer never fires during the staleness tests.
const LIVENESS = 120_000
const RETRY_BACKOFF = 2_000  // `run()` waits this long before resubscribing


interface OpenSubscription {
    from?: number
    onMessage(msg: unknown): void
    onError(err: Error): void
    closed: boolean
}


function mkClient(subs: OpenSubscription[]): RpcClient {
    return {
        subscribe(sub: any) {
            let entry: OpenSubscription = {
                from: sub.params?.[0],
                onMessage: sub.onMessage,
                onError: sub.onError,
                closed: false
            }
            subs.push(entry)
            return {
                get isOpen() { return !entry.closed },
                get isClosed() { return entry.closed },
                close() { entry.closed = true },
                reset() {}
            }
        }
    } as unknown as RpcClient
}


function mkBlock(number: number, ageMs: number): Block {
    let time = new Date(Date.now() - ageMs).toISOString()
    return {
        block_number: number,
        block_time: time,
        local_time: time,
        events: []
    }
}


describe('HyperliquidGateway staleness watchdog', () => {
    let subs: OpenSubscription[]
    let gateway: HyperliquidGateway
    let seen: number[]
    let streamError: Error | undefined
    let consumerGate: Promise<void> | undefined

    beforeEach(async () => {
        vi.useFakeTimers()
        subs = []
        seen = []
        streamError = undefined
        consumerGate = undefined
        gateway = new HyperliquidGateway(mkClient(subs), {
            stalenessThreshold: THRESHOLD,
            stalenessTimeout: TIMEOUT,
            subscriptionTimeout: LIVENESS,
            blockBufferSize: 1000
        })

        // Never completes on its own, hence the floating promise.
        void (async () => {
            try {
                for await (let batch of gateway.getStream(100)) {
                    for (let block of batch.blocks) seen.push(block.block_number)
                    if (consumerGate) await consumerGate
                }
            } catch(err: any) {
                streamError = err
            }
        })()

        await vi.advanceTimersByTimeAsync(0)
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    async function deliver(block: Block): Promise<void> {
        subs[subs.length - 1].onMessage(block)
        await vi.advanceTimersByTimeAsync(0)
    }

    it('opens one subscription from the requested block', () => {
        expect(subs.length).toBe(1)
        expect(subs[0].from).toBe(100)
    })

    it('reopens the subscription when block age stops improving', async () => {
        await deliver(mkBlock(100, 0))

        // Notifications keep arriving, so only the age they carry gives the stall away.
        for (let i = 1; i <= 5; i++) {
            await deliver(mkBlock(100 + i, THRESHOLD + i * 10_000))
            await vi.advanceTimersByTimeAsync(10_000)
        }

        expect(subs.length).toBe(1)  // still inside the staleness window

        await vi.advanceTimersByTimeAsync(TIMEOUT + RETRY_BACKOFF)

        expect(subs.length).toBe(2)
        expect(subs[0].closed).toBe(true)
        expect(subs[1].from).toBe(106)  // resumes right after the last delivered block
        expect(streamError).toBeUndefined()
    })

    it('resumes past blocks still buffered for a stalled consumer', async () => {
        let release!: () => void
        consumerGate = new Promise<void>(resolve => { release = resolve })

        await deliver(mkBlock(100, 0))  // consumed, then the consumer parks on the gate

        // These only reach the queue, so resuming from the last *consumed* block would
        // request them a second time and break continuity.
        await deliver(mkBlock(101, THRESHOLD + 10_000))
        await deliver(mkBlock(102, THRESHOLD + 20_000))

        await vi.advanceTimersByTimeAsync(TIMEOUT + RETRY_BACKOFF)

        expect(subs.length).toBe(2)
        expect(subs[1].from).toBe(103)

        await deliver(mkBlock(103, 0))
        release()
        await vi.advanceTimersByTimeAsync(0)

        expect(seen).toEqual([100, 101, 102, 103])
        expect(streamError).toBeUndefined()
    })

    it('does not reopen while the stream is catching up', async () => {
        // What a reopened subscription produces: age far above the threshold, but falling.
        let age = 400_000
        for (let i = 0; i < 12; i++) {
            await deliver(mkBlock(100 + i, age))
            await vi.advanceTimersByTimeAsync(10_000)
            age -= 30_000
        }

        expect(subs.length).toBe(1)
        expect(seen.length).toBe(12)
    })

    it('leaves a healthy stream alone', async () => {
        for (let i = 0; i < 20; i++) {
            await deliver(mkBlock(100 + i, 500))
            await vi.advanceTimersByTimeAsync(10_000)
        }

        expect(subs.length).toBe(1)
    })

    it('still reopens when notifications stop entirely', async () => {
        await deliver(mkBlock(100, 0))

        await vi.advanceTimersByTimeAsync(LIVENESS + RETRY_BACKOFF)

        expect(subs.length).toBe(2)
        expect(subs[1].from).toBe(101)
    })

    it('ignores blocks carrying an unparsable timestamp', async () => {
        await deliver(mkBlock(100, 0))
        await deliver({...mkBlock(101, 0), block_time: 'not-a-date'})

        // Past the staleness deadline but short of the liveness one, so an armed
        // watchdog would have fired by now.
        await vi.advanceTimersByTimeAsync(TIMEOUT + RETRY_BACKOFF + 5_000)

        expect(subs.length).toBe(1)
    })
})
