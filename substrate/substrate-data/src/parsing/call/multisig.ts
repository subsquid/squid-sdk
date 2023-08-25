import {Bytes, EventRecord, Runtime} from '@subsquid/substrate-runtime'
import {unexpectedCase} from '@subsquid/util-internal'
import {MultisigExecuted} from '../../types/multisig'
import {assertEvent} from '../../types/util'


export interface MultisigCallResult {
    ok: boolean
    error?: unknown
    multisig: Bytes
    callHash: Bytes
}


export function MULTISIG_EXECUTED(runtime: Runtime, event: EventRecord): MultisigCallResult | undefined {
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

