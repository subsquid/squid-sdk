import {Base58Bytes, BlockInfo, findSlot, GetBlock, ingestFinalizedBlocks, Rpc} from '@subsquid/solana-rpc'
import {addErrorContext, wait} from '@subsquid/util-internal'
import {getRequestAt, mapRangeRequestList, RangeRequestList} from '@subsquid/util-internal-range'
import {PartialBlock} from '../data/partial'
import {DataRequest} from '../data/request'
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

    async getBlockInfo(slot: number): Promise<BlockInfo | undefined> {
        let attempts = 10
        while (attempts) {
            let block = await this.rpc.getBlockInfo('finalized', slot)
            if (block || block === undefined) return block
            await wait(100)
            attempts -= 1
        }
        throw new Error(`Failed to getBlock with finalized commitment at slot ${slot} 10 times in a row`)
    }

    async getBlockHash(height: number): Promise<Base58Bytes | undefined> {
        let headSlot = await this.rpc.getTopSlot('finalized')
        let top = {
            slot: headSlot,
            height: await this.rpc.getFinalizedBlockHeight(headSlot)
        }
        if (top.height < height) return
        let bottom = {slot: 0, height: 0}
        let slot = await findSlot(this.rpc, height, bottom, top)
        let block = await this.rpc.getFinalizedBlockInfo(slot)
        return block.blockhash
    }

    async *getBlockStream(
        requests: RangeRequestList<DataRequest>,
        stopOnHead?: boolean | undefined
    ): AsyncIterable<PartialBlock[]> {
        let blockStream = ingestFinalizedBlocks({
            requests: toRpcRequests(requests),
            stopOnHead,
            rpc: this.rpc,
            headPollInterval: 5_000,
            strideSize: this.options.strideSize ?? 5,
            strideConcurrency: this.options.strideConcurrency ?? 10
        })

        for await (let batch of blockStream) {
            let req = getRequestAt(requests, batch[0].height) || {}
            yield batch.map(block => {
                try {
                    return mapBlock(block, req)
                } catch(err: any) {
                    throw addErrorContext(err, {
                        blockHash: block.hash,
                        blockHeight: block.height,
                        blockSlot: block.slot
                    })
                }
            })
        }
    }
}


function toRpcRequests(requests: RangeRequestList<DataRequest>) {
    return mapRangeRequestList(requests, req => {
        let rewards = req.rewards?.length
        let transactions = req.instructions?.length
            || req.transactions?.length
            || req.tokenBalances?.length
            || req.balances?.length
            || req.logs?.length
        return {
            rewards: !!rewards,
            transactions: !!transactions
        }
    })
}
