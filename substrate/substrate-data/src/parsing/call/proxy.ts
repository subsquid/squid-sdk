import {closedEnum, struct, unknown} from '@subsquid/substrate-runtime/lib/sts'
import {Call} from '../../interfaces/data'
import {Address} from '../../types/system'
import {assertCall, isEvent, UnexpectedEventType} from '../../types/util'
import {addressOrigin} from '../util'
import type {CallParser} from './parser'


const Proxy_RealAddress = struct({
    real: Address
})


const Result = closedEnum({
    Ok: unknown(),
    Err: unknown()
})


const ProxyExecutedLatest = struct({result: Result})
const ProxyExecutedLegacy = Result


export function visitProxy(cp: CallParser, call: Call): void {
    let sub = getSubcall(cp, call)
    return cp.visitSubcall(sub, (runtime, event) => {
        if (event.name != 'Proxy.ProxyExecuted') return
        let result
        if (isEvent(runtime, ProxyExecutedLatest, event)) {
            result = event.args.result
        } else if (isEvent(runtime, ProxyExecutedLegacy, event)) {
            result = event.args
        } else {
            throw new UnexpectedEventType('Proxy.ProxyExecuted')
        }
        switch(result.__kind) {
            case 'Ok':
                return {ok: true}
            case 'Err':
                return {ok: false, error: result.value}
        }
    })
}


function getSubcall(cp: CallParser, call: Call): Call {
    assertCall(cp.runtime, Proxy_RealAddress, call)
    let origin = addressOrigin(call.args.real) ?? null
    return cp.getSubcall(call, origin)
}


export function unwrapProxy(cp: CallParser, call: Call, success: boolean): void {
    let sub = getSubcall(cp, call)
    cp.unwrap(sub, success)
}
