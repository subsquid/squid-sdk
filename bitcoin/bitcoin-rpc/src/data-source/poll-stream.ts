import { Commitment, Rpc } from '../rpc'
import { Block, DataRequest } from '../types'

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
        this.lastRead = undefined
        this.from = pos
    }

    async next(): Promise<Block[]> {
        if (this.lastRead === undefined || this.head === undefined || this.lastRead >= this.head) {
            const head = await this.fetchHead()
            if (this.lastRead !== undefined && head <= this.lastRead) {
                return []
            }
        }
        return this.fetchBlocks()
    }

    private async fetchHead(): Promise<number> {
        const head = await this.rpc.getLatestBlockhash(this.commitment)
        return (this.head = head.number)
    }

    private makePlan(): number[] {
        const start = this.lastRead ? this.lastRead + 1 : this.from
        const end = Math.min(start + this.strideSize, this.head ? this.head : Infinity)
        const res = []
        for (let i = start; i <= end; i++) {
            res.push(i)
        }
        return res
    }

    private async fetchBlocks(): Promise<Block[]> {
        const plan = this.makePlan()
        let blocks = await this.rpc.getBlockBatch(plan, this.req)

        if (blocks.length > 0) {
            this.lastRead = blocks[blocks.length - 1].number
        }
        return blocks
    }
}
