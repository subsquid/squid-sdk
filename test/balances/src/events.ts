import * as ss58 from "@subsquid/ss58"
import {decodeHex} from "@subsquid/substrate-processor"


const ADDR = ss58.codec('kusama')


export interface TransferEvent {
    id: string
    from: string
    to: string
    amount: bigint
    timestamp: bigint
}


export function getTransferEvent(event: {id: string, args: any}, timestamp: number): TransferEvent {
    if (Array.isArray(event.args)) {
        let [from, to, amount] = event.args
        return {
            id: event.id,
            from: ADDR.encode(decodeHex(from)),
            to: ADDR.encode(decodeHex(to)),
            amount: BigInt(amount),
            timestamp: BigInt(timestamp)
        }
    } else {
        return {
            id: event.id,
            from: ADDR.encode(decodeHex(event.args.from)),
            to: ADDR.encode(decodeHex(event.args.to)),
            amount: BigInt(event.args.amount),
            timestamp: BigInt(timestamp)
        }
    }
    // let event = new BalancesTransferEvent(ctx)
    // if (event.isV1020) {
    //     let [from, to, amount] = event.asV1020
    //     return {from, to, amount}
    // } else if (event.isV1050) {
    //     let [from, to, amount] = event.asV1050
    //     return {from, to, amount}
    // } else {
    //     return event.asV9130

}
