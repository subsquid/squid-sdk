import {LogLevel, createLogger} from '@subsquid/logger'
import {HttpClient} from '@subsquid/http-client'
import {Batch, coldIngest} from '@subsquid/util-internal-ingest-tools'
import {RangeRequest, SplitRequest} from '@subsquid/util-internal-range'
import {DataValidationError, GetSrcType, Validator} from '@subsquid/util-internal-validation'
import {wait} from '@subsquid/util-internal'
import assert from 'assert'
import {BlockData, Blocks, LatestBlockHeight, GetBlockHash, DataRequest, GetBlockHeader, BlockHeader} from './raw-data'
import {getLatestBlockQuery, getBlockHashQuery, getBlockHeaderQuery, getBlocksQuery} from './query'


const log = createLogger('sqd:fuel-data')


function getResultValidator<V extends Validator>(validator: V): (result: unknown) => GetSrcType<V> {
    return function(result: unknown) {
        let err = validator.validate(result)
        if (err) {
            throw new DataValidationError(`server returned unexpected result: ${err.toString()}`)
        } else {
            return result as any
        }
    }
}


export interface HttpDataSourceOptions {
    client: HttpClient
    headPollInterval?: number
    strideSize?: number
    strideConcurrency?: number
}


export class HttpDataSource {
    private client: HttpClient
    private headPollInterval: number
    private strideSize: number
    private strideConcurrency: number

    constructor(options: HttpDataSourceOptions) {
        this.client = options.client
        this.headPollInterval = options.headPollInterval ?? 500
        this.strideSize = options.strideSize || 10
        this.strideConcurrency = options.strideConcurrency || 5
        assert(this.strideSize >= 1)
    }

    async getFinalizedHeight(): Promise<number> {
        let query = getLatestBlockQuery()
        let response: LatestBlockHeight = await this.request(query, getResultValidator(LatestBlockHeight))
        let height = parseInt(response.chain.latestBlock.header.height)
        assert(Number.isSafeInteger(height))
        return height
    }

    async getBlockHash(height: number): Promise<string | undefined> {
        let query = getBlockHashQuery(height)
        let response: GetBlockHash = await this.request(query, getResultValidator(GetBlockHash))
        return response.block?.id
    }

    async getBlockHeader(height: number): Promise<BlockHeader | undefined> {
        let query = getBlockHeaderQuery(height)
        let response: GetBlockHeader = await this.request(query, getResultValidator(GetBlockHeader))
        return response.block?.header
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

    private async getSplit(req: SplitRequest<DataRequest>): Promise<BlockData[]> {
        let first = req.range.to - req.range.from + 1
        let after = req.range.from == 0 ? undefined : req.range.from - 1
        let query = getBlocksQuery(req.request, first, after)

        let response = await this.retry(async () => {
            let response: Blocks = await this.request(query, getResultValidator(Blocks))
            let length = response.blocks.nodes.length
            if (length != first) {
                throw new BlocksConsistencyError(`Expected blocks length: ${first}, got ${length}`)
            }
            return response
        })

        let blocks = response.blocks.nodes.map(block => {
            let height = parseInt(block.header.height)
            assert(Number.isSafeInteger(height))
            return {
                hash: block.header.id,
                height,
                block
            }
        })
        return blocks
    }

    private async request<T>(
        query: string,
        validateResult: (result: unknown) => T | undefined
    ): Promise<T> {
        return this.client.graphqlRequest(query, {retryAttempts: Number.MAX_SAFE_INTEGER})
            .then(res => validateResult ? validateResult(res) : res)
    }

    private async retry<T>(request: () => Promise<T>): Promise<T> {
        let retries = 0
        let retrySchedule = [200, 500, 1000, 2000, 3000]
        while (true) {
            try {
                return await request()
            } catch(err: any) {
                if (err instanceof BlocksConsistencyError) {
                    let pause = retrySchedule[retries] || retrySchedule[retrySchedule.length - 1]
                    retries += 1
                    log.write(
                        retries >= 5 ? LogLevel.WARN : LogLevel.DEBUG,
                        `Block consistency error occured. Trying again in ${pause} ms`
                    )
                    await wait(pause)
                } else {
                    throw err
                }
            }
        }
    }
}


export class BlocksConsistencyError extends Error {
    get name(): string {
        return 'BlocksConsistencyError'
    }
}
