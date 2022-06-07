import type {Logger} from "@subsquid/logger"
import type {Chain} from "../chain"
import type {Range} from "../util/range"
import type {
    BlockDataRequest,
    BlockItems,
    CallData,
    CallDataRequest,
    ContractsContractEmittedEventData,
    EventData,
    EventDataRequest,
    EvmLogEventData,
    WithProp
} from "./dataSelection"
import type {SubstrateBlock} from "./substrate"


export interface CommonHandlerContext<S> {
    /**
     * Not yet public description of chain metadata
     * @internal
     */
    _chain: Chain
    log: Logger
    store: S
    block: SubstrateBlock
}


export type BlockHandlerContext<S, R extends BlockDataRequest = {}>
    = CommonHandlerContext<S> & WithProp<'items', BlockItems<R['items']>>


export interface BlockHandler<S, R extends BlockDataRequest = {}> {
    (ctx: BlockHandlerContext<S, R>): Promise<void>
}


export type EventHandlerContext<S, R extends EventDataRequest = {event: true}>
    = CommonHandlerContext<S> & EventData<R>


export interface EventHandler<S, R extends EventDataRequest = {event: true}> {
    (ctx: EventHandlerContext<S, R>): Promise<void>
}


export type CallHandlerContext<S, R extends CallDataRequest = {call: true, extrinsic: true}>
    = CommonHandlerContext<S> & CallData<R>


export interface CallHandler<S, R extends CallDataRequest = {call: true, extrinsic: true}> {
    (ctx: CallHandlerContext<S, R>): Promise<void>
}


export type EvmLogHandlerContext<S, R extends EventDataRequest = {event: true}>
    = CommonHandlerContext<S> & EvmLogEventData<R>


export interface EvmLogHandler<S, R extends EventDataRequest = {event: true}> {
    (ctx: EvmLogHandlerContext<S,  R>): Promise<void>
}


export interface BlockRangeOption {
    range?: Range
}


export interface EvmLogOptions extends BlockRangeOption {
    /**
     * EVM topic filter as defined by https://docs.ethers.io/v5/concepts/events/#events--filters
     */
    filter?: EvmTopicSet[]
}


export type EvmTopicSet = string | null | undefined | string[]


export type ContractsContractEmittedHandlerContext<S, R extends EventDataRequest = {event: true}>
    = CommonHandlerContext<S> & ContractsContractEmittedEventData<R>


export interface ContractsContractEmittedHandler<S, R extends EventDataRequest = {event: true}> {
    (ctx: ContractsContractEmittedHandlerContext<S, R>): Promise<void>
}
