import {toHex} from "@subsquid/util-internal-hex"
import {Event, EvmLog} from "../model"
import {formatEvmLogId} from "./util"


interface EvmExecutedLog {
    address: Uint8Array
    data: string
    topics: Uint8Array[]
}


interface EvmExecutedEvent extends Event {
    name: 'EVM.Executed'
    args: {
        contract: string
        from: string
        logs: EvmExecutedLog[]
        usedGas: string
        usedStorage: number
    }
}


export class EvmLogExtractor {
    logs: EvmLog[] = []
    private idx = 0

    constructor(private events: Event[], private blockHeight: number) {
        for (let e of this.events) {
            switch (e.name) {
                case 'EVM.Executed':
                    this.fromEvmExecuted(e as EvmExecutedEvent)
                    break
            }
        }
    }

    private fromEvmExecuted(event: EvmExecutedEvent) {
        for (let log of event.args.logs) {
            this.logs.push({
                id: formatEvmLogId(this.blockHeight, this.idx++),
                block_id: event.block_id,
                contract: toHex(log.address),
                event_id: event.id,
                topic0: log.topics[0] && toHex(log.topics[0]),
                topic1: log.topics[1] && toHex(log.topics[1]),
                topic2: log.topics[2] && toHex(log.topics[2]),
                topic3: log.topics[3] && toHex(log.topics[3]),
            })
        }
    }
}
