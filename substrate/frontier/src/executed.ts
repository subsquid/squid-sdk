import {Bytes} from '@subsquid/substrate-runtime'
import * as sts from '@subsquid/substrate-runtime/lib/sts'
import assert from 'assert'
import {Event, EventType} from './types'


const AnyEnum = sts.openEnum({})


const ErrorExit = sts.openEnum({
    Other: sts.string()
})


const ExitReason = sts.closedEnum({
    Succeed: AnyEnum,
    Error: ErrorExit,
    Revert: AnyEnum,
    Fatal: ErrorExit
})


const EthereumExecuted = new EventType(
    sts.union(
        sts.tuple([sts.bytes(), sts.bytes(), sts.bytes(), ExitReason]),
        sts.struct({
            from: sts.bytes(),
            to: sts.bytes(),
            transactionHash: sts.bytes(),
            exitReason: ExitReason
        })
    )
)


export interface TransactionResult {
    from: Bytes
    to: Bytes
    transactionHash: Bytes
    status: 'Succeed' | 'Error' | 'Revert' | 'Fatal'
    statusReason: string
}


export function getTransactionResult(ethereumExecuted: Event): TransactionResult {
    assert(ethereumExecuted.name === 'Ethereum.Executed')
    let args = EthereumExecuted.decode(ethereumExecuted)
    if (Array.isArray(args)) {
        let [from, to, transactionHash, exitReason] = args
        args = {from, to, transactionHash, exitReason}
    }
    return {
        from: args.from,
        to: args.to,
        transactionHash: args.transactionHash,
        status: args.exitReason.__kind,
        statusReason: getStatusReason(args.exitReason)
    }
}


function getStatusReason(exitReason: sts.GetType<typeof ExitReason>): string {
    switch(exitReason.__kind) {
        case 'Succeed':
        case 'Revert':
            return exitReason.value.__kind
        case 'Error':
        case 'Fatal':
            if (exitReason.value.__kind == 'Other') {
                return exitReason.value.value
            } else {
                return exitReason.value.__kind
            }
    }
}
