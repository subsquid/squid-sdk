export {ContractBase} from './contract-base'

export {indexed} from './indexed'
export {
    func,
    AbiFunction,
    type FunctionReturn,
    type FunctionArguments,
} from './abi-components/function'
export {event, AbiEvent, type EventRecord, type EventParams, type EventArgumentsInput, type TopicFilter, type IndexedTopicFilter} from './abi-components/event'
export * from './errors'
import {decodeHex, isHex} from '@subsquid/util-internal-hex'
import {keccak_256} from 'js-sha3'

export function keccak256(data: Uint8Array | string): Buffer {
    if (isHex(data)) data = decodeHex(data)
    return Buffer.from(keccak_256.arrayBuffer(data))
}
