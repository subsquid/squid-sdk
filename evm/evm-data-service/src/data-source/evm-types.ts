import {GetBlock} from './evm-rpc-data'
import {BlockRef} from '@subsquid/util-internal-data-source'

export interface Block {
    number: number
    block: GetBlock
}

export function getBlockRef(block: Block): BlockRef {
    return {
        number: block.number,
        hash: block.block.hash
    }
}

export interface DataRequest {
    transactions?: boolean
}
