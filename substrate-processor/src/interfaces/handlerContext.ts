import type {EntityManager} from "typeorm"
import type {EntityTarget} from "typeorm/common/EntityTarget"
import type {FindOneOptions} from "typeorm/find-options/FindOneOptions"
import type {SubstrateBlock, SubstrateEvent, SubstrateExtrinsic} from "./substrate"


export interface Store extends EntityManager {
    get<Entity>(entityClass: EntityTarget<Entity>, options?: FindOneOptions<Entity>): Promise<Entity | undefined>
}


export interface EventHandlerContext {
    store: Store
    block: SubstrateBlock
    event: SubstrateEvent
    extrinsic?: SubstrateExtrinsic
}


export interface EventHandler {
    (ctx: EventHandlerContext): Promise<void>
}


export interface BlockHandlerContext {
    store: Store
    block: SubstrateBlock
    events: SubstrateEvent[]
}


export interface BlockHandler {
    (ctx: BlockHandlerContext): Promise<void>
}
