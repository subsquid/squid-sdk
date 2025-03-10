import {CallOptions, RpcClient, RpcError, RpcProtocolError} from '@subsquid/rpc-client'
import {Block} from '@subsquid/starknet-data'
import {Simplify, wait} from '@subsquid/util-internal'
import {RpcCall, RpcErrorInfo} from '@subsquid/rpc-client/lib/interfaces'
import {
    DataValidationError,
    GetSrcType,
    nullable,
    Validator
} from '@subsquid/util-internal-validation'
import {RangeRequestList, SplitRequest} from '@subsquid/util-internal-range'
import {Batch, coldIngest} from '@subsquid/util-internal-ingest-tools'
import {DataRequest} from './base'

export type BlockHeader = Simplify<Omit<Block, 'transactions' | 'events'>>

export interface IngestOptions {
    stopOnHead?: boolean
    headPollInterval: number
    splitSize: number
    concurrency: number
};

export class Rpc {
    constructor(
        private client: RpcClient,
        private priority: number,
    ) {
    }

    withPriority(priority: number): Rpc {
        return new Rpc(this.client, priority)
    }

    call<T=any>(method: string, params?: any[], options?: CallOptions<T>): Promise<T> {
        return this.client.call(method, params, {priority: this.priority, ...options})
    }

    batchCall<T=any>(batch: {method: string, params?: any[]}[], options?: CallOptions<T>): Promise<T[]> {
        return this.client.batchCall(batch, {priority: this.priority, ...options})
    }

    getFinalizedHeight(): Promise<number> {
        return this.call('starknet_blockNumber')
    }

    getBlockHeader(height: number): Promise<BlockHeader> {
        return this.call('starknet_getBlockWithTxHashes', [{block_number: height}], {
            validateResult: getResultValidator(Block),
            validateError: captureBlockNotFound
        })
    }

    getBlockBatch(heights: number[]): Promise<(Block | null | undefined)[]> {
        // Prepare the RPC calls
        let calls: {method: string, params?: any[]}[] = new Array(heights.length)
        for (let i = 0; i < heights.length; i++) {
            calls[i] = {
                method: 'starknet_getBlockWithReceipts',
                params: [{ block_number: heights[i] }]
            }
        }

        return this.reduceBatchOnRetry(calls, {
            validateResult: getResultValidator(nullable(Block)),
            validateError: captureBlockNotFound
        })
    }

    private async reduceBatchOnRetry<T=any>(batch: {method: string, params?: any[]}[], options: CallOptions<T>): Promise<T[]>  {
        if (batch.length <= 1) return this.batchCall(batch, options)

        let result = await this.batchCall(batch, {...options, retryAttempts: 0}).catch(err => {
            if (this.client.isConnectionError(err) || err instanceof RpcProtocolError) return
            throw err
        })

        if (result) return result

        let pack = await Promise.all([
            this.reduceBatchOnRetry(batch.slice(0, Math.ceil(batch.length / 2)), options),
            this.reduceBatchOnRetry(batch.slice(Math.ceil(batch.length / 2)), options),
        ])

        return pack.flat()
    }
    
    ingestFinalizedBlocks(requests: RangeRequestList<DataRequest>, options: IngestOptions): AsyncIterable<Batch<Block>> {
        return coldIngest({
            getFinalizedHeight: () => this.getFinalizedHeight(),
            getSplit: (req) => this.getSplitBlocks(req),
            requests: requests,
            concurrency: options.concurrency,
            splitSize: options.splitSize,
            stopOnHead: options.stopOnHead,
            headPollInterval: options.headPollInterval
        });
    }

    private async getSplitBlocks(req: SplitRequest<DataRequest>): Promise<Block[]> {
        const heights: number[] = [];
        for (let height = req.range.from; height <= req.range.to; height++) {
            heights.push(height);
        }
    
        const blocks = await this.getBlockBatch(heights);
    
        return blocks.filter((block): block is Block => block != null);
    }
}

export function getResultValidator<V extends Validator>(validator: V): (result: unknown) => GetSrcType<V> {
    return function(result: unknown) {
        let err = validator.validate(result)
        if (err) {
            throw new DataValidationError(`server returned unexpected result: ${err.toString()}`)
        } else {
            return result as any
        }
    }
}

function captureBlockNotFound(info: RpcErrorInfo): undefined {
    if (/Block not found/i.test(info.message)) return undefined
    throw new RpcError(info)
}