import {Logger} from '@subsquid/logger'
import {Chain} from '../chain'
import {Range} from '../util/range'
import {LogData, LogDataRequest, TransactionData, TransactionDataRequest} from './dataSelection'
import {EvmBlock} from './evm'

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
}

export interface BlockHandlerContext<S> {
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
    block: EvmBlock
}

export type LogHandlerContext<S, R extends LogDataRequest = {evmLog: {}}> = BlockHandlerContext<S> & LogData<R>

export interface LogHandler<S, R extends LogDataRequest = {evmLog: {}}> {
    (ctx: LogHandlerContext<S, R>): Promise<void>
}

export type TransactionHandlerContext<
    S,
    R extends TransactionDataRequest = {transaction: {}}
> = BlockHandlerContext<S> & TransactionData<R>

export interface LogHandler<S, R extends LogDataRequest = {evmLog: {}}> {
    (ctx: LogHandlerContext<S, R>): Promise<void>
}

export interface BlockRangeOption {
    range?: Range
}

export interface LogOptions extends BlockRangeOption {
    /**
     * EVM topic filter as defined by https://docs.ethers.io/v5/concepts/events/#events--filters
     */
    filter?: EvmTopicSet
}

export type EvmTopicSet = string[][]

export interface TransactionOptions extends BlockRangeOption {
    sighash?: string | string[]
}

export interface BatchHandlerContext<Store, Item> extends CommonHandlerContext<Store> {
    blocks: BatchBlock<Item>[]
    /**
     * Signals, that the processor reached the head of a chain.
     *
     * The head block is always included in `.blocks`.
     */
    isHead: boolean
}

export interface BatchBlock<Item> {
    /**
     * Block header
     */
    header: EvmBlock
    /**
     * A unified log of events and calls.
     *
     * All events deposited within a call are placed
     * before the call. All child calls are placed before the parent call.
     * List of block events is a subsequence of unified log.
     */
    items: Item[]
}
