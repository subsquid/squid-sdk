import {createLogger} from '@subsquid/logger'
import {concurrentMap, last} from '@subsquid/util-internal'
import {ForkException} from '@subsquid/util-internal-data-source'
import {splitRange} from '@subsquid/util-internal-range'
import assert from 'assert'
import {getBlockRef} from '../util'
import {getBlocks} from './fetch'
import {IngestBatch, IngestOptions} from './ingest'


const log = createLogger('sqd:solana-rpc:chain-fixer')


export function ensureContinuity(
    ingest: IngestOptions,
    upstream: AsyncIterable<IngestBatch>,
    from: number,
    parentHash?: string,
    to?: number
): AsyncIterable<IngestBatch>
{
    let stream = new ChainFixer(ingest, from, parentHash).fix(upstream)
    if (to == null) {
        return stream
    } else {
        return limitUpperBoundary(to, stream)
    }
}


async function* limitUpperBoundary(to: number, upstream: AsyncIterable<IngestBatch>): AsyncIterable<IngestBatch> {
    for await (let batch of upstream) {
        if (last(batch.blocks).slot >= to) {
            batch.blocks = batch.blocks.filter(b => b.slot <= to)
            if (batch.blocks.length > 0) {
                yield batch
            }
            return
        }
        yield batch
    }
}


export class ChainFixer {
    constructor(
        private ingest: IngestOptions,
        private from: number,
        private parentHash?: string
    ) {}

    async *fix(upstream: AsyncIterable<IngestBatch>): AsyncIterable<IngestBatch> {
        for await (let batch of upstream) {
            removeOverlaps(batch)

            let {head, tail} = this.acceptBatch(batch)

            if (head) {
                yield head
            }

            if (tail) {
                yield* this.fillGap(tail, 1)
            }
        }
    }

    private async *fillGap(batch: IngestBatch, depth: number): AsyncIterable<IngestBatch> {
        if (depth > 3) throw new Error('the data source is too unstable')
        while (true) {
            let to = batch.blocks[0].block.parentSlot
            assert(this.from <= to)

            let gapLog = log.child({from: this.from, to, depth})
            gapLog.debug('got a gap')

            for await (let missingBatch of this.fetch(this.from, to)) {
                let {head, tail} = this.acceptBatch(missingBatch)

                if (head) {
                    yield head
                }

                if (tail) {
                    yield* this.fillGap(tail, depth + 1)
                }
            }

            // we've covered all the blocks up to `to`,
            // but due to skips, we might not be on `to + 1` position.
            this.from = to + 1

            if (batch.blocks[0].block.previousBlockhash === this.parentHash) {
                gapLog.debug('gap filled')
                let {head, tail} = this.acceptBatch(batch)
                if (head) {
                    yield head
                }
                if (tail) {
                    batch = tail
                } else {
                    return
                }
            } else {
                // we have a chain break,
                // that means batch blocks, that are linked to the first block where skipped
                let i = 1
                for (; i < batch.blocks.length; i++) {
                    let next = batch.blocks[i]
                    let prev = batch.blocks[i - 1]
                    if (next.block.previousBlockhash !== prev.block.blockhash) {
                        break
                    }
                }
                gapLog.debug({dropped: i, left: batch.blocks.length - 1}, 'gap break')
                if (i < batch.blocks.length) {
                    batch = batchSlice(batch, i)
                } else {
                    return
                }
            }
        }
    }

    private fetch(from: number, to: number): AsyncIterable<IngestBatch> {
        return concurrentMap(
            this.ingest.strideConcurrency,
            splitRange(this.ingest.strideSize, {from, to}),
            async range => {
                let blocks = await getBlocks(
                    this.ingest.rpc,
                    this.ingest.commitment,
                    this.ingest.req,
                    range,
                    this.ingest.validateChainContinuity,
                    this.ingest.maxConfirmationAttempts
                )
                return {blocks}
            }
        )
    }

    private acceptBatch(batch: IngestBatch): {
        head?: IngestBatch,
        tail?: IngestBatch
    } {
        // find a boundary of blocks below this.from
        let offset = 0
        while (offset < batch.blocks.length && batch.blocks[offset].slot < this.from) {
            offset += 1
        }

        for (let i = offset; i < batch.blocks.length; i++) {
            let b = batch.blocks[i]
            if (this.from > b.block.parentSlot) {
                if (this.parentHash && this.parentHash !== b.block.previousBlockhash) throw new ForkException(
                    this.parentHash,
                    getBlockRef(b),
                    [{
                        number: b.block.parentSlot,
                        hash: b.block.previousBlockhash
                    }]
                )
                this.from = b.slot + 1
                this.parentHash = b.block.blockhash
            } else {
                if (i - offset > 0) {
                    return {
                        head: batchSlice(batch, offset, i),
                        tail: batchSlice(batch, i)
                    }
                } else {
                    return {
                        tail: batchSlice(batch, offset)
                    }
                }
            }
        }

        if (offset < batch.blocks.length) {
            return {
                head: batchSlice(batch, offset)
            }
        } else {
            return {}
        }
    }
}


function removeOverlaps(batch: IngestBatch): void {
    if (batch.blocks.length == 0) return

    let blocks = batch.blocks
    let i = 0
    let j = 1
    while (j < blocks.length) {
        let next = blocks[j]
        while (i >= 0) {
            let prev = blocks[i]
            if (prev.slot < next.block.parentSlot) {
                break
            }
            if (
                prev.slot === next.block.parentSlot &&
                prev.block.blockhash === next.block.previousBlockhash
            ) {
                break
            }
            i -= 1
        }
        j += 1
        i += 1
        blocks[i] = next
    }
    blocks.length = i + 1
}


function batchSlice(batch: IngestBatch, start?: number, end?: number): IngestBatch {
    let res: IngestBatch = {
        blocks: batch.blocks.slice(start, end)
    }
    if (batch.finalized) {
        res.finalized = {...batch.finalized}
    }
    return res
}
