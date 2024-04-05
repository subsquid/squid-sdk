import {AsyncQueue, createFuture, last} from '@subsquid/util-internal'
import assert from 'assert'
import {Block, GetBlock} from './data'


export function isConsistentChain(prev: Block, next: Block) {
    return prev.height + 1 == next.height &&
        prev.hash == next.block.previousBlockhash &&
        prev.slot == next.block.parentSlot
}


export class ChainConsistencyValidator {
    private prev?: Block

    assertNext(block: Block): void {
        if (this.prev == null) {
            this.prev = block
        } else {
            assert(this.prev.height < block.height)
            assert(this.prev.slot < block.slot)
            if (this.prev.height + 1 == block.height) {
                assert(isConsistentChain(this.prev, block))
            }
            this.prev = block
        }
    }

    assertNextBatch(blocks: Block[]): void {
        if (blocks.length == 0) return
        this.assertNext(blocks[0])
        for (let i = 1; i < blocks.length; i++) {
            assert(isConsistentChain(blocks[i-1], blocks[i]))
        }
        this.prev = last(blocks)
    }
}


export function toBlock(slot: number, block: GetBlock): Block {
    assert(block.blockHeight != null)
    return {
        hash: block.blockhash,
        height: block.blockHeight,
        slot,
        block
    }
}


export class AsyncProbe<T> {
    private error?: Error
    private updating = false

    constructor(
        private value: T,
        private fetch: () => Promise<T>
    ) {}

    get(): T {
        if (this.error) throw this.error
        if (!this.updating) {
            this.update()
        }
        return this.value
    }

    private update(): void {
        this.updating = true
        this.fetch().then(
            value => {
                this.value = value
                this.updating = false
            },
            error => {
                this.error = error
                this.updating = false
            }
        )
    }
}


export class AsyncJobTracker {
    private future = createFuture<void>()
    private jobs = 0
    private doneCalled = false

    register(promise: Promise<any>): void {
        assert(!this.doneCalled)

        this.jobs += 1

        promise.then(
            () => {
                this.jobs -= 1
                if (this.doneCalled && this.jobs == 0) {
                    this.future.resolve()
                }
            },
            err => {
                this.future.reject(err)
            }
        )
    }

    done(): Promise<void> {
        this.doneCalled = true
        if (this.jobs == 0) {
            this.future.resolve()
        }
        return this.future.promise()
    }
}


// export function mergeBatches<T>(maxSize: number, stream: AsyncIterable<T[]>): AsyncIterable<T[]> {
//     let notify = new AsyncQueue<null | Error>(1)
//     let pack: T[] = []
//
//     async function loop() {
//         for await (let batch of stream) {
//             pack.push(...batch)
//             if (pack.length > maxSize) {
//
//             }
//         }
//     }
// }
