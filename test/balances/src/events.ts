import {BalancesTransferEvent} from "./types/events"
import {EventContext} from "./types/support"


export interface TransferEvent {
    from: Uint8Array
    to: Uint8Array
    amount: bigint
}


export function getTransferEvent(ctx: EventContext): TransferEvent {
    let event = new BalancesTransferEvent(ctx)
    if (event.isV1020) {
        let [from, to, amount] = event.asV1020
        return {from, to, amount}
    } else if (event.isV1050) {
        let [from, to, amount] = event.asV1050
        return {from, to, amount}
    } else {
        return event.asV9130
    }
}
