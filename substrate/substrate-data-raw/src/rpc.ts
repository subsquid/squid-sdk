import {CallOptions, RpcClient, RpcError} from '@subsquid/rpc-client'
import {RpcErrorInfo} from '@subsquid/rpc-client/lib/interfaces'
import {BlockHeader, Bytes, GetBlockResult, Hash, RuntimeVersion} from './interfaces'
import {toQty} from './util'


export class Rpc {
    constructor(
        public readonly client: RpcClient,
        public readonly options: CallOptions = {}
    ) {}

    withPriority(priority: number): Rpc {
        return new Rpc(this.client, {
            ...this.options,
            priority
        })
    }

    call<T=any>(method: string, params?: any[], options?: CallOptions<T>): Promise<T> {
        return this.client.call(method, params, {...this.options, ...options})
    }

    batchCall<T=any>(batch: {method: string, params?: any[]}[], options?: CallOptions<T>): Promise<T[]> {
        return this.client.batchCall(batch, {...this.options, ...options})
    }

    getFinalizedHead(): Promise<Hash> {
        return this.call('chain_getFinalizedHead')
    }

    getHead(): Promise<Hash> {
        return this.call('chain_getHead')
    }

    getBlockHash(height: number): Promise<Hash | null> {
        return this.call('chain_getBlockHash', [toQty(height)])
    }

    getBlockHeader(blockHash?: Hash): Promise<BlockHeader | null> {
        return this.call('chain_getHeader', [blockHash])
    }

    getBlock(blockHash: Hash): Promise<GetBlockResult | null> {
        return this.call('chain_getBlock', [blockHash])
    }

    getRuntimeVersion(blockHash: Hash): Promise<RuntimeVersion | undefined> {
        return this.call('state_getRuntimeVersion', [blockHash], {
            validateError: captureMissingBlock
        })
    }

    getMetadata(blockHash: Hash): Promise<Bytes | undefined> {
        return this.call('state_getMetadata', [blockHash], {
            validateError: captureMissingBlock
        })
    }

    getStorage(key: Bytes, blockHash: Hash): Promise<Bytes | null | undefined> {
        return this.call('state_getStorageAt', [key, blockHash], {
            validateError: captureMissingBlock
        })
    }

    getStorageMany(query: [key: Bytes, blockHash: Hash][]): Promise<(Bytes | null | undefined)[]> {
        let call = query.map(q => ({
            method: 'state_getStorageAt',
            params: q
        }))
        return this.batchCall(call, {
            validateError: captureMissingBlock
        })
    }
}


export function captureMissingBlock(info: RpcErrorInfo): undefined {
    if (isMissingBlockError(info)) {
        return undefined
    } else {
        throw new RpcError(info)
    }
}


export function isMissingBlockError(info: RpcErrorInfo): boolean {
    return info.message.includes(' not found')
}
