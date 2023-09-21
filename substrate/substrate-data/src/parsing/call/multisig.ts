import {Bytes, EventRecord, Runtime} from '@subsquid/substrate-runtime'
import {bytes, closedEnum, struct, tuple, union, unknown} from '@subsquid/substrate-runtime/lib/sts'
import {unexpectedCase} from '@subsquid/util-internal'
import {Call} from '../../interfaces/data'
import {assertEvent} from '../../types/util'
import {addressOrigin} from '../util'
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
    if (!cp.lookup(MULTISIG_EXECUTED)) return
    let result = cp.get(MULTISIG_EXECUTED)
    let sub = cp.getSubcall(call, addressOrigin(result.multisig))
    if (result.ok) {
        cp.visitCall(sub)
    } else {
        cp.visitFailedCall(sub, result.error)
    }
}
