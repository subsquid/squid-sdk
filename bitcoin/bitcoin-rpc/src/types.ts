import {
    GetBlock,
} from './rpc-data'
import { BareHex } from './validators'

export type BareHex32 = BareHex

export interface Block {
    number: number
    hash: BareHex32
    block: GetBlock
}


export interface DataRequest {
    transactions?: boolean
}
