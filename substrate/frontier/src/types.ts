import {Runtime} from '@subsquid/substrate-runtime'
import * as sts from '@subsquid/substrate-runtime/lib/sts'
import assert from 'assert'


export interface Event {
    name: string
    args: unknown
    block: {
        _runtime: Runtime
    }
}


export interface Call {
    name: string
    args: unknown
    block: {
        _runtime: Runtime
    }
}


export class EventType<T extends sts.Type> {
    constructor(private type: T) {}

    is(event: Event): boolean {
        return event.block._runtime.events.checkType(event.name, this.type)
    }

    decode(event: Event): sts.GetType<T> {
        assert(this.is(event))
        return event.block._runtime.decodeJsonEventRecordArguments(event)
    }
}


export class CallType<T extends sts.Type> {
    constructor(private type: T) {}

    is(call: Call): boolean {
        return call.block._runtime.calls.checkType(call.name, this.type)
    }

    decode(call: Call): sts.GetType<T> {
        assert(this.is(call))
        return call.block._runtime.decodeJsonCallRecordArguments(call)
    }
}
