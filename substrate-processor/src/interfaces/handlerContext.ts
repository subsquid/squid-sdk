import type {EntityManager} from "typeorm"
import type {EntityTarget} from "typeorm/common/EntityTarget"
import type {FindOneOptions} from "typeorm/find-options/FindOneOptions"
import type {Chain} from "../chain"
import type {SubstrateBlock, SubstrateEvent, SubstrateExtrinsic} from "./substrate"


export interface Store extends EntityManager {
    get<Entity>(entityClass: EntityTarget<Entity>, options?: FindOneOptions<Entity>): Promise<Entity | undefined>
}


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


export interface EventHandler {
    (ctx: EventHandlerContext): Promise<void>
}

export interface EvmLogHandlerContext extends EventHandlerContext {
    event: EvmEvent
}

interface EvmEvent extends SubstrateEvent {
    evmLogAddress?: string
    evmLogData?: string;
    evmLogTopics?: string[];
    evmHash?: string
}

export interface EvmLogHandler {
    (ctx: EvmLogHandlerContext): Promise<void>
}

export interface ExtrinsicHandlerContext extends EventHandlerContext {
    extrinsic: SubstrateExtrinsic
}


export interface ExtrinsicHandler {
    (ctx: ExtrinsicHandlerContext): Promise<void>
}


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


export interface BlockHandler {
    (ctx: BlockHandlerContext): Promise<void>
}
