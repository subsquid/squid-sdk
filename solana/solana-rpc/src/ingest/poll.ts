import {Base58Bytes, Block} from '@subsquid/solana-rpc-data'
import {last} from '@subsquid/util-internal'
import assert from 'assert'
import {Commitment, DataRequest} from '../base'
import {Rpc} from '../rpc'
import {toBlock} from '../util'


type MissingBlock = [slot: number, isInvalid: boolean]


export class PollStream {
    private blocks: (MissingBlock | Block)[] = []
    private pos: number
    private _isOnHead = false

    constructor(
        private rpc: Rpc,
        private strideSize: number,
        private commitment: Commitment,
        private req: DataRequest,
        fromSlot: number,
    ) {
        this.pos = fromSlot - 1
    }

    getHeadSlot(): number {
        if (this.blocks.length > 0) {
            let head = last(this.blocks)
            return isMissing(head) ? head[0] : head.slot
        } else {
            return this.pos
        }
    }

    isOnHead(): boolean {
        return this._isOnHead
    }

    async next(): Promise<Block[]> {
        while (true) {
            if (this._isOnHead) {
                assert(this.blocks.length == 0)
                await this.fetchSlots()
                if (this.blocks.length == 0) return []
                this._isOnHead = false
            }

            await this.fetchBlocks()

            this.trimInvalidTail()

            let batch = this.takeBatch()
            if (batch.length > 0) return batch

            if (this.blocks.length > 0 && isMissing(this.blocks[0]) && this.blocks[0][1]) {
                this.blocks = []
            }

            if (this.blocks.length == 0) {
                this._isOnHead = true
            }
        }
    }

    private async fetchSlots(): Promise<void> {
        let slots = await this.rpc.getBlocksWithLimit(
            this.commitment,
            this.getHeadSlot() + 1,
            this.strideSize
        )
        for (let slot of slots) {
            this.blocks.push([slot, true])
        }
    }

    private async fetchBlocks(): Promise<void> {
        let pos = this.pos

        let slots: number[] = []
        let missing: number[] = []

        for (let i = 0; i < this.blocks.length; i++) {
            let block = this.blocks[i]
            if (isMissing(block)) {
                pos = block[0]
                slots.push(pos)
                missing.push(i)
            } else {
                pos = block.slot
            }
        }

        let left = this.strideSize - this.blocks.length
        for (let i = 0; i < left; i++) {
            slots.push(pos += 1)
        }

        let blocks = await this.rpc.getBlockBatch(slots, {
            commitment: this.commitment,
            maxSupportedTransactionVersion: 0,
            rewards: this.req.rewards,
            transactionDetails: this.req.transactions ? 'full' : 'none'
        })

        for (let i = 0; i < blocks.length; i++) {
            let block = blocks[i]
            if (block) {
                let b = toBlock(slots[i], block)
                if (i < missing.length) {
                    this.blocks[missing[i]] = b
                } else {
                    this.blocks.push(b)
                }
            } else if (block === undefined) {
                if (i < missing.length) {
                    this.blocks[missing[i]] = [slots[i], true]
                }
            } else if (missing.length >= i) {
                this.blocks.push([slots[i], false])
            }
        }
    }

    private trimInvalidTail(): void {
        let end = this.checkChain()
        if (end < this.blocks.length) {
            this.blocks = this.blocks.slice(0, end)
            this.trimMissingBlocks()
        }
    }

    private trimMissingBlocks(): void {
        while (this.blocks.length && isMissing(last(this.blocks))) {
            this.blocks.pop()
        }
    }

    private checkChain(): number {
        let prevSlot: number | undefined
        let prevHash: Base58Bytes | undefined

        for (let i = 0; i < this.blocks.length; i++) {
            let block = this.blocks[i]
            if (isMissing(block)) {
                assert(prevSlot == null || prevSlot < block[0])
                prevSlot = block[0]
                prevHash = undefined
            } else if (prevSlot == null) {
                prevSlot = block.slot
                prevHash = block.hash
            } else {
                if (prevSlot !== block.block.parentSlot) return i
                if (prevHash && prevHash !== block.block.previousBlockhash) return i
                prevSlot = block.slot
                prevHash = block.hash
            }
        }

        return this.blocks.length
    }

    private takeBatch(): Block[] {
        let batch: Block[] = []
        for (let block of this.blocks) {
            if (isMissing(block)) {
                break
            } else {
                batch.push(block)
            }
        }
        if (batch.length > 0) {
            this.blocks = this.blocks.slice(batch.length)
            this.pos = last(batch).slot
        }
        return batch
    }
}


function isMissing(block: MissingBlock | Block): block is MissingBlock {
    return Array.isArray(block)
}
