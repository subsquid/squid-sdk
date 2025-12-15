import {createLogger} from '@subsquid/logger'
import {CallOptions, RetryError, RpcClient, RpcError, RpcProtocolError} from '@subsquid/rpc-client'
import {RpcCall, RpcErrorInfo, RpcRequest} from '@subsquid/rpc-client/lib/interfaces'
import {GetBlock, isVoteTransaction} from '@subsquid/solana-rpc-data'
import {assertNotNull} from '@subsquid/util-internal'
import {
    array,
    B58,
    DataValidationError,
    GetSrcType,
    NAT,
    nullable,
    object,
    Validator
} from '@subsquid/util-internal-validation'
import assert from 'assert'


export type Commitment = 'finalized' | 'confirmed'


const LatestBlockhash = object({
    context: object({
        slot: NAT
    }),
    value: object({
        blockhash: B58,
        lastValidBlockHeight: NAT
    })
})


export type LatestBlockhash = GetSrcType<typeof LatestBlockhash>


export interface GetBlockOptions {
    commitment?: Commitment
    transactionDetails?: 'full' | 'none'
    maxSupportedTransactionVersion?: number
    rewards?: boolean
}


export interface RpcApi {
    getLatestBlockhash(commitment: Commitment, minContextSlot?: number): Promise<LatestBlockhash>
    getBlocks(commitment: Commitment, startSlot: number, endSlot: number): Promise<number[]>
    getBlock(slot: number, options?: GetBlockOptions): Promise<GetBlock | 'skipped' | null | undefined>
    getBlockBatch(slots: number[], options?: GetBlockOptions): Promise<(GetBlock | 'skipped' | null | undefined)[]>
}


export class Rpc implements RpcApi {
    private requests: ThresholdRequests

    constructor(
        public readonly client: RpcClient,
        public readonly txThreshold?: number,
        public readonly log = createLogger('sqd:solana-rpc'),
    ) {
        if (this.txThreshold != null) {
            assert(this.txThreshold > 0)
        }
        this.requests = new ThresholdRequests()
    }

    call<T=any>(method: string, params?: any[], options?: CallOptions<T>): Promise<T> {
        return this.client.call(method, params, options)
    }

    batchCall<T=any>(batch: {method: string, params?: any[]}[], options?: CallOptions<T>): Promise<T[]> {
        return this.client.batchCall(batch, options)
    }

    getLatestBlockhash(commitment: Commitment, minContextSlot?: number): Promise<LatestBlockhash> {
        return this.call('getLatestBlockhash', [{commitment, minContextSlot}], {
            validateResult: getResultValidator(LatestBlockhash)
        })
    }

    getBlocks(commitment: Commitment, startSlot: number, endSlot: number): Promise<number[]> {
        return this.call('getBlocks', [
            startSlot,
            endSlot,
            {commitment}
        ], {
            validateResult: getResultValidator(array(NAT))
        })
    }

    getBlocksWithLimit(commitment: Commitment, startSlot: number, limit: number): Promise<number[]> {
        return this.call('getBlocksWithLimit', [
            startSlot,
            limit,
            {commitment}
        ], {
            validateResult: getResultValidator(array(NAT))
        })
    }

    getBlock(slot: number, options?: GetBlockOptions): Promise<GetBlock | 'skipped' | null | undefined> {
        return this.call<GetBlock | 'skipped' | null | undefined>('getBlock', options ? [slot, options] : [slot], {
            validateResult: getResultValidator(nullable(GetBlock)),
            validateError: captureNoBlockAtSlot
        })
    }

    getBlockBatch(slots: number[], options?: GetBlockOptions): Promise<(GetBlock | 'skipped' | null | undefined)[]> {
        assert(
            options?.maxSupportedTransactionVersion == null || options.maxSupportedTransactionVersion === 0,
            'maximum supported transaction version is 0'
        )
        let call: RpcCall[] = new Array(slots.length)
        for (let i = 0; i < slots.length; i++) {
            let slot = slots[i]
            let params = options ? [slot, options] : [slot]
            call[i] = {method: 'getBlock', params}
        }
        return this.reduceBatchOnRetry<GetBlock | 'skipped' | null | undefined>(call, {
            validateResult: (result, req) => this.validateGetBlockResult(result, req),
            validateError: captureNoBlockAtSlot
        })
    }

    private async reduceBatchOnRetry<T=any>(batch: {method: string, params?: any[]}[], options: CallOptions<T>): Promise<T[]>  {
        if (batch.length <= 1) return this.batchCall(batch, options)

        let result = await this.batchCall(batch, {...options, retryAttempts: 0}).catch(err => {
            if (this.client.isConnectionError(err) || err instanceof RpcProtocolError) {
                this.log.warn(err, 'will retry request with reduced batch')
            } else {
                throw err
            }
        })

        if (result != null) return result

        let pack = await Promise.all([
            this.reduceBatchOnRetry(batch.slice(0, Math.ceil(batch.length / 2)), options),
            this.reduceBatchOnRetry(batch.slice(Math.ceil(batch.length / 2)), options),
        ])

        return pack.flat()
    }

    validateGetBlockResult(result: unknown, req: RpcRequest) {
        let validator = getResultValidator(nullable(GetBlock))
        let block = validator(result)
        if (this.txThreshold && block != null && block.transactions != null) {
            let transactions = block.transactions.filter(tx => !isVoteTransaction(tx))
            if (transactions.length < this.txThreshold) {
                let slot = req.params![0] as any as number
                let retries = this.requests.get(slot)
                if (retries < 3) {
                    this.requests.inc(slot)
                    throw new RetryError(`transactions count is less than threshold: ${transactions.length} < ${this.txThreshold}`)
                }
            }
        }
        return block
    }
}


function captureNoBlockAtSlot(info: RpcErrorInfo): 'skipped' | undefined {
    if (info.message.startsWith('Block not available for slot')) return undefined
    if (/was skipped/.test(info.message)) return 'skipped'
    throw new RpcError(info)
}


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


class ThresholdRequests {
    inner: Map<number, number>

    constructor() {
        this.inner = new Map()
    }

    inc(slot: number) {
        if (this.inner.size > 100) {
            let keys = this.inner.keys()
            for (let i = 0; i < 20; i++) {
                let res = keys.next()
                this.inner.delete(assertNotNull(res.value))
            }
        }
        let val = this.inner.get(slot) ?? 0
        this.inner.set(slot, val + 1)
    }

    get(slot: number) {
        return this.inner.get(slot) ?? 0
    }
}
