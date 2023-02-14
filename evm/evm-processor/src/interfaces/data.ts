import {Bytes32, EvmAddress, EvmBlock, EvmLog, EvmTransaction} from './evm'


export interface BlockData {
    header: EvmBlock
    items: BlockItem[]
}


export type BlockItem = LogItem | TransactionItem


export interface LogItem {
    kind: 'log'
    log: EvmLog
    transaction?: EvmTransaction
}


export interface TransactionItem {
    kind: 'transaction'
    transaction: EvmTransaction
}


export interface DataRequest {
    includeAllBlocks?: boolean
    logs?: LogItemRequest[]
    transactions?: TransactionItemRequest[]
}


export interface LogItemRequest {
    address: EvmAddress[]
    topics: EvmTopicSet
}


export type EvmTopicSet = Bytes32[][]


export interface TransactionItemRequest {
    address: EvmAddress[]
    sighash: Bytes32[]
}
