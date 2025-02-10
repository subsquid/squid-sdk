import {bisect, last} from '@subsquid/util-internal'
import assert from 'assert'
import {Block, BlockRef, InvalidBaseBlock} from './types'
import {isChain} from './util'


export class Chain {
    private blocks: Block[]
    private finalizedHead: number

    constructor(base: Block, private maxSize: number) {
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
            this.blocks.push(newBlock)
            return
        }

        let pos = this.bisect(newBlock.number)
        assert(pos > this.finalizedHead, 'attempt to revert finalized head')

        // rollback
        let prev = this.blocks[pos - 1]
        assert(isChain(prev, newBlock))
        this.blocks = this.blocks.slice(0, pos)
        this.blocks.push(newBlock)
    }

    finalize(number: number, hash: string): boolean {
        if (number < this.firstBlockNumber()) return false
        if (number > this.lastBlockNumber()) return false

        let pos = number == this.lastBlockNumber()
            ? this.blocks.length - 1
            : this.bisect(number)

        if (this.blocks[pos].number === number && this.blocks[pos].hash === hash) {
            this.finalizedHead = Math.max(this.finalizedHead, pos)
            return true
        } else {
            return false
        }
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
            from == last(this.blocks).number + 1 &&
            baseBlockHash !== last(this.blocks).hash
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

    private bisect(blockNumber: number): number {
        return bisect(this.blocks, blockNumber, (b, number) => b.number - number)
    }

    private lastBlock(): Block {
        return last(this.blocks)
    }

    firstBlockNumber(): number {
        return this.blocks[0].number
    }

    lastBlockNumber(): number {
        return this.lastBlock().number
    }

    getFinalizedHead(): BlockRef {
        let block = this.blocks[this.finalizedHead]
        return {
            number: block.number,
            hash: block.hash
        }
    }

    getHead(): BlockRef {
        let block = last(this.blocks)
        return {
            number: block.number,
            hash: block.hash
        }
    }
}
