import type {ChainDescription} from "@subsquid/substrate-metadata"
import {getEventHash} from "@subsquid/substrate-metadata/lib/event"


export {getEventHash}


export type Result<T, E> = {
    __kind: 'Ok'
    value: T
} | {
    __kind: 'Err'
    value: E
}


export interface EventContext {
    chainDescription: ChainDescription
    block: {
        height: number
    }
    event: {
        name: string
    }
}


export function decodeEvent(ctx: EventContext): any {
    throw new Error('Not implemented')
}
