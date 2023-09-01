import type {Bytes, QualifiedName, Runtime} from '@subsquid/substrate-runtime'
import * as sts from '@subsquid/substrate-runtime/lib/sts'
import {Result} from '@subsquid/substrate-runtime/lib/sts'
import assert from 'assert'


export {sts, Result, Bytes}


export type Option<T> = sts.ValueCase<'Some', T> | {__kind: 'None'}


interface RuntimeCtx {
    _runtime: Runtime
}


interface Block extends RuntimeCtx {}


interface Event {
    block: RuntimeCtx
    name: QualifiedName
    args: unknown
}


interface Call {
    block: RuntimeCtx
    name: QualifiedName
    args: unknown
}


export class EventType<T extends sts.Type> {
    constructor(private type: T) {}

    is(event: Event): boolean {
        return event.block._runtime.events.checkType(event.name, this.type)
    }

    decode(event: Event): sts.GetType<T> {
        assert(this.is(event))
        return event.block._runtime.decodeEventRecordArguments(event)
    }
}


export class CallType<T extends sts.Type> {
    constructor(private type: T) {}

    is(call: Call): boolean {
        return call.block._runtime.calls.checkType(call.name, this.type)
    }

    decode(call: Call): sts.GetType<T> {
        assert(this.is(call))
        return call.block._runtime.decodeCallRecordArguments(call)
    }
}


export class ConstantType<T extends sts.Type> {
    constructor(private name: QualifiedName, private type: T) {}

    is(block: RuntimeCtx): boolean {
        return block._runtime.checkConstantType(this.name, this.type)
    }

    get(block: RuntimeCtx): sts.GetType<T> {
        assert(this.is(block))
        return block._runtime.getConstant(this.name)
    }
}
