import {unexpectedCase} from '@subsquid/util-internal'
import {toHex} from '@subsquid/util-internal-hex'
import {Call, Event} from '../interfaces/data'


export function setEthereumTransact(call: Call): void {
    if (call.name != 'Ethereum.transact') return
    let tx = call.args.transaction.value.action ? call.args.transaction.value : call.args.transaction
    call._ethereumTransactSighash = toHex(tx.input.subarray(0, 4))
    switch(tx.action?.__kind) {
        case 'Create':
            return
        case 'Call':
            call._ethereumTransactTo = toHex(tx.action.value)
            break
        default:
            throw unexpectedCase(tx.action?.__kind)
    }
}


export function setEvmLog(event: Event): void {
    if (event.name != 'EVM.Log') return
    let log: {
        address: Uint8Array,
        topics: Uint8Array[]
    } = event.args.address ? event.args : event.args.log
    event._evmLogAddress = toHex(log.address)
    event._evmLogTopics = log.topics.map(t => toHex(t))
}


export function setEmittedContractAddress(event: Event): void {
    if (event.name != 'Contracts.ContractEmitted') return
    event._contractAddress = toHex(event.args.contract)
}


export function setGearProgramId(event: Event): void {
    switch(event.name) {
        case 'Gear.MessageEnqueued':
            event._gearProgramId = toHex(event.args.destination)
            break
        case 'Gear.UserMessageSent':
            event._gearProgramId = toHex(event.args.message.source)
            break
    }
}


