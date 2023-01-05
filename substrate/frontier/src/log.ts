import assert from 'assert'
import {ChainContext, Event} from './interfaces'
import {registry} from './registry'

export interface EvmLog {
    address: string
    data: string
    topics: string[]
}

export function getEvmLog(ctx: ChainContext, event: Event): EvmLog {
    assert(event.name === 'EVM.Log')
    switch (ctx._chain.getEventHash('EVM.Log')) {
        case registry.getHash('EVM.LogV0'):
            return event.args
        case registry.getHash('EVM.LogV1'):
            return event.args.log
        default:
            throw new Error('Unknown "EVM.Log" version')
    }
}
