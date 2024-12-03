import {Base58Bytes} from '@subsquid/solana-rpc-data'
import {bisect, last} from '@subsquid/util-internal'
import assert from 'assert'
import {Block, BlockRef} from './types'
import {isChain} from './util'


export class InvalidBaseBlock {
    constructor(public readonly prev: BlockRef[]) {}
}


export class Chain {
    private blocks: Block[]
    private finalizedHead: number

    constructor(
        base: Block,
        private maxSize: number
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
        if (this.lastBlock().number < newBlock.number) {
            assert(isChain(this.lastBlock(), newBlock))
            this._push(newBlock)
            return
        }

        // ignore blocks, that lie below finalized head
        if (this.lastFinalizedBlock().number >= newBlock.number) {
            return
        }

        let pos = this.bisect(newBlock.number)
        assert(0 < pos && pos < this.blocks.length)

        // same block was inserted
        if (this.blocks[pos].hash === newBlock.hash) {
            if (newBlock.isFinal) {
                this.finalizedHead = pos
            }
            return
        }

        // rollback
        let prev = this.blocks[pos - 1]
        assert(isChain(prev, newBlock))
        this.blocks = this.blocks.slice(0, pos)
        this._push(newBlock)
    }

    private _push(block: Block): void {
        this.blocks.push(block)
        if (block.isFinal) {
            this.finalizedHead = this.blocks.length - 1
        }
    }

    finalize(number: number, hash: Base58Bytes): boolean {
        if (number <= this.lastFinalizedBlock().number) return false
        let pos = this.bisect(number)
        if (pos >= this.blocks.length) return false
        if (this.blocks[pos].number === number && this.blocks[pos].hash === hash) {
            this.finalizedHead = pos
            return true
        } else {
            return false
        }
    }

    getFirstBelow(number: number): Block | undefined {
        if (number <= this.blocks[0].number) return
        if (this.lastBlock().number < number) return this.lastBlock()
        let pos = this.bisect(number)
        assert(0 < pos && pos < this.blocks.length)
        return this.blocks[pos - 1]
    }

    query(limit: number, from: number): Block[]
    query(limit: number, from: number, baseBlockHash?: string): Block[] | InvalidBaseBlock
    query(limit: number, from: number, baseBlockHash?: string): Block[] | InvalidBaseBlock {
        let pos = this.bisect(from)
        if (pos < this.blocks.length) {
            if (baseBlockHash != null && this.blocks[pos].parentHash !== baseBlockHash) {
                let prev: BlockRef[] = []

                for (let i = pos; i >= Math.max(0, pos - 9); i--) {
                    let b = this.blocks[i]
                    prev.push({
                        number: b.parentNumber,
                        hash: b.parentHash
                    })
                }

                return new InvalidBaseBlock(prev)
            } else {
                return this.blocks.slice(pos, pos + limit)
            }
        } else if (
            baseBlockHash != null &&
            from == this.lastSlot() + 1 &&
            baseBlockHash !== this.lastBlock().hash
        ) {
            let prev = this.blocks.slice(Math.max(0, this.blocks.length - 10)).map(b => {
                return {
                    number: b.number,
                    hash: b.hash
                }
            })
            return new InvalidBaseBlock(prev.reverse())
        } else {
            return []
        }
    }

    private bisect(slot: number): number {
        return bisect(this.blocks, slot, (b, slot) => b.number - slot)
    }

    firstSlot(): number {
        return this.blocks[0].number
    }

    lastSlot(): number {
        return last(this.blocks).number
    }

    getFinalizedHead(): BlockRef {
        let block = this.lastFinalizedBlock()
        return {
            number: block.number,
            hash: block.hash
        }
    }

    getHead(): BlockRef {
        let block = this.lastBlock()
        return {
            number: block.number,
            hash: block.hash
        }
    }

    private lastFinalizedBlock(): Block {
        return this.blocks[this.finalizedHead]
    }

    lastBlock(): Block {
        return last(this.blocks)
    }

    getUnfinalizedSlots(): number[] {
        let slots = []
        for (let i = this.finalizedHead + 1; i < this.blocks.length; i++) {
            slots.push(this.blocks[i].number)
        }
        return slots
    }
}
