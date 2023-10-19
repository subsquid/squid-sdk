import {CallOptions, RpcClient} from '@subsquid/rpc-client'
import {
    BlockData,
    BlockHeader,
    Bytes,
    DataRequest,
    GetBlockResult,
    Hash,
    PartialGetBlockResult,
    RuntimeVersion
} from './interfaces'
import {qty2Int, toQty} from './util'


export class Rpc {
    constructor(
        public readonly client: RpcClient,
        private options: CallOptions = {}
    ) {}

    withPriority(priority: number): Rpc {
        return this.withOptions({
            ...this.options,
            priority
        })
    }

    withOptions(options: CallOptions): Rpc {
        return new Rpc(this.client, options)
    }

    getFinalizedHead(): Promise<Hash> {
        return this.call('chain_getFinalizedHead')
    }

    getHead(): Promise<Hash> {
        return this.call('chain_getHead')
    }

    getBlockHash(height: number): Promise<Hash> {
        return this.call('chain_getBlockHash', [toQty(height)])
    }

    getBlockHeader(hash: Hash): Promise<BlockHeader> {
        return this.call('chain_getHeader', [hash])
    }

    getBlock(hash: Hash): Promise<GetBlockResult> {
        return this.call('chain_getBlock', [hash])
    }

    getRuntimeVersion(blockHash: Hash): Promise<RuntimeVersion> {
        return this.call('state_getRuntimeVersion', [blockHash])
    }

    getMetadata(blockHash: Hash): Promise<Bytes> {
        return this.call('state_getMetadata', [blockHash])
    }

    getStorage(blockHash: Hash, key: Bytes): Promise<Bytes> {
        return this.call('state_getStorageAt', [key, blockHash])
    }

    async getBlock0(hash: Hash, req?: DataRequest): Promise<BlockData> {
        let block: PartialGetBlockResult
        if (req?.extrinsics) {
            block = await this.getBlock(hash)
        } else {
            let header = await this.getBlockHeader(hash)
            block = {block: {header}}
        }
        return {
            hash,
            height: qty2Int(block.block.header.number),
            block
        }
    }

    call(method: string, params?: any[]): Promise<any> {
        return this.client.call(method, params, this.options)
    }

    batchCall(batch: {method: string, params?: any[]}[]): Promise<any[]> {
        return this.client.batchCall(batch, this.options)
    }
}
