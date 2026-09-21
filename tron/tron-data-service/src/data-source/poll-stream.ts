import {BlockData, fetchBlock, fetchTransactionsInfo, getParentHash, HttpApi} from '@subsquid/tron-data'


export interface PollStreamOptions {
    httpApi: HttpApi
    /**
     * Returns the current head height to poll up to.
     *
     * For the hot stream this is the latest block height,
     * for the finalized stream it is the finalized head height.
     */
    getHead: () => Promise<number>
    from: number
    strideSize?: number
}


/**
 * Sequentially reads blocks from a given position towards the (moving) head.
 *
 * Unlike {@link getBlocks} it is tolerant to blocks being temporarily
 * unavailable or not forming a chain (which is normal near the head),
 * stopping the current batch at the first such block.
 */
export class PollStream {
    private httpApi: HttpApi
    private getHead: () => Promise<number>
    private strideSize: number
    private head?: number
    private lastRead?: number
    private from: number

    constructor(options: PollStreamOptions) {
        this.httpApi = options.httpApi
        this.getHead = options.getHead
        this.strideSize = options.strideSize || 5
        this.from = options.from
    }

    position(): number {
        return this.lastRead == null ? this.from : this.lastRead + 1
    }

    reset(pos: number): void {
        this.head = undefined
        this.lastRead = undefined
        this.from = pos
    }

    async next(): Promise<BlockData[]> {
        if (this.lastRead == null || this.head == null || this.lastRead >= this.head) {
            this.head = await this.getHead()
            if (this.lastRead != null && this.head <= this.lastRead) {
                return []
            }
        }
        return this.fetchBlocks()
    }

    private makePlan(): number[] {
        let start = this.position()
        let end = Math.min(start + this.strideSize, this.head ?? start)
        let plan: number[] = []
        for (let i = start; i <= end; i++) {
            plan.push(i)
        }
        return plan
    }

    private async fetchBlocks(): Promise<BlockData[]> {
        let plan = this.makePlan()
        let maybe = await Promise.all(plan.map(n => fetchBlock(this.httpApi, n, true)))

        let blocks: BlockData[] = []
        for (let i = 0; i < maybe.length; i++) {
            let block = maybe[i]
            if (block == null) break
            if (i > 0 && getParentHash(block) !== blocks[i - 1].hash) break
            blocks.push(block)
        }

        let infoOk = await Promise.all(blocks.map(block => fetchTransactionsInfo(this.httpApi, block)))
        let badIndex = infoOk.findIndex(ok => !ok)
        if (badIndex >= 0) {
            blocks = blocks.slice(0, badIndex)
        }

        if (blocks.length > 0) {
            this.lastRead = blocks[blocks.length - 1].height
        }
        return blocks
    }
}
