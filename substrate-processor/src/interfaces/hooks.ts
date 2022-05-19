import {Range} from "../util/range"
import {BlockHandler, CallHandler, EventHandler} from "./dataHandlerContext"
import {ContextRequest} from "./dataSelection"
import {EvmLogHandler, EvmTopicSet} from "./evm"
import {ContractsEventHandler, ContractAddress} from "./contracts"
import {QualifiedName} from "./substrate"


export interface BlockHook {
    handler: BlockHandler<any>
    range?: Range
}


export interface EventHook {
    handler: EventHandler<any>
    event: QualifiedName
    data?: ContextRequest
    range?: Range
}


export interface CallHook {
    handler: CallHandler<any>
    call: QualifiedName
    failures?: boolean
    data?: ContextRequest
    range?: Range
}


export interface EvmLogHook {
    handler: EvmLogHandler<any>
    contractAddress: string
    filter?: EvmTopicSet[]
    range?: Range
}


export interface ContractsEvent {
    handler: ContractsEventHandler<any>,
    contractAddress: ContractAddress
    data?: ContextRequest
    range?: Range
}


export interface Hooks {
    pre: BlockHook[]
    post: BlockHook[]
    event: EventHook[]
    call: CallHook[]
    evmLog: EvmLogHook[]
    contractsEvent: ContractsEvent[]
}
