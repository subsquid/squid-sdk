import type {RpcClient} from '@subsquid/rpc-client'
import {CallOptions} from '@subsquid/rpc-client'
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
import {BlockId, Commitment} from '../base'
import {GetBlock} from './data'


export class Rpc {
    constructor(
        private client: RpcClient,
        private priority: number = 0
    ) {
    }

    call<T=any>(method: string, params?: any[], options?: CallOptions<T>): Promise<T> {
        return this.client.call(method, params, {priority: this.priority, ...options})
    }

    batchCall<T=any>(batch: {method: string, params?: any[]}[], options?: CallOptions<T>): Promise<T[]> {
        return this.client.batchCall(batch, {priority: this.priority, ...options})
    }

    async getRecentHead(commitment: Commitment): Promise<BlockId> {
        let res = await this.call('getRecentBlockhash', [{commitment}], {
            validateResult: getResultValidator(GetRecentBlockhash)
        })
        return {
            blockHash: res.value.blockhash,
            slot: res.context.slot
        }
    }

    getBlockInfo(commitment: Commitment, slot: number): Promise<null | Omit<GetBlock, 'transactions' | 'rewards'>> {
        return this.call('getBlock', [
            slot,
            {
                commitment,
                rewards: false,
                transactionDetails: 'none'
            }
        ], {
            validateResult: getResultValidator(nullable(GetBlock))
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
}


const GetRecentBlockhash = object({
    context: object({slot: NAT}),
    value: object({blockhash: B58})
})


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
