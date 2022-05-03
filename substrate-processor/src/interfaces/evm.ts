import {Range} from "../util/range"
import {EventHandlerContext} from "./dataHandlerContext"
import {ContextRequest} from "./dataSelection"
import {SubstrateApplyExtrinsicEvent} from "./substrate"


export type EvmContractAddress = string


export interface EvmLogEvent extends SubstrateApplyExtrinsicEvent {
    name: 'evm.Log'
    txHash: string
    args: {
        contract: EvmContractAddress
        topics: string[]
        data: string
    }
}


export interface EvmLogDataRequest {
    txHash?: boolean
    substrate?: ContextRequest
}


export type EvmLogFields<R extends EvmLogDataRequest> = (
    R['txHash'] extends true ? {txHash: string} : {}
) & (
   R['substrate'] extends ContextRequest
       ? {substrate: Omit<EventHandlerContext<R['substrate']>, 'store'>}
       : {}
)


export type EvmLogHandlerContext<S, R extends EvmLogDataRequest = {txHash: true, substrate: {event: true}}> = {
    contractAddress: EvmContractAddress
    topics: string[]
    data: string
    store: S
} & EvmLogFields<R>


export type EvmLogHandler<S, R extends EvmLogDataRequest = {txHash: true, substrate: {event: true}}> = {
    (ctx: EvmLogHandlerContext<S, R>): Promise<void>
}


export interface EvmLogSelection {
    range?: Range
    /**
     * EVM topic filter as defined by https://docs.ethers.io/v5/concepts/events/#events--filters
     */
    filter?: EvmTopicSet[]
}


export type EvmTopicSet = string | null | undefined | string[]


export interface EvmLogDataSelection<R extends EvmLogDataRequest> {
    data: R
}
