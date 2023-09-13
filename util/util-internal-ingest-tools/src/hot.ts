import {last, unexpectedCase} from '@subsquid/util-internal'
import assert from 'assert'
import {BlockHeader, Hash, HashAndHeight, HotState, HotUpdate} from './interfaces'


type AnyHead = HashAndHeight | number | Hash


export interface ChainHeads {
    best: AnyHead
    finalized: AnyHead
}


export interface HotProcessorOptions<B> {
    state: HotState
    process: (update: HotUpdate<B>) => Promise<void>
    getBlock: (ref: Partial<HashAndHeight>) => Promise<B>
    getHeader: (block: B) => BlockHeader
    getBlockHeight?: (hash: Hash) => Promise<number>
    maxUpdateSize?: number
}


export class HotProcessor<B> {
    private chain: HashAndHeight[]
    private process: (update: HotUpdate<B>) => Promise<void>
    private getBlock: (ref: Partial<HashAndHeight>) => Promise<B>
    private getHeader: (block: B) => BlockHeader
    private maxUpdateSize: number
    private getBlockHeight?: (hash: Hash) => Promise<number>
    private finalizedHead?: AnyHead

    constructor(options: HotProcessorOptions<B>) {
        this.chain = [options.state, ...options.state.top]
        this.getBlock = options.getBlock
        this.process = options.process
        this.getHeader = options.getHeader
        this.maxUpdateSize = options.maxUpdateSize ?? 10
        this.assertInvariants()
    }

    private assertInvariants(): void {
        for (let i = 1; i < this.chain.length; i++) {
            assert(this.chain[i].height == this.chain[i-1].height + 1)
        }
    }

    getHeight(): number {
        return last(this.chain).height
    }

    getFinalizedHeight(): number {
        return this.chain[0].height
    }

    goto(heads: ChainHeads): Promise<void> {
        this.finalizedHead = heads.finalized
        switch(typeof heads.best) {
            case 'number':
                return this.moveToHeight(heads.best)
            case 'string':
                return this.moveToHash(heads.best)
            case 'object':
                return this.moveToHead(heads.best)
            default:
                throw unexpectedCase()
        }
    }

    private async moveToHeight(height: number): Promise<void> {
        while (this.getHeight() < height) {
            let nextHeight = Math.min(height, this.getHeight() + this.maxUpdateSize)
            let block = await this.getBlock({height: nextHeight})
            await this.moveToBlock(block)
        }
    }

    private async moveToHash(hash: Hash): Promise<void> {
        if (this.chain.some(b => b.hash == hash)) return
        let block = await this.getBlock({hash})
        let head = this.getHeader(block)
        if (head.height > this.getHeight() + this.maxUpdateSize) {
            await this.moveToHeight(head.height - this.maxUpdateSize)
        }
        return this.moveToBlock(block)
    }

    private async moveToHead(head: HashAndHeight): Promise<void> {
        if (head.height <= this.getHeight()) {
            let pos = head.height - this.chain[0].height
            assert(pos >= 0)
            if (this.chain[pos].hash == head.hash) return
        }
        if (head.height > this.getHeight() + this.maxUpdateSize) {
            await this.moveToHeight(head.height - this.maxUpdateSize)
        }
        let block = await this.getBlock(head)
        return this.moveToBlock(block)
    }

    private async moveToBlock(block: B): Promise<void> {
        let newBlocks = [block]
        let head = getParent(this.getHeader(block))

        assert(head.height >= this.chain[0].height)
        let chain = this.chain.slice(0, head.height - this.chain[0].height + 1)

        while (last(chain).height < head.height) {
            let block = await this.getBlock(head)
            newBlocks.push(block)
            head = getParent(this.getHeader(block))
        }

        assert(last(chain).height === head.height)
        while (last(chain).hash !== head.hash) {
            let block = await this.getBlock(head)
            newBlocks.push(block)
            head = getParent(this.getHeader(block))
            chain.pop()
        }

        newBlocks = newBlocks.reverse()
        for (let block of newBlocks) {
            chain.push(this.getHeader(block))
        }

        chain = await this.finalize(chain)

        let baseHead = newBlocks.length
            ? getParent(this.getHeader(newBlocks[0]))
            : last(chain)

        await this.process({
            baseHead,
            finalizedHead: chain[0],
            blocks: newBlocks
        })

        this.chain = chain
    }

    private async finalize(chain: HashAndHeight[]): Promise<HashAndHeight[]> {
        if (this.finalizedHead == null) return chain

        if (typeof this.finalizedHead == 'string') {
            this.finalizedHead = chain.find(b => b.hash == this.finalizedHead)
                || await this.getBlockRef(this.finalizedHead)
        }

        let pos: number

        if (typeof this.finalizedHead == 'object') {
            pos = this.finalizedHead.height - chain[0].height
            if (0 <= pos && pos < chain.length) {
                assert(chain[pos].hash === this.finalizedHead.hash)
            }
        } else {
            pos = this.finalizedHead - chain[0].height
        }

        pos = Math.min(pos, chain.length - 1)

        if (pos > 0) {
            return chain.slice(pos)
        } else {
            return chain
        }
    }

    private async getBlockRef(hash: Hash): Promise<HashAndHeight> {
        if (this.getBlockHeight) {
            let height = await this.getBlockHeight(hash)
            return {hash, height}
        } else {
            let block = await this.getBlock({hash})
            return this.getHeader(block)
        }
    }
}


function getParent(hdr: BlockHeader): HashAndHeight {
    return {
        hash: hdr.parentHash,
        height: hdr.height - 1
    }
}
