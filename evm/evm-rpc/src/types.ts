import {GetBlock} from './rpc-data'


export interface Block {
    number: number
    block: GetBlock
}


export interface DataRequest {
    transactions?: boolean
}
