import {Chain} from "../chain"
import {Range} from "../util/range"
import {Store} from "./handlerContext"
import {SubstrateBlock, SubstrateEvent, SubstrateExtrinsic} from "./substrate"


export type EvmContractAddress = string
export type EvmLogTopic = string


export interface EvmLogEvent extends SubstrateEvent {
    name: 'evm.Log'
    contractAddress: EvmContractAddress
    topics: EvmLogTopic[]
    data: string
    txHash: string
}


export interface EvmLogHandlerContext {
    topics: EvmLogTopic[]
    data: string
    txHash: string
    contractAddress: EvmContractAddress
    substrate: {
        _chain: Chain,
        event: SubstrateEvent,
        block: SubstrateBlock,
        extrinsic?: SubstrateExtrinsic
    }
    store: Store
}


export interface EvmLogHandler {
    (ctx: EvmLogHandlerContext): Promise<void>
}


export interface EvmLogHandlerOptions {
    range?: Range
    topics?: string[]
}
