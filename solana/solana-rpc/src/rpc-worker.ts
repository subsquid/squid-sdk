import {RpcClient} from '@subsquid/rpc-client'
import {removeVoteTransactions} from '@subsquid/solana-rpc-data'
import {getServer, getServerArguments} from '@subsquid/util-internal-worker-thread'
import {Commitment, GetBlockOptions, Rpc} from './rpc'
import type {RemoteRpcOptions} from './rpc-remote'


const {noVotes, txThreshold, ...rpcOptions} = getServerArguments<RemoteRpcOptions>()

const rpc = new Rpc(new RpcClient({
    ...rpcOptions,
    fixUnsafeIntegers: true
}), txThreshold)


getServer()
    .def('getLatestBlockhash', (commitment: Commitment, minContextSlot?: number) => {
        return rpc.getLatestBlockhash(commitment, minContextSlot)
    })
    .def('getBlocks', (commitment: Commitment, startSlot: number, endSlot: number) => {
        return rpc.getBlocks(commitment, startSlot, endSlot)
    })
    .def('getBlock', (slot: number, options?: GetBlockOptions) => {
        return rpc.getBlock(slot, options).then(block => {
            if (noVotes && block && block !== 'skipped') {
                removeVoteTransactions(block)
            }
            return block
        })
    })
    .def('getBlockBatch', (slots: number[], options?: GetBlockOptions) => {
        return rpc.getBlockBatch(slots, options).then(batch => {
            if (noVotes) {
                for (let block of batch) {
                    if (block && block !== 'skipped') {
                        removeVoteTransactions(block)
                    }
                }
            }
            return batch
        })
    })
    .start()
