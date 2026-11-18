import {createLogger} from '@subsquid/logger'
import {CallOptions, RetryError, RpcClient, RpcError, RpcProtocolError} from '@subsquid/rpc-client'
import {RpcCall, RpcErrorInfo} from '@subsquid/rpc-client/lib/interfaces'
import {GetBlock} from '@subsquid/solana-rpc-data'
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


/**
 * Bounded retry of `getBlock` responses that report a `-32603 Internal error`. Unlike an overload,
 * this code is also returned for permanent failures, so it is retried only a few times: an unlimited
 * retry would stall the dump on a bad slot instead of stopping it.
 */
export interface InternalErrorRetryOptions {
    /** Total attempts, including the first. `1` disables the retry. Default `5`. */
    attempts?: number
    /** Pause before each retry, in ms; the last value repeats. Default `[1000, 2000, 5000, 10000]`. */
    backoffMs?: number[]
}


export interface RpcOptions {
    internalErrorRetry?: InternalErrorRetryOptions
}


export interface RpcApi {
    getLatestBlockhash(commitment: Commitment, minContextSlot?: number): Promise<LatestBlockhash>
    getBlocks(commitment: Commitment, startSlot: number, endSlot: number): Promise<number[]>
    getBlock(slot: number, options?: GetBlockOptions): Promise<GetBlock | 'skipped' | null | undefined>
    getBlockBatch(slots: number[], options?: GetBlockOptions): Promise<(GetBlock | 'skipped' | null | undefined)[]>
}


export class Rpc implements RpcApi {
    private internalErrorAttempts: number
    private internalErrorBackoffMs: number[]

    constructor(
        public readonly client: RpcClient,
        public readonly log = createLogger('sqd:solana-rpc'),
        options: RpcOptions = {}
    ) {
        this.internalErrorAttempts = options.internalErrorRetry?.attempts ?? 5
        this.internalErrorBackoffMs = options.internalErrorRetry?.backoffMs ?? [1000, 2000, 5000, 10000]
        assert(this.internalErrorAttempts >= 1, 'internalErrorRetry.attempts must be at least 1')
        assert(this.internalErrorBackoffMs.length > 0, 'internalErrorRetry.backoffMs must not be empty')
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
        return this.retryInternalError([slot], () =>
            this.call<GetBlock | 'skipped' | null | undefined>('getBlock', options ? [slot, options] : [slot], {
                validateResult: getResultValidator(nullable(GetBlock)),
                validateError: captureNoBlockAtSlot
            })
        )
    }

    getBlockBatch(slots: number[], options?: GetBlockOptions): Promise<(GetBlock | 'skipped' | null | undefined)[]> {
        assert(
            options?.maxSupportedTransactionVersion == null ||
                options.maxSupportedTransactionVersion === 0 ||
                options.maxSupportedTransactionVersion === 1,
            'maximum supported transaction version is 1'
        )
        let call: RpcCall[] = new Array(slots.length)
        for (let i = 0; i < slots.length; i++) {
            let slot = slots[i]
            let params = options ? [slot, options] : [slot]
            call[i] = {method: 'getBlock', params}
        }
        return this.retryInternalError(slots, () =>
            this.reduceBatchOnRetry<GetBlock | 'skipped' | null | undefined>(call, {
                validateResult: getResultValidator(nullable(GetBlock)),
                validateError: captureNoBlockAtSlot
            })
        )
    }

    /**
     * Run `fn`, retrying it a bounded number of times while it fails with a `-32603 Internal error`
     * (see {@link InternalErrorRetryOptions}). Each retry is logged with the affected slots; once the
     * attempts are used up, the error is rethrown so the caller stops instead of stalling.
     */
    private async retryInternalError<T>(slots: number[], fn: () => Promise<T>): Promise<T> {
        for (let attempt = 1; ; attempt++) {
            try {
                return await fn()
            } catch (err: any) {
                if (!isInternalError(err) || attempt >= this.internalErrorAttempts) throw err
                // Retried here rather than in the client, so count it there for its metrics.
                this.client.recordRetriedError('internal')
                let pause = this.internalErrorBackoffMs[Math.min(attempt, this.internalErrorBackoffMs.length) - 1]
                this.log.warn(
                    {
                        code: err.code,
                        reason: err.message,
                        slots: slots.length > 2 ? `${slots[0]}..${slots[slots.length - 1]} (${slots.length})` : slots,
                        attempt,
                        attempts: this.internalErrorAttempts,
                    },
                    `getBlock failed with "${err.message}" (code ${err.code}), retrying in ${pause}ms`
                )
                await new Promise((resolve) => setTimeout(resolve, pause))
            }
        }
    }

    private async reduceBatchOnRetry<T=any>(batch: {method: string, params?: any[]}[], options: CallOptions<T>): Promise<T[]>  {
        if (batch.length <= 1) return this.batchCall(batch, options)

        let result = await this.batchCall(batch, {...options, retryAttempts: 0}).catch(err => {
            if (this.client.isConnectionError(err) || err instanceof RpcProtocolError) {
                // Retried here by splitting the batch, not by the client: count it for its metrics.
                this.client.recordRetriedError(this.client.getRetryKind(err))
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
}


function captureNoBlockAtSlot(info: RpcErrorInfo): 'skipped' | undefined {
    if (info.message.startsWith('Block not available for slot')) return undefined
    if (/was skipped/.test(info.message)) return 'skipped'
    // An overload is transient by definition: retry it through the client's backoff, without limit.
    // The code goes into the message so the client's retry log shows which response it was.
    if (info.code === -32603 && info.message === 'Service overloaded') {
        throw new RetryError(`${info.message} (code ${info.code})`)
    }
    // `-32603 Internal error` stays an RpcError; `Rpc.retryInternalError` retries it a bounded
    // number of times, because the same response is also returned for permanent failures.
    throw new RpcError(info)
}


function isInternalError(err: unknown): err is RpcError {
    return err instanceof RpcError && err.code === -32603 && err.message === 'Internal error'
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
