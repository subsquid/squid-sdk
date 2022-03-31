import {Range} from "../util/range"
import {BlockHandler, CallHandler, EventHandler} from "./dataHandlerContext"
import {ContextRequest} from "./dataSelection"
import {EvmLogHandler, EvmTopicSet} from "./evm"
import {QualifiedName} from "./substrate"


export interface BlockHook {
    handler: BlockHandler
    range?: Range
}


export interface EventHook {
    handler: EventHandler
    event: QualifiedName
    data?: ContextRequest
    range?: Range
}


export interface CallHook {
    handler: CallHandler
    call: QualifiedName
    failures?: boolean
    data?: ContextRequest
    range?: Range
}


export interface EvmLogHook {
    handler: EvmLogHandler
    contractAddress: string
    filter?: EvmTopicSet[]
    range?: Range
}


export interface Hooks {
    pre: BlockHook[]
    post: BlockHook[]
    event: EventHook[]
    call: CallHook[]
    evmLog: EvmLogHook[]
}
