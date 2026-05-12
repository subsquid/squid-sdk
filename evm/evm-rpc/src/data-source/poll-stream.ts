import {Commitment, Rpc} from '../rpc'
import {Block, DataRequest} from '../types'


export interface PollStreamOptions {
    rpc: Rpc
    commitment: Commitment
    from: number
    req?: DataRequest
    strideSize?: number
    confirmationPauseMs?: number
}


export class PollStream {
    private rpc: Rpc
    private commitment: Commitment
    private req: DataRequest
    private strideSize: number
    private head?: number
    private head_hash?: string
    private lastRead?: number
    private from: number

    constructor(options: PollStreamOptions) {
        this.rpc = options.rpc
        this.commitment = options.commitment
        this.req = options.req ?? {}
        this.strideSize = options.strideSize || 5
        this.from = options.from
    }

    position(): number {
        return this.lastRead ? this.lastRead + 1 : this.from
    }

    reset(pos: number): void {
        this.head = undefined
        this.head_hash = undefined
        this.lastRead = undefined
        this.from = pos
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
        this.head_hash = head.hash
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
        let block = null;
        let blocks;
        let can_fast_block = await this.rpc.canDoFastBlock();
        if (can_fast_block && (plan.length == 1) && (plan[0] == this.head) && this.head_hash) {
            block = await this.rpc.getFastBlock(this.head, this.head_hash, this.req);
        }
        if (!block) {
            blocks = await this.rpc.getBlockBatch(plan, this.req)
        } else {
            blocks = [block]
        }

        for (let i = 0; i < blocks.length; i++) {
            if (blocks[i]._isInvalid) {
                blocks = blocks.slice(0, i)
                break
            }
        }

        if (blocks.length > 0) {
            this.lastRead = blocks[blocks.length - 1].number
        }
        return blocks
    }
}
