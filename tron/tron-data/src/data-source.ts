import {Batch, coldIngest} from '@subsquid/util-internal-ingest-tools'
import {RangeRequest, SplitRequest} from '@subsquid/util-internal-range'
import {assertNotNull} from '@subsquid/util-internal'
import assert from 'assert'
import {BlockData, TransactionInfo} from './data'
import {HttpApi} from './http'


function getBlockHash(blockId: string) {
    return '0x' + blockId.slice(16)
}


export interface DataRequest {
    transactions?: boolean
    transactionsInfo?: boolean
}


export interface HttpDataSourceOptions {
    httpApi: HttpApi
    headPollInterval?: number
    strideSize?: number
    strideConcurrency?: number
}


export class HttpDataSource {
    private httpApi: HttpApi
    private headPollInterval: number
    private strideSize: number
    private strideConcurrency: number
    private finalityConfirmation: number

    constructor(options: HttpDataSourceOptions) {
        this.httpApi = options.httpApi
        this.headPollInterval = options.headPollInterval ?? 1000
        this.strideSize = options.strideSize || 10
        this.strideConcurrency = options.strideConcurrency || 2
        this.finalityConfirmation = 20
    }

    getBlockHeader(height: number) {
        return this.httpApi.getBlock(height, false)
    }

    async getFinalizedHeight(): Promise<number> {
        let block = await this.httpApi.getNowBlock()
        let number = assertNotNull(block.block_header.raw_data.number)
        return number - this.finalityConfirmation
    }

    getFinalizedBlocks(
        requests: RangeRequest<DataRequest>[],
        stopOnHead?: boolean
    ): AsyncIterable<Batch<BlockData>> {
        return coldIngest({
            getFinalizedHeight: () => this.getFinalizedHeight(),
            getSplit: (req) => this.getSplit(req),
            requests,
            concurrency: this.strideConcurrency,
            splitSize: this.strideSize,
            stopOnHead,
            headPollInterval: this.headPollInterval
        })
    }

    private async getBlock(num: number, detail: boolean): Promise<BlockData> {
        let block = await this.httpApi.getBlock(num, detail)
        assert(block)
        return {
            block,
            height: block.block_header.raw_data.number || 0,
            hash: getBlockHash(block.blockID)
        }
    }

    private async getBlocks(from: number, to: number, detail: boolean): Promise<BlockData[]> {
        let promises = []
        for (let num = from; num <= to; num++) {
            let promise = this.getBlock(num, detail)
            promises.push(promise)
        }
        return Promise.all(promises)
    }

    private async addTransactionsInfo(blocks: BlockData[]) {
        let promises = []
        for (let block of blocks) {
            // info isn't presented for genesis block
            if (block.height == 0) continue

            let promise = this.httpApi.getTransactionInfo(block.height)
                .then(transactionsInfo => {
                    let infoById: Record<string, TransactionInfo> = {}
                    for (let info of transactionsInfo) {
                        infoById[info.id] = info
                    }
                    for (let tx of block.block.transactions || []) {
                        assert(infoById[tx.txID])
                    }
                    block.transactionsInfo = transactionsInfo
                })
            promises.push(promise)
        }
        await Promise.all(promises)
    }

    private async getSplit(req: SplitRequest<DataRequest>): Promise<BlockData[]> {
        let blocks = await this.getBlocks(req.range.from, req.range.to, !!req.request.transactions)
        if (req.request.transactionsInfo) {
            this.addTransactionsInfo(blocks)
        }
        return blocks
    }
}
