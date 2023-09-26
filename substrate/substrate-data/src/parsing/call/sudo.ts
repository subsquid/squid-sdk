import {DecodedCall, Runtime} from '@subsquid/substrate-runtime'
import {closedEnum, externalEnum, struct, unknown} from '@subsquid/substrate-runtime/lib/sts'
import {Call, Event} from '../../interfaces/data'
import {Address, IOrigin} from '../../types/system'
import {assertCall, isCall, isEvent, UnexpectedCallType, UnexpectedEventType} from '../../types/util'
import {addressOrigin, rootOrigin} from '../util'
import type {CallParser, CallResult} from './parser'


const Result = closedEnum({
    Ok: unknown(),
    Err: unknown()
})


const SudoResultLatest = struct({sudoResult: Result})
const SudoResultLegacy = Result


function END_OF_SUDO(runtime: Runtime, event: Event): CallResult | undefined {
    switch(event.name) {
        case "Sudo.Sudid":
        case "Sudo.SudoAsDone":
            break
        default:
            return
    }

    if (typeof event.args == 'boolean') return {
        ok: event.args
    }

    let result
    if (isEvent(runtime, SudoResultLatest, event)) {
        result = event.args.sudoResult
    } else if (isEvent(runtime, SudoResultLegacy, event)) {
        result = event.args
    } else {
        throw new UnexpectedEventType(event.name)
    }

    switch(result.__kind) {
        case 'Ok':
            return {ok: true}
        case 'Err':
            return {ok: false, error: result.value}
    }
}


const SudoCallLatest = struct({call: externalEnum()})
const SudoCallLegacy =  struct({proposal: externalEnum()})


function getSudoCall(runtime: Runtime, call: Call): DecodedCall {
    if (isCall(runtime, SudoCallLatest, call)) {
        return  call.args.call
    } else if (isCall(runtime, SudoCallLegacy, call)) {
        return call.args.proposal
    } else {
        throw new UnexpectedCallType(call.name)
    }
}


function getSubcall(cp: CallParser, call: Call, origin: IOrigin | undefined): Call {
    return cp.createCall(
        call.extrinsicIndex,
        call.address.concat([0]),
        getSudoCall(cp.runtime, call),
        origin
    )
}


export function visitSudo(cp: CallParser, call: Call): void {
    let sub = getSubcall(cp, call, rootOrigin())
    cp.visitSubcall(sub, END_OF_SUDO)
}


export function unwrapSudo(cp: CallParser, call: Call, success: boolean): void {
    let sub = getSubcall(cp, call, rootOrigin())
    cp.unwrap(sub, success)
}


const SudoAs = struct({
    who: Address
})


export function visitSudoAs(cp: CallParser, call: Call): void {
    assertCall(cp.runtime, SudoAs, call)

    let origin = addressOrigin(call.args.who)

    let sub = getSubcall(cp, call, origin)

    cp.visitSubcall(sub, END_OF_SUDO)
}


export function unwrapSudoAs(cp: CallParser, call: Call, success: boolean): void {
    assertCall(cp.runtime, SudoAs, call)

    let origin = addressOrigin(call.args.who)

    let sub = getSubcall(cp, call, origin)

    cp.unwrap(sub, success)
}
