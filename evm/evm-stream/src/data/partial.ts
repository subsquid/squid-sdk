import type {MakePartial} from './type-util'
import type {EvmBlockHeader, EvmTransaction, EvmLog, EvmTrace, EvmStateDiff} from './evm'

export type BlockRequiredFields = 'number' | 'height' | 'hash' | 'parentHash'
export type TransactionRequiredFields = 'transactionIndex'
export type LogRequiredFields = 'logIndex' | 'transactionIndex'
export type TraceRequiredFields = 'transactionIndex' | 'traceAddress' | 'type'
export type StateDiffRequiredFields = 'transactionIndex' | 'address' | 'key'

export type PartialBlockHeader = MakePartial<EvmBlockHeader, BlockRequiredFields>
export type PartialTransaction = MakePartial<EvmTransaction, TransactionRequiredFields>
export type PartialLog = MakePartial<EvmLog, LogRequiredFields>
export type PartialTrace = MakePartial<EvmTrace, TraceRequiredFields>
export type PartialStateDiff = MakePartial<EvmStateDiff, StateDiffRequiredFields>

export interface PartialBlock {
    header: PartialBlockHeader
    transactions: PartialTransaction[]
    logs: PartialLog[]
    traces: PartialTrace[]
    stateDiffs: PartialStateDiff[]
}
