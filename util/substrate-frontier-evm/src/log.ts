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
            return getAsV0(event.args)
        case registry.getHash('EVM.LogV1'):
            return getAsV1(event.args)
        default:
            throw new Error('Uknown "EVM.Log" version')
    }
}

export function getAsV0(args: any): EvmLog {
    return args
}

export function getAsV1(args: any): EvmLog {
    return args.log
}
