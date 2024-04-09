import {Bytes, EventRecord, Runtime} from '@subsquid/substrate-runtime'
import {bytes, closedEnum, struct, tuple, union, unknown} from '@subsquid/substrate-runtime/lib/sts'
import {unexpectedCase} from '@subsquid/util-internal'
import {isHex} from '@subsquid/util-internal-hex'
import assert from 'assert'
import {Call} from '../../interfaces/data'
import {MissingStorageValue} from '../../parser'
import {assertCall, assertEvent, assertStorage} from '../../types/util'
import {signedOrigin} from '../util'
import type {CallParser} from './parser'


const Result = closedEnum({
    Ok: unknown(),
    Err: unknown()
})


const MultisigExecuted = union(
    struct({
        multisig: bytes(),
        callHash: bytes(),
        result: Result
    }),
    tuple([unknown(), unknown(), bytes(), bytes(), Result])
)


interface MultisigCallResult {
    ok: boolean
    error?: unknown
    multisig: Bytes
    callHash: Bytes
}


function MULTISIG_EXECUTED(runtime: Runtime, event: EventRecord): MultisigCallResult | undefined {
    if (event.name != 'Multisig.MultisigExecuted') return
    assertEvent(runtime, MultisigExecuted, event)
    let multisig
    let callHash
    let result
    if (Array.isArray(event.args)) {
        multisig = event.args[2]
        callHash = event.args[3]
        result = event.args[4]
    } else {
        multisig = event.args.multisig
        callHash = event.args.callHash
        result = event.args.result
    }
    switch(result.__kind) {
        case 'Ok':
            return {
                ok: true,
                multisig,
                callHash
            }
        case 'Err':
            return {
                ok: false,
                error: result.value,
                multisig,
                callHash
            }
        default:
            throw unexpectedCase()
    }
}


export function visitAsMulti(cp: CallParser, call: Call): void {
    if (!cp.isPresent(MULTISIG_EXECUTED)) return
    let result = cp.get(MULTISIG_EXECUTED)
    let sub = cp.getSubcall(call, signedOrigin(result.multisig))
    if (result.ok) {
        cp.visitCall(sub)
    } else {
        cp.visitFailedCall(sub, result.error)
    }
}


const ApproveAsMulti = struct({
    callHash: bytes()
})


const CallsStorageValue = tuple([bytes(), unknown(), unknown()])


export function visitApproveAsMulti(cp: CallParser, call: Call): void {
    if (!cp.isPresent(MULTISIG_EXECUTED)) return
    let result = cp.get(MULTISIG_EXECUTED)

    assertCall(cp.runtime, ApproveAsMulti, call)
    assertStorage(cp.runtime, 'Multisig.Calls', ['Optional'], [bytes()], CallsStorageValue)

    let key = cp.runtime.encodeStorageKey('Multisig.Calls', result.callHash)
    let value = cp.block.storage?.[key]
    if (value === undefined) throw new MissingStorageValue(key)

    let subCallBytes: Bytes = cp.runtime.decodeStorageValue('Multisig.Calls', value)?.[0]
    assert(isHex(subCallBytes))

    let subCall = cp.runtime.decodeCall(subCallBytes)

    let sub = cp.createCall(
        call.extrinsicIndex,
        call.address.concat([0]),
        subCall,
        signedOrigin(result.multisig)
    )

    if (result.ok) {
        cp.visitCall(sub)
    } else {
        cp.visitFailedCall(sub, result.error)
    }
}
