import {Commitment, GetBlockOptions} from '@subsquid/solana-rpc'
import {getServer, getServerArguments} from '@subsquid/util-internal-worker-thread'
import {createRpc} from './rpc-setup'


const url = getServerArguments<string>()
const rpc = createRpc(url)


getServer()
    .def('getLatestBlockhash', (commitment: Commitment, minContextSlot?: number) => {
        return rpc.getLatestBlockhash(commitment, minContextSlot)
    })
    .def('getBlocks', (commitment: Commitment, startSlot: number, endSlot: number) => {
        return rpc.getBlocks(commitment, startSlot, endSlot)
    })
    .def('getBlock', (slot: number, options?: GetBlockOptions) => {
        return rpc.getBlock(slot, options)
    })
    .def('getBlockBatch', (slots: number[], options?: GetBlockOptions) => {
        return rpc.getBlockBatch(slots, options)
    })
    .start()
