import type {Logger} from "@subsquid/logger"
import type {Chain} from "../chain"
import type {Range} from "../util/range"
import type {
    CallFields,
    ContextRequest,
    ContractsContractEmittedFields,
    EventFields,
    EvmLogFields,
    ExtrinsicFields
} from "./dataSelection"
import type {SubstrateBlock} from "./substrate"


export interface BlockHandlerContext<S> {
    /**
     * Not yet public description of chain metadata
     * @internal
     */
    _chain: Chain
    log: Logger
    store: S
    block: SubstrateBlock
}


export interface BlockHandler<S> {
    (ctx: BlockHandlerContext<S>): Promise<void>
}


export type EventHandlerContext<S, R extends ContextRequest = {event: true}> = BlockHandlerContext<S> & {
    event: EventFields<R>
}


export interface EventHandler<S, R extends ContextRequest = {event: true}> {
    (ctx: EventHandlerContext<S, R>): Promise<void>
}


export type CallHandlerContext<S, R extends ContextRequest = {call: true, extrinsic: true}> = BlockHandlerContext<S> & {
    call: CallFields<R>
    extrinsic: ExtrinsicFields<R>
}


export interface CallHandler<S, R extends ContextRequest = {call: true, extrinsic: true}> {
    (ctx: CallHandlerContext<S, R>): Promise<void>
}


export type EvmLogHandlerContext<S, R extends ContextRequest = {event: true}> = BlockHandlerContext<S> & {
    event: EvmLogFields<R>
}


export interface EvmLogHandler<S, R extends ContextRequest = {event: true}> {
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


export type ContractsContractEmittedHandlerContext<S, R extends ContextRequest = {event: true}> = BlockHandlerContext<S> & {
    event: ContractsContractEmittedFields<R>
}


export interface ContractsContractEmittedHandler<S, R extends ContextRequest = {event: true}> {
    (ctx: ContractsContractEmittedHandlerContext<S, R>): Promise<void>
}
