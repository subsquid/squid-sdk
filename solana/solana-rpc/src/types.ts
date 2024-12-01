import {GetBlock} from '@subsquid/solana-rpc-data'


export interface Block {
    slot: number
    block: GetBlock
    isFinal?: boolean
}


export interface DataRequest {
    rewards?: boolean
    transactions?: boolean
}
