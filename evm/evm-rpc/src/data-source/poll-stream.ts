import {createLogger, Logger} from '@subsquid/logger'
import {addErrorContext, last} from '@subsquid/util-internal'
import {Commitment, Rpc} from '../rpc'
import {Block, DataRequest} from '../types'


// Same budget as getBlocks() gives an invalid block on the finalized path.
const MAX_INVALID_RETRIES = 5


export interface PollStreamOptions {
    rpc: Rpc
    commitment: Commitment
    from: number
    req?: DataRequest
    strideSize?: number
}


export class PollStream {
    private rpc: Rpc
    private commitment: Commitment
    private req: DataRequest
    private strideSize: number
    private head?: number
    private lastRead?: number
    private from: number
    private invalidBlock?: number
    private invalidRetries = 0
    private log: Logger

    constructor(options: PollStreamOptions) {
        this.rpc = options.rpc
        this.commitment = options.commitment
        this.req = options.req ?? {}
        this.strideSize = options.strideSize || 5
        this.from = options.from
        this.log = createLogger('sqd:evm-rpc')
    }

    position(): number {
        return this.lastRead ? this.lastRead + 1 : this.from
    }

    reset(pos: number): void {
        this.head = undefined
        this.lastRead = undefined
        this.from = pos
        this.invalidBlock = undefined
        this.invalidRetries = 0
    }

    async next(): Promise<Block[]> {
        if (this.lastRead === undefined || this.head === undefined || this.lastRead >= this.head) {
            let head = await this.fetchHead()
            if (this.lastRead !== undefined && head <= this.lastRead) {
                return []
            }
        }
        return this.fetchBlocks()
    }

    private async fetchHead(): Promise<number> {
        let head = await this.rpc.getLatestBlockhash(this.commitment)
        return this.head = head.number
    }

    private makePlan(): number[] {
        let start = this.lastRead ? this.lastRead + 1 : this.from
        let end = Math.min(start + this.strideSize, this.head ? this.head : Infinity)
        let res = []
        for (let i = start; i <= end; i++) {
            res.push(i)
        }
        return res
    }

    private async fetchBlocks(): Promise<Block[]> {
        let plan = this.makePlan()
        let blocks = await this.rpc.getBlockBatch(plan, this.req)

        for (let i = 0; i < blocks.length; i++) {
            if (blocks[i]._isInvalid) {
                this.onInvalidBlock(blocks[i])
                blocks = blocks.slice(0, i)
                break
            }
        }

        if (blocks.length > 0) {
            if (this.invalidBlock != null && last(blocks).number >= this.invalidBlock) {
                this.invalidBlock = undefined
                this.invalidRetries = 0
            }
            this.lastRead = blocks[blocks.length - 1].number
        }
        return blocks
    }

    /**
     * An invalid block is polled again on the next call. On the finalized path
     * the data should not change any more, so a block that stays invalid fails
     * the stream like it does in getBlocks(), instead of stalling it. At the
     * head of the chain a provider may still be catching up: keep waiting.
     */
    private onInvalidBlock(block: Block): void {
        if (block.number === this.invalidBlock) {
            this.invalidRetries += 1
        } else {
            this.invalidBlock = block.number
            this.invalidRetries = 0
        }

        if (this.commitment == 'finalized' && this.invalidRetries >= MAX_INVALID_RETRIES) {
            throw addErrorContext(new Error(block._errorMessage ?? 'invalid block'), {
                rpcUrl: this.rpc.endpoint,
                failedBlocks: [block.number],
                retries: this.invalidRetries
            })
        }

        this.log.warn({
            blockNumber: block.number,
            blockHash: block.hash,
            reason: block._errorMessage,
            retries: this.invalidRetries
        }, 'invalid block, will poll it again')
    }
}
