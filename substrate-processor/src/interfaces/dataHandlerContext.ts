import type {Chain} from "../chain"
import type {ContextFields, ContextRequest} from "./dataSelection"
import type {SubstrateBlock} from "./substrate"


export interface BlockHandlerContext<S> {
    /**
     * Not yet public description of chain metadata
     * @internal
     */
    _chain: Chain
    store: S
    block: SubstrateBlock
}


export interface BlockHandler<S> {
    (ctx: BlockHandlerContext<S>): Promise<void>
}


export type EventHandlerContext<S, R extends ContextRequest = {event: true}> = BlockHandlerContext<S> & {
    event: ContextFields<R>['event']
}


export interface EventHandler<S, R extends ContextRequest = {event: true}> {
    (ctx: EventHandlerContext<S, R>): Promise<void>
}


export type CallHandlerContext<S, R extends ContextRequest = {call: true, extrinsic: true}> = BlockHandlerContext<S> & {
    call: ContextFields<R>['call']
    extrinsic: ContextFields<R>['extrinsic']
}


export interface CallHandler<S, R extends ContextRequest = {call: true, extrinsic: true}> {
    (ctx: CallHandlerContext<S, R>): Promise<void>
}
