import {Base58Bytes} from '@subsquid/solana-rpc-data'


export interface BlockHeader {
    slot: number
    hash: Base58Bytes
    parentSlot: number
    parentHash: Base58Bytes
}


export interface Block extends BlockHeader {
    jsonLine: string
}
