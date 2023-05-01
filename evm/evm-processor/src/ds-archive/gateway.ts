import {DataRequest} from '../interfaces/data-request'
import {EvmBlock, EvmLog, EvmStateDiff, EvmTrace, EvmTransaction, Qty} from '../interfaces/evm'


export interface BatchRequest extends DataRequest {
    fromBlock: number
    toBlock?: number
}


type ReplaceBigintToQty<T> = {
    [K in keyof T]: bigint extends T[K] ? Qty : T[K]
}


export type Block = Omit<ReplaceBigintToQty<EvmBlock>, 'height'> & {number: number}
export type Transaction = ReplaceBigintToQty<EvmTransaction>
export type Log = EvmLog
export type StateDiff = EvmStateDiff


type PatchTrace<T> = {
    [K in keyof T]: K extends 'action' | 'result' ? ReplaceBigintToQty<T[K]> : T[K]
}


export type Trace = PatchTrace<EvmTrace>


export interface BlockData {
    header: Block
    transactions?: Transaction[]
    logs?: Log[]
    traces?: Trace[]
    stateDiffs?: EvmStateDiff[]
}
