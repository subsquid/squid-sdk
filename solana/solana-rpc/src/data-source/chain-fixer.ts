import {last} from '@subsquid/util-internal'
import {ForkException} from '@subsquid/util-internal-data-source'
import {Commitment} from '../rpc'
import {getBlockRef} from '../util'
import {IngestBatch} from './ingest'


export class ChainFixer implements AsyncIterableIterator<IngestBatch> {
    private stack: AsyncIterator<IngestBatch>[]

    constructor(
        private fetch: (commitment: Commitment, from: number, depth: number) => AsyncIterable<IngestBatch>,
        upstream: AsyncIterable<IngestBatch>,
        private from: number,
        private parentHash?: string,
        private to: number = Infinity
    ) {
        this.stack = [
            removeOverlaps(upstream)[Symbol.asyncIterator]()
        ]
    }

    [Symbol.asyncIterator](): this {
        return this
    }

    async next(): Promise<IteratorResult<IngestBatch, undefined>> {
        while (true) {
            let batch = await this.nextBatch()
            if (batch == null) return {done: true, value: undefined}

            batch = this.checkBatch(batch)
            if (batch == null) continue

            // checkBatch() ensures this.from boundary, but not this.to
            if (last(batch.blocks).slot > this.to) {
                await this.return()
                do {
                    batch.blocks.pop()
                } while (batch.blocks.length > 0 && last(batch.blocks).slot > this.to)
            }

            if (batch.blocks.length > 0) {
                return {value: batch}
            }
        }
    }

    private checkBatch(batch: IngestBatch): IngestBatch | undefined {
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
                    this.push(batchSlice(batch, i))
                    return batchSlice(batch, offset, i)
                } else {
                    this.push(batchSlice(batch, offset))
                    return
                }
            }
        }

        if (offset < batch.blocks.length) {
            return batchSlice(batch, offset)
        }
    }

    private push(batch: IngestBatch): void {
        if (this.stack.length > 4) throw new Error('data source is too unstable')

        let commitment: Commitment = batch.finalized && batch.finalized.number >= last(batch.blocks).slot
            ? 'finalized'
            : 'confirmed'

        let head = removeOverlaps(
            this.fetch(commitment, this.from, this.stack.length)
        )[Symbol.asyncIterator]()

        let concat = new ConcatStream(head, batch, last(this.stack))
        this.stack.push(concat)
    }

    private async nextBatch(): Promise<IngestBatch | undefined> {
        while (this.stack.length > 0) {
            let item = await last(this.stack).next()
            if (item.done) {
                this.stack.pop()
            } else if (item.value.blocks.length > 0) {
                return item.value
            }
        }
    }

    async return() {
        let err: Error | undefined
        let s: AsyncIterator<IngestBatch> | undefined
        while (s = this.stack.pop()) {
            try {
                await s.return?.()
            } catch(ex: any) {
                err = ex
            }
        }
        if (err) throw err
        return {done: true, value: undefined} as IteratorReturnResult<undefined>
    }
}


class ConcatStream implements AsyncIterator<IngestBatch> {
    private ended = false

    constructor(
        private head: AsyncIterator<IngestBatch>,
        private tailHead: IngestBatch,
        private tail: AsyncIterator<IngestBatch>
    ) {}

    async next(): Promise<IteratorResult<IngestBatch, undefined>> {
        if (this.ended) return {done: true, value: undefined}

        let head = await nextBatch(this.head)
        if (head == null) throw new Error('unexpected end of head stream')

        await this.appendTail(head)

        return {value: head}
    }

    private async appendTail(head: IngestBatch): Promise<void> {
        while (
            this.tailHead.blocks.length == 0 ||
            head.blocks[0].slot > last(this.tailHead.blocks).slot
        ) {
            let tail = await nextBatch(this.tail)
            if (tail == null) {
                this.ended = true
                return
            }
            this.tailHead = tail
        }

        let tail = this.tailHead
        let he = last(head.blocks)

        if (last(tail.blocks).slot > he.slot) {
            let i = tail.blocks.length - 1
            while (i >= 0 && tail.blocks[i].block.parentSlot > he.slot) {
                i -= 1
            }
            if (i < 0) return
            let tb = tail.blocks[i]
            if (tb.block.parentSlot === he.slot && tb.block.previousBlockhash === he.block.blockhash) {
                head.blocks.push(...tail.blocks.slice(i))

                if (head.finalized && head.finalized.number > he.slot) {
                    head.finalized = getBlockRef(he)
                }

                if (tail.finalized) {
                    if (head.finalized == null || head.finalized.number < tail.finalized.number) {
                        head.finalized = {...tail.finalized}
                    }
                }

                this.ended = true
                this.tailHead = {blocks: []}
            }
        } else {
            let te = last(tail.blocks)
            this.ended = head.blocks.some(b => {
                return b.slot === te.slot && b.block.blockhash === te.block.blockhash
            })
            this.tailHead = {blocks: []}
        }
    }

    async return() {
        await this.head.return?.()
        return {done: true} as IteratorReturnResult<undefined>
    }
}


async function nextBatch(stream: AsyncIterator<IngestBatch>): Promise<IngestBatch | undefined> {
    while (true) {
        let item = await stream.next()
        if (item.done) {
            return
        }
        if (item.value.blocks.length > 0) {
            return item.value
        }
    }
}


async function* removeOverlaps(stream: AsyncIterable<IngestBatch>): AsyncIterable<IngestBatch> {
    for await (let batch of stream) {
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
        yield batch
    }
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
