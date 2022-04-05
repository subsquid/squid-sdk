import {EventHandlerContext} from "@subsquid/substrate-processor"
import {BalancesTransferEvent} from "./types/events"


export interface TransferEvent {
    from: Uint8Array
    to: Uint8Array
    amount: bigint
}


export function getTransferEvent(ctx: EventHandlerContext<{event: {name: true, args: true}}>): TransferEvent {
    let event = new BalancesTransferEvent(ctx)
    if (event.isV1020) {
        let [from, to, amount] = event.asV1020
        return {from, to, amount}
    } else if (event.isV1050) {
        let [from, to, amount] = event.asV1050
        return {from, to, amount}
    } else {
        return event.asLatest
    }
}
