import { EventHandlerContext } from "./dataHandlerContext"
import type {ContextRequest} from "./dataSelection"
import {SubstrateApplyExtrinsicEvent} from "./substrate"


export type ContractAddress = string


export interface ContractsEvent extends SubstrateApplyExtrinsicEvent {
    name: 'Contracts.ContractEmitted',
    args: {
        contract: ContractAddress,
        data: string,
    }
}


export type ContractsEventHandlerContext<S, R extends ContextRequest = {event: true}> = {
    contractAddress: ContractAddress,
    data: string
    store: S
    substrate: Omit<EventHandlerContext<R>, 'store'>
}


export interface ContractsEventHandler<S, R extends ContextRequest = {event: true}> {
    (ctx: ContractsEventHandlerContext<S, R>): Promise<void>
}
