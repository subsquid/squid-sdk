import {Base58Bytes} from '@subsquid/solana-rpc-data'
import {bisect, last} from '@subsquid/util-internal'
import assert from 'assert'
import {Block} from './types'
import {isChain} from './util'


export class Chain {
    private blocks: Block[]
    private finalizedHead: number

    constructor(
        base: Block,
        private maxSize: number = 500
    ) {
        assert(this.maxSize > 0)
        this.blocks = [base]
        this.finalizedHead = 0
    }

    compact(): boolean {
        let extra = this.blocks.length - this.maxSize
        if (extra <= 0) return true
        let ok = this.finalizedHead >= extra
        let trim = Math.min(extra, this.finalizedHead)
        this.blocks = this.blocks.slice(trim)
        this.finalizedHead -= trim
        return ok
    }

    push(newBlock: Block): void {
        if (this.lastBlock().slot < newBlock.slot) {
            assert(isChain(this.lastBlock(), newBlock))
            this.blocks.push(newBlock)
            return
        }

        // ignore blocks, that lie below finalized head
        if (this.lastFinalizedBlock().slot >= newBlock.slot) {
            return
        }

        let pos = this.bisect(newBlock.slot)
        assert(0 < pos && pos < this.blocks.length)

        // same block was inserted
        if (this.blocks[pos].hash === newBlock.hash) return

        // rollback
        let prev = this.blocks[pos - 1]
        assert(isChain(prev, newBlock))
        this.blocks = this.blocks.slice(0, pos)
        this.blocks.push(newBlock)
    }

    finalize(slot: number, hash: Base58Bytes): boolean {
        throw new Error('not implemented')
    }

    getFirstBelow(slot: number): Block | undefined {
        if (slot <= this.blocks[0].slot) return
        if (this.lastBlock().slot < slot) return this.lastBlock()
        let pos = this.bisect(slot)
        assert(0 < pos && pos < this.blocks.length)
        return this.blocks[pos - 1]
    }

    query(limit: number, fromSlot: number): Block[] {
        let pos = this.bisect(fromSlot)
        return this.blocks.slice(pos, pos + limit)
    }

    private bisect(slot: number): number {
        return bisect(this.blocks, slot, (b, slot) => b.slot - slot)
    }

    firstSlot(): number {
        return this.blocks[0].slot
    }

    lastSlot(): number {
        return last(this.blocks).slot
    }

    lastFinalizedBlock(): Block {
        return this.blocks[this.finalizedHead]
    }

    lastBlock(): Block {
        return last(this.blocks)
    }

    getUnfinalizedSlots(): number[] {
        let slots = []
        for (let i = this.finalizedHead; i < this.blocks.length; i++) {
            slots.push(this.blocks[i].slot)
        }
        return slots
    }
}
