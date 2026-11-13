import {describe, expect, it} from 'vitest'
import type {Rpc} from '../rpc'
import type {Block} from '../types'
import {finalize} from './finalizer'
import type {IngestBatch} from './ingest'

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

function createFuture<T>(): {promise(): Promise<T>; resolve(value: T): void} {
    let resolve!: (value: T) => void
    let promise = new Promise<T>((res) => (resolve = res))
    return {promise: () => promise, resolve}
}

// A block whose top-level hash matches block.block.hash, as real blocks do.
// getBlockRef reads block.block.hash; the finalizer probe compares info.hash.
function mkBlock(number: number): Block {
    return {
        number,
        hash: '0x' + number,
        block: {hash: '0x' + number, parentHash: '0x' + (number - 1)} as Block['block'],
    }
}

// Stub Rpc exposing only getFinalizedBlockBatch, mirroring the real one:
// it keeps the ascending prefix of requested numbers that are <= the current
// finalized head and returns those blocks index-aligned with that prefix.
function mkRpc(finalizedHead: () => number): Rpc {
    return {
        async getFinalizedBlockBatch(numbers: number[]): Promise<Block[]> {
            let head = finalizedHead()
            return numbers.filter((n) => n <= head).map(mkBlock)
        },
    } as unknown as Rpc
}

// Feed all hot (non-finalized) batches, then hold the input stream open so the
// finalization loop can keep probing, until we observe the target finalized head
// (fixed behaviour) or no new finalization arrives within `idleMs` (frozen).
async function maxFinalized(
    rpc: Rpc,
    batches: IngestBatch[],
    target: number,
    idleMs = 2000
): Promise<number> {
    let stop = createFuture<void>()
    async function* input(): AsyncIterable<IngestBatch> {
        for (let b of batches) yield b
        await stop.promise()
    }

    let max = 0
    let it = finalize(rpc, input())[Symbol.asyncIterator]()
    try {
        while (true) {
            let step = await Promise.race([
                it.next().then((r) => ({r}) as const),
                wait(idleMs).then(() => ({idle: true}) as const),
            ])
            if ('idle' in step) break
            if (step.r.done) break
            let fh = step.r.value.finalizedHead
            if (fh) max = Math.max(max, fh.number)
            if (max >= target) break
        }
    } finally {
        stop.resolve()
        await it.return?.()
    }
    return max
}

describe('EvmRpcDataSource finalizer', () => {
    // Regression: when more than the internal probe-window's worth of hot blocks
    // arrive before they finalize (large finality lag, as on L2s/rollups), the
    // finalizer must still reach the true finalized head. Feeding them as one
    // batch fills the queue in a single pass, reproducing the freeze.
    it('reaches the finalized head when the lag exceeds the probe window', async () => {
        let COUNT = 300
        let FINALIZED = 120 // > the historical 50-block cap
        let rpc = mkRpc(() => FINALIZED)

        let batch: IngestBatch = {
            blocks: Array.from({length: COUNT}, (_, i) => mkBlock(i + 1)),
            finalized: undefined,
        }

        let max = await maxFinalized(rpc, [batch], FINALIZED)
        expect(max).toBe(FINALIZED)
    })

    // Sanity: a small lag (fits the window) keeps working.
    it('reaches the finalized head when the lag is small', async () => {
        let rpc = mkRpc(() => 10)
        let batch: IngestBatch = {
            blocks: Array.from({length: 20}, (_, i) => mkBlock(i + 1)),
            finalized: undefined,
        }
        let max = await maxFinalized(rpc, [batch], 10)
        expect(max).toBe(10)
    })
})
