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


const EIP7702Transaction = struct({
    destination: TransactionAction,
    data: bytes()
})


const TransactionV2 = closedEnum({
    Legacy: Transaction,
    EIP2930: Transaction,
    EIP1559: Transaction
})


const TransactionV3 = closedEnum({
    Legacy: Transaction,
    EIP2930: Transaction,
    EIP1559: Transaction,
    EIP7702: EIP7702Transaction
})


const EthereumTransactLegacy = struct({
    transaction: Transaction
})


const EthereumTransactV2 = struct({
    transaction: TransactionV2
})


const EthereumTransactV3 = struct({
    transaction: TransactionV3
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
    let action, data
    if (isCall(runtime, EthereumTransactLegacy, call)) {
        action = call.args.transaction.action
        data = call.args.transaction.input
    } else if (isCall(runtime, EthereumTransactV2, call)) {
        action = call.args.transaction.value.action
        data = call.args.transaction.value.input
    } else if (isCall(runtime, EthereumTransactV3, call)) {
        if (call.args.transaction.__kind == 'EIP7702') {
            action = call.args.transaction.value.destination
            data = call.args.transaction.value.data
        } else {
            action = call.args.transaction.value.action
            data = call.args.transaction.value.input
        }
    } else {
        throw new UnexpectedCallType('Ethereum.transact')
    }
    call._ethereumTransactSighash = data.slice(0, 10)
    if (action.__kind == 'Call') {
        call._ethereumTransactTo = action.value
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
