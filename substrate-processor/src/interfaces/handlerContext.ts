import type {EntityManager} from "typeorm"
import type {EntityTarget} from "typeorm/common/EntityTarget"
import type {FindOneOptions} from "typeorm/find-options/FindOneOptions"
import type {Chain} from "../chain"
import type {SubstrateBlock, SubstrateEvent, SubstrateExtrinsic} from "./substrate"

/**
 * Represents an interface to the database, can create, delete, fetch any {@link Entity} and run arbitrary queries.
 * 
 * Extends parent class by adding a {@link get} method.
 */
export interface Store extends EntityManager {
    /**
     * Uses the underlying database interface to fetch an {@link Entity}, given the provided options, or its id.
     * 
     * @param entityClass The {@link Entity} class to be fetched
     * @param optionsOrId an object conforming to {@link FindOneOptions} type, including options for the search, or the id of the target
     */
    get<Entity>(entityClass: EntityTarget<Entity>, optionsOrId?: FindOneOptions<Entity> | string): Promise<Entity | undefined>
}

/**
 * Defines the context for the execution of an {@link EventHandler} function, including a `store` ({@link Store}) 
 * instance to interact with the database, `block` ({@link SubstrateBlock}), `event` ({@link SubstrateEvent}), and 
 * (optionally) `extrinsic` ({@link SubstrateExtrinsic}) information.
 */
export interface EventHandlerContext {
    store: Store
    block: SubstrateBlock
    event: SubstrateEvent
    extrinsic?: SubstrateExtrinsic
    /**
     * Not yet public description of chain metadata
     * @internal
     */
    _chain: Chain
}

/**
 * Defines signature for functions that should process Substrate Events
 */
export interface EventHandler {
    (ctx: EventHandlerContext): Promise<void>
}

/**
 * Defines the context for the execution of an {@link ExtrinsicHandler} functions.
 * Extends parent interface by making the `extrinsic` field mandatory.
 * 
 * @see EventHandlerContext
 */
export interface ExtrinsicHandlerContext extends EventHandlerContext {
    extrinsic: SubstrateExtrinsic
}

/**
 * Defines signature for functions that should process Substrate Extrinsics.
 */
export interface ExtrinsicHandler {
    (ctx: ExtrinsicHandlerContext): Promise<void>
}

/**
 * Defines the context for the execution of a {@link BlockHandler} function, including a `store` ({@link Store}) 
 * instance to interact with the database, `block` ({@link SubstrateBlock}), `events` ({@link SubstrateEvent}) 
 * information.
 * 
 * @see EventHandlerContext
 */
export interface BlockHandlerContext {
    store: Store
    block: SubstrateBlock
    events: SubstrateEvent[]
    /**
     * Not yet public description of chain metadata
     * @internal
     */
    _chain: Chain
}

/**
 * Defines signature for functions that should process Substrate Blocks.
 */
export interface BlockHandler {
    (ctx: BlockHandlerContext): Promise<void>
}
