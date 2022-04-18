import {Range} from "../util/range"
import {EvmLogHandler, EvmTopicSet} from "./evm"
import {BlockHandler, EventHandler, ExtrinsicHandler} from "./handlerContext"
import {QualifiedName} from "./substrate"

/**
 * Defines a {@link BlockHandler} function via the `handler` field and (optionally) the {@link Range} of blocks that 
 * should limit its execution via the `range` field.
 */
export interface BlockHook {
    handler: BlockHandler
    range?: Range
}

/**
 * Defines a {@link EventHandler} function via the `handler` field, the (optional) {@link Range} of blocks with the 
 * `range` field, and the Event name that should limit its execution through the `event` field. Event name should be 
 * explicited in the form `${module}.${Name}`.
 */
export interface EventHook {
    handler: EventHandler
    event: QualifiedName
    range?: Range
}

/**
 * Defines a {@link ExtrinsicHandler} function via the `handler` field, the (optional) {@link Range} of blocks with the 
 * `range` field, Event and Extrinsic names that should limit its execution throught the `event` and `extrinsic` 
 * fields. Event name should be explicited in the form `${module}.${Name}` and Extrinsic name should be in the form 
 * `${section}.${method}`.
 */
export interface ExtrinsicHook {
    handler: ExtrinsicHandler
    event: QualifiedName
    extrinsic: QualifiedName
    range?: Range
}

/**
 * Defines a {@link EvmLogHandler} function via the `handler` field, and the conditions for its execution:
 * 
 *  * the evm log event was emitted by the given `contractAddress`
 *  * the topic of the evm log event matches the {@link EvmTopicSet} specified in the (optional) `filter` field, as 
 * defined by the evm [event topic convention](https://docs.ethers.io/v5/concepts/events/#events--filters)
 *  * the block height is in the specified `range` ({@link Range}) (optional)
 */
export interface EvmLogHook {
    handler: EvmLogHandler
    contractAddress: string
    filter?: EvmTopicSet[]
    range?: Range
}

/**
 * Collection of object lists of different *Hook types.
 * 
 * Each Hook type has a reference to a function that should be executed under the appropriate conditions,
 * and informations necessary to define these conditions, such as the block {@link Range}, {@link QualifiedName} 
 * for Events and Extrinsics, and, in case of {@link EvmLogHook}, the list of {@link EvmTopicSet} to 
 * filter the handler execution.
 * 
 * The execution order of the Hooks, for each block is:
 *  * `pre` {@link BlockHook}s for current block
 *  * {@link EventHook}s, executed in the order the events have been emitted within the block, this includes
 *  {@link EvmLogHook}s
 *  * {@link ExtrinsicHook}s, executed in the order the triggerEvent (`system.ExtrinsicSuccess` by default) are
 *  emitted within the block
 *  * `post` {@link BlockHook}s for current block, after every
 */
export interface Hooks {
    pre: BlockHook[]
    post: BlockHook[]
    event: EventHook[]
    extrinsic: ExtrinsicHook[]
    evmLog: EvmLogHook[]
}
