import {Runtime} from '@subsquid/substrate-runtime'
import {array, bytes, closedEnum, struct, unit} from '@subsquid/substrate-runtime/lib/sts'
import {Call, Event} from '../interfaces/data'
import {isCall, isEvent, UnexpectedCallType, UnexpectedEventType} from '../types/util'


const TransactionAction = closedEnum({
    Call: bytes(),
    Create: unit()
})


const Transaction = struct({
    action: TransactionAction,
    input: bytes()
})


const TransactionV2 = closedEnum({
    Legacy: Transaction,
    EIP2930: Transaction,
    EIP1559: Transaction
})


const EthereumTransactLegacy = struct({
    transaction: Transaction
})


const EthereumTransactLatest = struct({
    transaction: TransactionV2
})


const EvmLogLegacy = struct({
    address: bytes(),
    topics: array(bytes())
})


const EvmLogLatest = struct({
    log: EvmLogLegacy
})


export function setEthereumTransact(runtime: Runtime, call: Call): void {
    if (call.name != 'Ethereum.transact') return
    let tx
    if (isCall(runtime, EthereumTransactLegacy, call)) {
        tx = call.args.transaction
    } else if (isCall(runtime, EthereumTransactLatest, call)) {
        tx = call.args.transaction.value
    } else {
        throw new UnexpectedCallType('Ethereum.transact')
    }
    call._ethereumTransactSighash = tx.input.slice(0, 10)
    if (tx.action.__kind == 'Call') {
        call._ethereumTransactTo = tx.action.value
    }
}


export function setEvmLog(runtime: Runtime, event: Event): void {
    if (event.name != 'EVM.Log') return
    let log
    if (isEvent(runtime, EvmLogLegacy, event)) {
        log = event.args
    } else if (isEvent(runtime, EvmLogLatest, event)) {
        log = event.args.log
    } else {
        throw new UnexpectedEventType('EVM.Log')
    }
    event._evmLogAddress = log.address
    event._evmLogTopics = log.topics
}
