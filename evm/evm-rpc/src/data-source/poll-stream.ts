import {Commitment, Rpc} from '../rpc'
import {Block, DataRequest} from '../types'


export interface PollStreamOptions {
    rpc: Rpc
    commitment: Commitment
    from: number
    req?: DataRequest
    strideSize?: number
    maxConfirmationAttempts?: number
    confirmationPauseMs?: number
}


export class PollStream {
    private rpc: Rpc
    private commitment: Commitment
    private req: DataRequest
    private strideSize: number
    private head: number | undefined
    private lastRead: number | undefined
    private from: number

    constructor(options: PollStreamOptions) {
        this.rpc = options.rpc
        this.commitment = options.commitment
        this.req = options.req ?? {}
        this.strideSize = options.strideSize || 5
        this.head = undefined
        this.lastRead = undefined
        this.from = options.from;
    }

    position(): number {
        return this.lastRead ? this.lastRead + 1 : this.from
    }

    reset(pos: number): void {
        this.head = undefined
        this.from = pos
    }

    async next(): Promise<Block[]> {
        if (this.lastRead === undefined || this.head === undefined || this.lastRead >= this.head) {
            let head = await this.fetchHead();
            if (this.lastRead !== undefined && head <= this.lastRead) {
                return []
            }
        }
        let blocks = await this.fetchBlocks();
        return blocks;
    }

    private async fetchHead(): Promise<number> {
        let head = (await this.rpc.getLatestBlockhash(this.commitment)).number;
        this.head = head;
        return head;
    }

    private makePlan(): number[] {
        let start = this.lastRead ? this.lastRead + 1 : this.from;
        let end = Math.min(start + this.strideSize, this.head ? this.head : Infinity)
        let res = []
        for (let i = start; i <= end; i++) {
            res.push(i);
        }
        return res
    }

    private async fetchBlocks(): Promise<Block[]> {
        let plan = this.makePlan();
        let blocks = await this.rpc.getBlockBatch(plan, this.req)
        if (blocks.length > 0) {
            this.lastRead = blocks[blocks.length - 1].number
        }
        return blocks
    }
}
