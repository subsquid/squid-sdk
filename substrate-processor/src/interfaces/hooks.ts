import {Range} from "../util/range"
import {BlockHandler, EventHandler, ExtrinsicHandler} from "./handlerContext"
import {QualifiedName} from "./substrate"


export interface BlockHook {
    range?: Range
    handler: BlockHandler
}


export interface EventHook {
    event: QualifiedName
    handler: EventHandler
    range?: Range
}


export interface ExtrinsicHook {
    event: QualifiedName
    extrinsic: QualifiedName
    handler: ExtrinsicHandler
    range?: Range
}


export interface Hooks {
    pre: BlockHook[]
    post: BlockHook[]
    event: EventHook[]
    extrinsic: ExtrinsicHook[]
}
