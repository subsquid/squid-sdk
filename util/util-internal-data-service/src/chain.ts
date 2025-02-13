import {bisect, last} from '@subsquid/util-internal'
import assert from 'assert'
import {Block, BlockHeader, BlockRef, DataResponse, InvalidBaseBlock} from './types'
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

    finalize(head: BlockRef): boolean {
        if (head.number < this.firstBlockNumber()) return false

        let current = this.finalizedHead

        if (head.number > this.lastBlockNumber()) {
            // we assume it is safe to finalize all blocks,
            // because this method is supposed to be called as part
            // of the DataSource stream processing, which comes with certain guarantees
            this.finalizedHead = this.blocks.length - 1
            return this.finalizedHead > current
        }

        let pos = head.number == this.lastBlockNumber()
            ? this.blocks.length - 1
            : this.bisect(head.number)

        assert(
            this.blocks[pos].number === head.number && this.blocks[pos].hash === head.hash,
            'attempt to finalize a block, that is not part of the current chain'
        )

        this.finalizedHead = Math.max(this.finalizedHead, pos)
        return this.finalizedHead > current
    }

    query(limit: number, from: number): DataResponse
    query(limit: number, from: number, baseBlockHash?: string): DataResponse | InvalidBaseBlock
    query(limit: number, from: number, baseBlockHash?: string): DataResponse | InvalidBaseBlock {
        assert(from > this.firstBlock().parentNumber)

        let pos = this.bisect(from)

        if (pos < this.blocks.length) {
            if (baseBlockHash != null && this.blocks[pos].parentHash !== baseBlockHash) {
                let prev: BlockRef[] = []

                for (let i = Math.max(0, pos - 100); i <= pos; i++) {
                    let b = this.blocks[i]
                    prev.push({
                        number: b.parentNumber,
                        hash: b.parentHash
                    })
                }

                return new InvalidBaseBlock(prev)
            } else {
                return {
                    finalizedHead: this.getFinalizedHead(),
                    tail: this.blocks.slice(pos, pos + limit)
                }
            }
        } else if (
            baseBlockHash != null &&
            from == last(this.blocks).number + 1 &&
            baseBlockHash !== last(this.blocks).hash
        ) {
            let prev = this.blocks.slice(Math.max(0, this.blocks.length - 100)).map(b => {
                return {
                    number: b.number,
                    hash: b.hash
                }
            })
            return new InvalidBaseBlock(prev)
        } else {
            return {
                finalizedHead: this.getFinalizedHead()
            }
        }
    }

    first(count: number): Block[] {
        return this.blocks.slice(0, count)
    }

    private bisect(blockNumber: number): number {
        return bisect(this.blocks, blockNumber, (b, number) => b.number - number)
    }

    firstBlock(): Block {
        return this.blocks[0]
    }

    lastBlock(): Block {
        return last(this.blocks)
    }

    firstBlockNumber(): number {
        return this.blocks[0].number
    }

    lastBlockNumber(): number {
        return this.lastBlock().number
    }

    getFinalizedHead(): BlockHeader {
        let block = this.blocks[this.finalizedHead]
        return {
            number: block.number,
            hash: block.hash,
            parentNumber: block.parentNumber,
            parentHash: block.parentHash,
            timestamp: block.timestamp
        }
    }

    getHead(): BlockHeader {
        let block = last(this.blocks)
        return {
            number: block.number,
            hash: block.hash,
            parentNumber: block.parentNumber,
            parentHash: block.parentHash,
            timestamp: block.timestamp
        }
    }

    getForkBase(prev: BlockRef[]): BlockRef {
        prev = prev.slice()
        let fh = prev.pop()
        let top = this.blocks.length - 1
        while (top >= this.finalizedHead) {
            let head = {
                number: this.blocks[top].number,
                hash: this.blocks[top].hash
            }

            while (fh && fh.number > head.number) {
                fh = prev.pop()
            }

            if (fh == null) return head
            if (fh.number === head.number && fh.hash === head.hash) return head
            top -= 1
        }
        throw new Error('attempt to rollback behind finalized head')
    }
}
