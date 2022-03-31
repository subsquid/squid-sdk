import type {Chain} from "../chain"
import type {ContextFields, ContextRequest} from "./dataSelection"
import type {Store} from "./store"
import type {SubstrateBlock} from "./substrate"


export interface BlockHandlerContext {
    /**
     * Not yet public description of chain metadata
     * @internal
     */
    _chain: Chain
    store: Store
    block: SubstrateBlock
}


export interface BlockHandler {
    (ctx: BlockHandlerContext): Promise<void>
}


export interface EventHandlerContext<R extends ContextRequest = {event: true}> extends BlockHandlerContext {
    event: ContextFields<R>['event']
}


export interface EventHandler<R extends ContextRequest = {event: true}> {
    (ctx: EventHandlerContext<R>): Promise<void>
}


export interface CallHandlerContext<R extends ContextRequest = {call: true, extrinsic: true}> extends BlockHandlerContext {
    call: ContextFields<R>['call']
    extrinsic: ContextFields<R>['extrinsic']
}


export interface CallHandler<R extends ContextRequest = {call: true, extrinsic: true}> {
    (ctx: CallHandlerContext<R>): Promise<void>
}
