import {DataRequest} from '../interfaces/data'


export function mergeDataRequests(a: DataRequest, b: DataRequest): DataRequest {
    return {
        includeAllBlocks: a.includeAllBlocks || b.includeAllBlocks,
        events: concat(a.events, b.events),
        calls: concat(a.calls, b.calls),
        evmLogs: concat(a.evmLogs, b.evmLogs),
        ethereumTransactions: concat(a.ethereumTransactions, b.ethereumTransactions),
        contractsEvents: concat(a.contractsEvents, b.contractsEvents),
        gearMessagesEnqueued: concat(a.gearMessagesEnqueued, b.gearMessagesEnqueued),
        gearUserMessagesSent: concat(a.gearUserMessagesSent, b.gearUserMessagesSent),
        acalaEvmExecuted: concat(a.acalaEvmExecuted, b.acalaEvmExecuted),
        acalaEvmExecutedFailed: concat(a.acalaEvmExecutedFailed, b.acalaEvmExecutedFailed)
    }
}


function concat<T>(a?: T[], b?: T[]): T[] | undefined {
    if (a == null) return b
    if (b == null) return a
    return a.concat(b)
}
