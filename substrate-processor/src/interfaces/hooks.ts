import {Range} from "../util/range"
import {EvmLogHandler, EvmTopicSet} from "./evm"
import {BlockHandler, EventHandler, ExtrinsicHandler} from "./handlerContext"
import {QualifiedName} from "./substrate"

/**
 * Defines a {@link BlockHandler} function and the {@link Range} of blocks that should restrain its execution
 * 
 * @property handler: {@link BlockHandler}
 * @property range: {@link Range} (optional)
 */
export interface BlockHook {
    handler: BlockHandler
    range?: Range
}

/**
 * Defines a {@link EventHandler} function, the {@link Range} of blocks, and the Event name that should restrain its execution
 * 
 * @property handler: {@link EventHandler}
 * @property event: {@link QualifiedName} the name of the event that should trigger the handler
 * @property range: {@link Range} (optional)
 */
export interface EventHook {
    handler: EventHandler
    event: QualifiedName
    range?: Range
}

/**
 * Defines a {@link ExtrinsicHandler} function and the {@link Range} of blocks, Event and Extrinsic names that should restrain its execution
 * 
 * @property handler: {@link ExtrinsicHandler}
 * @property event: {@link QualifiedName} the name of the event that should trigger the handler
 * @property extrinsic: {@link QualifiedName} the name of the extrinsic that should trigger the handler
 * @property range: {@link Range} (optional)
 */
export interface ExtrinsicHook {
    handler: ExtrinsicHandler
    event: QualifiedName
    extrinsic: QualifiedName
    range?: Range
}

/**
 * Defines a {@link EvmLogHandler} function and the contract address that should restrain its execution.
 * 
 * Optionally, a {@link Range} of blocks and EvmTopicSet to further filter the function triggering can be provided.
 * 
 * @property handler: {@link EvmLogHandler}
 * @property contractAddress: `string` representing the contract address that should trigger the handler
 * @property filter: {@link EvmTopicSet} (otpional)
 * @property range: {@link Range} (optional)
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
 * @property pre: list of {@link BlockHook}
 * @property post: list of {@link BlockHook}
 * @property event: list of {@link EventHook}
 * @property extrinsic: list of {@link ExtrinsicHook}
 * @property evmLog: list of {@link EvmLogHook}
 */
export interface Hooks {
    pre: BlockHook[]
    post: BlockHook[]
    event: EventHook[]
    extrinsic: ExtrinsicHook[]
    evmLog: EvmLogHook[]
}
