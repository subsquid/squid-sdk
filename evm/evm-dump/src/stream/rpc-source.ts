import {toRawBlock} from '@subsquid/evm-normalization'
import {type EvmRpcDataSource, type Rpc, toQty} from '@subsquid/evm-rpc'
import type {RpcSource} from './source'

export function createRpcSource(rpc: Rpc, dataSource: EvmRpcDataSource): RpcSource {
    return {
        getFinalizedHead: () => dataSource.getFinalizedHead(),

        async getBlockHash(number) {
            let block = await rpc.call('eth_getBlockByNumber', [toQty(number), false])
            return block?.hash
        },

        async *getBlocks(range, parentHash) {
            for await (let batch of dataSource.getFinalizedStream({...range, parentHash})) {
                yield {
                    blocks: batch.blocks.map(toRawBlock),
                    finalizedHead: batch.finalizedHead?.number,
                }
            }
        },
    }
}
