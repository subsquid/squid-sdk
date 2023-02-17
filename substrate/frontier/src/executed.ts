import assert from 'assert'
import {ChainContext, Event} from './interfaces'


export interface TransactionResult {
    from: string
    to: string
    transactionHash: string
    status: 'Succeed' | 'Error' | 'Revert' | 'Fatal'
    statusReason: string
}


export function getTransactionResult(ctx: ChainContext, ethereumExecuted: Event): TransactionResult {
    assert(ethereumExecuted.name === 'Ethereum.Executed')
    let args = ethereumExecuted.args
    if (Array.isArray(args)) {
        assert(args.length == 4, 'Ethereum.Executed event has unexpected structure')
        let [from, to, transactionHash, exitReason] = args
        return toResult({from, to, transactionHash, exitReason})
    } else {
        return toResult(args)
    }
}


interface EthereumExecutedArgs {
    from: unknown
    to: unknown
    transactionHash: unknown
    exitReason: ExitReason
}


interface ExitReason {
    __kind: string
    value: {
        __kind: string
        value?: unknown
    }
}


function toResult(args: EthereumExecutedArgs): TransactionResult {
    assert(typeof args.from == 'string', 'Ethereum.Executed event has unexpected structure')
    assert(typeof args.to == 'string', 'Ethereum.Executed event has unexpected structure')
    assert(typeof args.transactionHash == 'string', 'Ethereum.Executed event has unexpected structure')
    assert(typeof args.exitReason?.__kind == 'string', 'Ethereum.Executed event has unexpected structure')
    assert(typeof args.exitReason.value?.__kind == 'string', 'Ethereum.Executed event has unexpected structure')

    let status
    switch(args.exitReason.__kind) {
        case 'Succeed':
        case 'Error':
        case 'Revert':
        case 'Fatal':
            status = args.exitReason.__kind
            break
        default:
            throw new Error('Ethereum.Executed event has unexpected structure')
    }

    let statusReason: string
    if (args.exitReason.value.__kind == 'Other') {
        statusReason = ''+args.exitReason.value.value
    } else {
        statusReason = args.exitReason.value.__kind
    }

    return {
        from: args.from,
        to: args.to,
        transactionHash: args.transactionHash,
        status,
        statusReason
    }
}
