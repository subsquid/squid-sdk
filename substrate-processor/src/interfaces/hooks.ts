import {Range} from "../util/range"
import {
    BlockHandlerDataRequest,
    BlockHandler,
    CallHandler,
    ContractsContractEmittedHandler,
    GearMessageEnqueuedHandler,
    GearUserMessageSentHandler,
    EventHandler,
    EvmLogHandler,
    EvmExecutedHandler,
    EvmTopicSet
} from "./dataHandlers"
import {CallDataRequest, EventDataRequest} from "./dataSelection"
import {QualifiedName} from "./substrate"


export interface BlockHook {
    handler: BlockHandler<any>
    range?: Range
    data?: BlockHandlerDataRequest
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
    triggerForFailedCalls?: boolean
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


export interface EvmExecutedHook {
    handler: EvmExecutedHandler<any>
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


export interface GearMessageEnqueuedHook {
    handler: GearMessageEnqueuedHandler<any>,
    programId: string
    data?: EventDataRequest
    range?: Range
}


export interface GearUserMessageSentHook {
    handler: GearUserMessageSentHandler<any>,
    programId: string
    data?: EventDataRequest
    range?: Range
}


export interface Hooks {
    pre: BlockHook[]
    post: BlockHook[]
    event: EventHook[]
    call: CallHook[]
    evmLog: EvmLogHook[]
    evmExecuted: EvmExecutedHook[]
    contractsContractEmitted: ContractsContractEmittedHook[]
    gearMessageEnqueued: GearMessageEnqueuedHook[]
    gearUserMessageSent: GearUserMessageSentHook[]
}
