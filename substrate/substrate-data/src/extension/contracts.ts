import {Runtime} from '@subsquid/substrate-runtime'
import {bytes, struct} from '@subsquid/substrate-runtime/lib/sts'
import {Event} from '../interfaces/data'
import {assertEvent} from '../types/util'


const ContractsContractEmitted = struct({
    contract: bytes()
})


export function setEmittedContractAddress(runtime: Runtime, event: Event): void {
    if (event.name != 'Contracts.ContractEmitted') return
    assertEvent(runtime, ContractsContractEmitted, event)
    event._contractAddress = event.args.contract
}
