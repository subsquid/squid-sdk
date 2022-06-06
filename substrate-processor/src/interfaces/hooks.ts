import {Range} from "../util/range"
import {
    BlockHandler,
    CallHandler,
    ContractsContractEmittedHandler,
    EventHandler,
    EvmLogHandler,
    EvmTopicSet
} from "./dataHandlers"
import {CallDataRequest, EventDataRequest} from "./dataSelection"
import {QualifiedName} from "./substrate"


export interface BlockHook {
    handler: BlockHandler<any>
    range?: Range
}


export interface EventHook {
    handler: EventHandler<any>
    event: QualifiedName
    data?: EventDataRequest
    range?: Range
}


export interface CallHook {
    handler: CallHandler<any>
    call: QualifiedName
    failures?: boolean
    data?: CallDataRequest
    range?: Range
}


export interface EvmLogHook {
    handler: EvmLogHandler<any>
    contractAddress: string
    filter?: EvmTopicSet[]
    data?: EventDataRequest
    range?: Range
}


export interface ContractsContractEmittedHook {
    handler: ContractsContractEmittedHandler<any>,
    contractAddress: string
    data?: EventDataRequest
    range?: Range
}


export interface Hooks {
    pre: BlockHook[]
    post: BlockHook[]
    event: EventHook[]
    call: CallHook[]
    evmLog: EvmLogHook[]
    contractsContractEmitted: ContractsContractEmittedHook[]
}
