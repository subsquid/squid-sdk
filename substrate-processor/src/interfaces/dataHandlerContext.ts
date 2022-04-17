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


export type EventHandlerContext<R extends ContextRequest = {event: true}> = BlockHandlerContext & {
    event: ContextFields<R>['event']
}


export interface EventHandler<R extends ContextRequest = {event: true}> {
    (ctx: EventHandlerContext<R>): Promise<void>
}


export type CallHandlerContext<R extends ContextRequest = {call: true, extrinsic: true}> = BlockHandlerContext & {
    call: ContextFields<R>['call']
    extrinsic: ContextFields<R>['extrinsic']
}


export interface CallHandler<R extends ContextRequest = {call: true, extrinsic: true}> {
    (ctx: CallHandlerContext<R>): Promise<void>
}
