import assert from 'assert'
import {assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import {ChainContext, Event} from './interfaces'

export interface TransactionResult {
    from: string
    to: string
    hash: string
    status: 'Succeed' | 'Error' | 'Revert' | 'Fatal'
    reason: string
}

export function getTransactionResult(ctx: ChainContext, event: Event): TransactionResult {
    assert(event.name === 'Ethereum.Executed')

    if (Array.isArray(event.args)) {
        assert(event.args.length == 4)
        let [from, to, transactionHash, exitReason] = event.args
        return normalize({from, to, transactionHash, exitReason})
    } else if (typeof event.args === 'object') {
        return normalize(event.args)
    } else {
        throw unexpectedCase()
    }
}

export interface TransactionResultRaw {
    from: string
    to: string
    transactionHash: string
    exitReason: {
        __kind: string
        value: {
            __kind: string
            value?: string
        }
    }
}

function normalize(raw: TransactionResultRaw): TransactionResult {
    let status = raw.exitReason.__kind
    if (status !== 'Succeed' && status !== 'Error' && status !== 'Revert' && status !== 'Fatal') {
        throw unexpectedCase(status)
    }

    let reason =
        raw.exitReason.value.__kind === 'Other'
            ? assertNotNull(raw.exitReason.value.value)
            : raw.exitReason.value.__kind

    return {
        from: raw.from,
        to: raw.to,
        hash: raw.transactionHash,
        status,
        reason,
    }
}
