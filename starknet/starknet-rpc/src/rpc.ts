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

export type BlockHeader = Simplify<Omit<Block, 'transactions' | 'events'>>

// TODO: list to implement in rpc:
// not a method of rpc - ingestFinalizedBlocks (around starknet_getBlockWithTxs)

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

    getBlockBatch(requests: RangeRequestList<DataRequest>): Promise<(Block | null | undefined)[]> {
        // Create an array of all block heights to fetch from the ranges
        let heights: number[] = []
        
        for (const req of requests) {
            const from = req.range.from
            const to = req.range.to ?? from // If 'to' is not specified, use 'from'
            for (let height = from; height <= to; height++) {
                heights.push(height)
            }
        }

        // Prepare the RPC calls
        let calls: RpcCall[] = new Array(heights.length)
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