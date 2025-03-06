import {Block, GetBlock} from '@subsquid/solana-rpc-data'
import {createFuture} from '@subsquid/util-internal'
import assert from 'assert'


export function toBlock(slot: number, block: GetBlock): Block {
    assert(block.blockHeight != null)
    return {
        hash: block.blockhash,
        height: block.blockHeight,
        slot,
        block
    }
}


export function isConsistentChain(prev: Block, next: Block) {
    return prev.height + 1 == next.height &&
        prev.hash == next.block.previousBlockhash &&
        prev.slot == next.block.parentSlot
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
