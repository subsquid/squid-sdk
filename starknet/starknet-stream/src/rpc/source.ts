import {Hash32, BlockHeader, Rpc} from '@subsquid/starknet-rpc'
import {addErrorContext, wait} from '@subsquid/util-internal'
import {getRequestAt, mapRangeRequestList, RangeRequestList} from '@subsquid/util-internal-range'
import {PartialBlock} from '../data/data-partial'
import {DataRequest} from '../data/data-request'
import type {RpcSettings} from '../source'
import {mapBlock} from './mapping'


export class RpcDataSource {
    private rpc: Rpc

    constructor(private options: RpcSettings) {
        this.rpc = new Rpc(options.client)
    }

    getFinalizedHeight(): Promise<number> {
        return this.rpc.getFinalizedHeight()
    }

    async getBlockHeader(height: number): Promise<BlockHeader | undefined> {
        let attempts = 10
        while (attempts) {
            let block = await this.rpc.getBlockHeader(height)
            if (block || block === undefined) return block
            await wait(100)
            attempts -= 1
        }
        throw new Error(`Failed to getBlock with finalized commitment at height ${height} 10 times in a row`)
    }

    async getBlockHash(height: number): Promise<Hash32 | undefined> {
        let headHeight = await this.rpc.getFinalizedHeight()
        if (headHeight < height) return
        let block = await this.rpc.getBlockHeader(height)
        return block.block_hash
    }

    async *getBlockStream(
        requests: RangeRequestList<DataRequest>,
        stopOnHead?: boolean | undefined
    ): AsyncIterable<PartialBlock[]> {
        let blockStream = this.rpc.ingestFinalizedBlocks({
            requests: toRpcRequests(requests),
            stopOnHead,
        })

        for await (let batch of blockStream) {
            let req = getRequestAt(requests, batch[0].height) || {}
            yield batch.map(block => {
                try {
                    return mapBlock(block, req)
                } catch(err: any) {
                    throw addErrorContext(err, {
                        blockHash: block.hash,
                        blockHeight: block.height
                    })
                }
            })
        }
    }
}


function toRpcRequests(requests: RangeRequestList<DataRequest>) {
    return mapRangeRequestList(requests, req => {
        return req
    })
}