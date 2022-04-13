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
     * Uses the unterlying database interface to fetch an {@link Entity}, given the provided options, or its id.
     * 
     * @param entityClass The {@link Entity} class to be fetched
     * @param optionsOrId an object conforming to {@link FindOneOptions} type, including options for the search, or the id of the target
     */
    get<Entity>(entityClass: EntityTarget<Entity>, optionsOrId?: FindOneOptions<Entity> | string): Promise<Entity | undefined>
}

/**
 * Defines the context for the execution of an {@link EventHandler} functions.
 * 
 * @property store: {@link Store} instance to interact with the database 
 * @property block: {@link SubstrateBlock}
 * @property event: {@link SubstrateEvent}
 * @property extrinsic: {@link SubstrateExtrinsic} (optional)
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
 * Functions used to process Substrate Events should adhere to this interface.
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
 * Functions used to process Substrate Extrinsics should adhere to this interface.
 */
export interface ExtrinsicHandler {
    (ctx: ExtrinsicHandlerContext): Promise<void>
}

/**
 * Defines the context for the execution of a {@link BlockHandler} functions.
 * 
 * @property store: {@link Store} instance to interact with the database 
 * @property block: {@link SubstrateBlock}
 * @property event: {@link SubstrateEvent}
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
 * Functions used to process Substrate Blocks should adhere to this interface.
 */
export interface BlockHandler {
    (ctx: BlockHandlerContext): Promise<void>
}
