import {Runtime} from '@subsquid/substrate-runtime'
import {bytes, struct, array} from '@subsquid/substrate-runtime/lib/sts'
import {Event} from '../interfaces/data'
import {assertEvent} from '../types/util'


const ReviveContractEmitted = struct({
    contract: bytes(),
    topics: array(bytes())
})


export function setReviveContractEmitted(runtime: Runtime, event: Event): void {
    if (event.name != 'Revive.ContractEmitted') return
    assertEvent(runtime, ReviveContractEmitted, event)
    event._reviveContract = event.args.contract
    event._reviveTopics = event.args.topics
}
