import {RpcClient} from '@subsquid/rpc-client'
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
        private client: RpcClient,
        private priority = 0
    ) {}

    withPriority(priority: number): Rpc {
        return new Rpc(this.client, priority)
    }

    getFinalizedHead(): Promise<Hash> {
        return this.call('chain_getFinalizedHead')
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
        return this.client.call(method, params, {
            priority: this.priority
        })
    }

    batchCall(batch: {method: string, params?: any[]}[]): Promise<any[]> {
        return this.client.batchCall(batch, {
            priority: this.priority
        })
    }
}
