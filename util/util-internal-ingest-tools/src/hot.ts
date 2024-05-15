import {last} from '@subsquid/util-internal'
import assert from 'assert'
import {BlockHeader, Hash, HashAndHeight, HotState, HotUpdate} from './interfaces'
import {BlockRef} from './ref'


export interface ChainHeads {
    best: BlockRef
    finalized: BlockRef
}


export interface HotProcessorOptions<B> {
    process(update: HotUpdate<B>): Promise<void>
    getBlock(ref: HashAndHeight): Promise<B>
    /**
     * This method must handle situations where `from > to`,
     * in such cases `from` must be coerced to `to`.
     */
    getBlockRange(from: number, to: BlockRef): AsyncIterable<B[]>
    getHeader(block: B): BlockHeader
    getFinalizedBlockHeight?(hash: Hash): Promise<number>
}


export class HotProcessor<B> {
    private o: HotProcessorOptions<B>
    private chain: HashAndHeight[]
    private finalizedHead?: BlockRef

    constructor(state: HotState, options: HotProcessorOptions<B>) {
        this.o = options
        this.chain = [state, ...state.top]
        for (let i = 1; i < this.chain.length; i++) {
            assert(this.chain[i].height == this.chain[i-1].height + 1)
        }
    }

    getHeight(): number {
        return last(this.chain).height
    }

    getFinalizedHeight(): number {
        return Math.max(this.chain[0].height, this.getPassedFinalizedHeight())
    }

    private getPassedFinalizedHeight(): number {
        if (this.finalizedHead == null) return 0
        if (this.finalizedHead.height == null) {
            return this.chain.find(h => h.hash === this.finalizedHead?.hash)?.height ?? 0
        } else {
            return this.finalizedHead.height
        }
    }

    async goto(heads: ChainHeads): Promise<void> {
        if (this.isKnownBlock(heads.best)) return
        this.finalizedHead = heads.finalized
        for await (let blocks of this.o.getBlockRange(this.getHeight() + 1, heads.best)) {
            await this.moveToBlocks(blocks)
        }
    }

    private isKnownBlock(ref: BlockRef): boolean {
        if (ref.height == null) {
            return !!this.chain.find(b => b.hash === ref.hash)
        } else {
            if (ref.height <= this.chain[0].height) return true
            if (ref.hash == null) return ref.height < this.getHeight()
            let pos = ref.height - this.chain[0].height
            return this.chain[pos]?.hash === ref.hash
        }
    }

    private async moveToBlocks(blocks: B[]): Promise<void> {
        if (blocks.length == 0) return

        for (let i = 1; i < blocks.length; i++) {
            assert(this.o.getHeader(blocks[i-1]).hash === this.o.getHeader(blocks[i]).parentHash)
        }

        let newBlocks = blocks.slice().reverse()
        let head = getParent(this.o.getHeader(blocks[0]))

        assert(head.height >= this.chain[0].height)
        let chain = this.chain.slice(0, head.height - this.chain[0].height + 1)

        while (last(chain).height < head.height) {
            let block = await this.o.getBlock(head)
            newBlocks.push(block)
            head = getParent(this.o.getHeader(block))
        }

        assert(last(chain).height === head.height)
        while (last(chain).hash !== head.hash) {
            let block = await this.o.getBlock(head)
            newBlocks.push(block)
            head = getParent(this.o.getHeader(block))
            chain.pop()
        }

        newBlocks = newBlocks.reverse()
        for (let block of newBlocks) {
            chain.push(this.o.getHeader(block))
        }

        chain = await this.finalize(chain)

        let baseHead = newBlocks.length
            ? getParent(this.o.getHeader(newBlocks[0]))
            : last(chain)

        await this.o.process({
            baseHead,
            finalizedHead: chain[0],
            blocks: newBlocks
        })

        this.chain = chain
    }

    private async finalize(chain: HashAndHeight[]): Promise<HashAndHeight[]> {
        if (this.finalizedHead == null) return chain

        let finalizedHeight: number

        if (this.finalizedHead.height == null) {
            finalizedHeight = chain.find(b => b.hash == this.finalizedHead?.hash)?.height
                || await this.getFinalizedBlockHeight(this.finalizedHead.hash)

            this.finalizedHead = {
                height: finalizedHeight,
                hash: this.finalizedHead.hash
            }
        } else {
            finalizedHeight = this.finalizedHead.height
        }

        let pos = finalizedHeight - chain[0].height
        if (this.finalizedHead.hash && 0 <= pos && pos < chain.length) {
            assert(chain[pos].hash === this.finalizedHead.hash)
        }

        pos = Math.min(pos, chain.length - 1)

        if (pos > 0) {
            return chain.slice(pos)
        } else {
            return chain
        }
    }

    private getFinalizedBlockHeight(blockHash: Hash): Promise<number> {
        if (this.o.getFinalizedBlockHeight == null) throw new Error(
            `.getFinalizedBlockHeight() method is not available`
        )
        return this.o.getFinalizedBlockHeight(blockHash)
    }
}


function getParent(hdr: BlockHeader): HashAndHeight {
    return {
        hash: hdr.parentHash,
        height: hdr.height - 1
    }
}
