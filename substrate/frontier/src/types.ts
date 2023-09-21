import {Runtime} from '@subsquid/substrate-runtime'
import * as sts from '@subsquid/substrate-runtime/lib/sts'
import assert from 'assert'


export interface EventRecord {
    name: string
    args: unknown
    block: {
        _runtime: Runtime
    }
}


export interface CallRecord {
    name: string
    args: unknown
    block: {
        _runtime: Runtime
    }
}


export class Event<T extends sts.Type> {
    constructor(private type: T) {}

    is(event: EventRecord): boolean {
        return event.block._runtime.checkEventType(event.name, this.type)
    }

    decode(event: EventRecord): sts.GetType<T> {
        assert(this.is(event))
        return event.block._runtime.decodeEventArguments(event.name, event)
    }
}


export class Call<T extends sts.Type> {
    constructor(private type: T) {}

    is(call: CallRecord): boolean {
        return call.block._runtime.checkCallType(call.name, this.type)
    }

    decode(call: CallRecord): sts.GetType<T> {
        assert(this.is(call))
        return call.block._runtime.decodeCallArguments(call.name, call)
    }
}
