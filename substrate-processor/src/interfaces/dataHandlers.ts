import {Logger} from '@subsquid/logger'
import {Chain} from '../chain'
import {Range} from '../util/range'
import {
    CallData,
    CallDataRequest,
    CallItem,
    EventData,
    EventDataRequest,
    EventItem,
    EventRequest
} from './dataSelection'
import {SubstrateBlock} from './substrate'


export interface CommonHandlerContext<S> {
    /**
     * Not yet public description of chain metadata
     * @internal
     */
    _chain: Chain

    /**
     * A built-in logger to be used in mapping handlers. Supports trace, debug, warn, error, fatal
     * levels.
     */
    log: Logger

    store: S
    block: SubstrateBlock
}


type BlockEventsRequest = {
    [name in string]?: boolean | {event: EventRequest}
}


type BlockEventItem<R> = R extends true
    ? EventItem<string, true>
    : R extends BlockEventsRequest
        ? ["*"] extends [keyof R]
            ? [keyof R] extends ["*"]
                ? EventItem<string, R["*"]>
                : { [N in keyof R]: EventItem<N, R[N]> }[keyof R]
            : { [N in keyof R]: EventItem<N, R[N]> }[keyof R] | EventItem<"*">
        : EventItem<string>


type BlockCallsRequest = {
    [name in string]?: boolean | CallDataRequest
}


type BlockCallItem<R> = R extends true
    ? CallItem<string, true>
    : R extends BlockCallsRequest
        ? ["*"] extends [keyof R]
            ? [keyof R] extends ["*"]
                ? CallItem<string, R["*"]>
                : { [N in keyof R]: CallItem<N, R[N]> }[keyof R]
            : { [N in keyof R]: CallItem<N, R[N]> }[keyof R] | CallItem<"*">
        : CallItem<string>


interface BlockItemRequest {
    events?: boolean | BlockEventsRequest
    calls?: boolean | BlockCallsRequest
}


type BlockItem<R> = R extends true
    ? BlockEventItem<true> | BlockCallItem<true>
    : R extends BlockItemRequest
        ? BlockEventItem<R['events']> | BlockCallItem<['calls']>
        : BlockEventItem<false> | BlockCallItem<false>


export interface BlockHandlerDataRequest {
    includeAllBlocks?: boolean
    items?: boolean | BlockItemRequest
}


export type BlockHandlerContext<S, R extends BlockHandlerDataRequest = {}> = CommonHandlerContext<S> & {
    /**
     * A unified log of events and calls.
     *
     * All events deposited within a call are placed
     * before the call. All child calls are placed before the parent call.
     * List of block events is a subsequence of unified log.
     */
    items: BlockItem<R["items"]>[]
}


export interface BlockHandler<S, R extends BlockHandlerDataRequest = {}> {
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
    = CommonHandlerContext<S> & EventData<R, 'EVM.Log'>


export interface EvmLogHandler<S, R extends EventDataRequest = {event: true}> {
    (ctx: EvmLogHandlerContext<S,  R>): Promise<void>
}


export interface BlockRangeOption {
    range?: Range
}


export interface CallHandlerOptions extends BlockRangeOption {
    /**
     * By default, the call handler will be triggered only for successful calls.
     * This option allows to trigger the handler for all calls.
     */
    triggerForFailedCalls?: boolean
}


export interface EthereumTransactionHandlerOptions extends CallHandlerOptions {
    sighash?: string
}


export interface EvmLogOptions extends BlockRangeOption {
    /**
     * EVM topic filter as defined by https://docs.ethers.io/v5/concepts/events/#events--filters
     */
    filter?: EvmTopicSet[]
}


export interface AcalaEvmLogFilter {
    contract?: string
    /**
     * EVM topic filter as defined by https://docs.ethers.io/v5/concepts/events/#events--filters
     */
    filter?: EvmTopicSet[]
}


export interface AcalaEvmExecutedOptions extends BlockRangeOption {
    /**
     * When specified, instructs to include only events
     * which contain at least one EVM log record
     * matching one of the provided filters.
     */
    logs?: AcalaEvmLogFilter[]
}


export type EvmTopicSet = string | null | undefined | string[]


export type ContractsContractEmittedHandlerContext<S, R extends EventDataRequest = {event: true}>
    = CommonHandlerContext<S> & EventData<R, 'Contracts.ContractEmitted'>


export interface ContractsContractEmittedHandler<S, R extends EventDataRequest = {event: true}> {
    (ctx: ContractsContractEmittedHandlerContext<S, R>): Promise<void>
}


export type GearMessageEnqueuedHandlerContext<S, R extends EventDataRequest = {event: true}>
    = CommonHandlerContext<S> & EventData<R, 'Gear.MessageEnqueued'>


export interface GearMessageEnqueuedHandler<S, R extends EventDataRequest = {event: true}> {
    (ctx: GearMessageEnqueuedHandlerContext<S, R>): Promise<void>
}


export type GearUserMessageSentHandlerContext<S, R extends EventDataRequest = {event: true}>
    = CommonHandlerContext<S> & EventData<R, 'Gear.UserMessageSent'>


export interface GearUserMessageSentHandler<S, R extends EventDataRequest = {event: true}> {
    (ctx: GearUserMessageSentHandlerContext<S, R>): Promise<void>
}
