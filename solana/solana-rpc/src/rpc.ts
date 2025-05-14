import {CallOptions, RpcClient, RpcError, RpcProtocolError} from '@subsquid/rpc-client'
import {RpcCall, RpcErrorInfo} from '@subsquid/rpc-client/lib/interfaces'
import {GetBlock} from '@subsquid/solana-rpc-data'
import {Simplify, wait} from '@subsquid/util-internal'
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
import {Commitment} from './base'


export type BlockInfo = Simplify<Omit<GetBlock, 'transactions' | 'rewards'>>


export class Rpc {
    constructor(
        private client: RpcClient,
        private priority: number = 0,
        private maxConfirmationAttempts: number = 10
    ) {
    }

    withPriority(priority: number): Rpc {
        return new Rpc(this.client, priority, this.maxConfirmationAttempts)
    }

    call<T=any>(method: string, params?: any[], options?: CallOptions<T>): Promise<T> {
        return this.client.call(method, params, {priority: this.priority, ...options})
    }

    batchCall<T=any>(batch: {method: string, params?: any[]}[], options?: CallOptions<T>): Promise<T[]> {
        return this.client.batchCall(batch, {priority: this.priority, ...options})
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

    getBlockInfo(commitment: Commitment, slot: number): Promise<undefined | null | BlockInfo> {
        return this.call('getBlock', [
            slot,
            {
                commitment,
                rewards: false,
                transactionDetails: 'none'
            }
        ], {
            validateResult: getResultValidator(nullable(GetBlock)),
            validateError: captureNoBlockAtSlot
        })
    }

    async getTopSlot(commitment: Commitment): Promise<number> {
        let {context: {slot}} = await this.getLatestBlockhash(commitment)
        return slot
    }

    async getFinalizedBlockInfo(slot: number): Promise<BlockInfo> {
        let attempts = this.maxConfirmationAttempts
        while (attempts) {
            let block = await this.getBlockInfo('finalized', slot)
            if (block) return block
            await wait(100)
            attempts -= 1
        }
        throw new Error(`Failed to getBlock with finalized commitment at slot ${slot} 10 times in a row`)
    }

    async getFinalizedBlockHeight(slot: number): Promise<number> {
        let block = await this.getFinalizedBlockInfo(slot)
        if (block.blockHeight == null) {
            throw new Error(`Block height is not available at slot ${slot}`)
        } else {
            return block.blockHeight
        }
    }

    async getFinalizedHeight(): Promise<number> {
        let slot = await this.getTopSlot('finalized')
        return this.getFinalizedBlockHeight(slot)
    }

    getBlockBatch(slots: number[], options?: GetBlockOptions): Promise<(GetBlock | null | undefined)[]> {
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
        return this.reduceBatchOnRetry(call, {
            validateResult: getResultValidator(nullable(GetBlock)),
            validateError: captureNoBlockAtSlot
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


function captureNoBlockAtSlot(info: RpcErrorInfo): undefined {
    if (/slot \d+/i.test(info.message)) return undefined
    throw new RpcError(info)
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
