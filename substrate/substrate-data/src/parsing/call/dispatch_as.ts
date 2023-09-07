import {closedEnum, struct, unknown} from '@subsquid/substrate-runtime/lib/sts'
import {Call} from '../../interfaces/data'
import {Origin} from '../../types/system'
import {assertCall, isEvent, UnexpectedEventType} from '../../types/util'
import type {CallParser} from './parser'


const DispatchAs_Origin = struct({
    asOrigin: Origin
})


const Result = closedEnum({
    Ok: unknown(),
    Err: unknown()
})


const DispatchedAsLatest = struct({result: Result})
const DispatchedAsLegacy = Result


export function visitDispatchAs(cp: CallParser, call: Call): void {
    assertCall(cp.runtime, DispatchAs_Origin, call)
    let sub = cp.getSubcall(call, call.args.asOrigin)
    cp.visitSubcall(sub, (runtime, event) => {
        if (event.name != 'Utility.DispatchedAs') return
        let result
        if (isEvent(runtime, DispatchedAsLatest, event)) {
            result = event.args.result
        } else if (isEvent(runtime, DispatchedAsLegacy, event)) {
            result = event.args
        } else {
            throw new UnexpectedEventType('Utility.DispatchedAs')
        }
        switch(result.__kind) {
            case 'Ok':
                return {ok: true}
            case 'Err':
                return {ok: false, error: result.value}
        }
    })
}


export function unwrapDispatchAs(cp: CallParser, call: Call, success: boolean): void {
    assertCall(cp.runtime, DispatchAs_Origin, call)
    let sub = cp.getSubcall(call, call.args.asOrigin)
    cp.unwrap(sub, success)
}
