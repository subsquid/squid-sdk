import {EventRecord, Runtime} from '@subsquid/substrate-runtime'
import {Event} from '../../interfaces/data'
import {assertEvent} from '../../types/util'
import {BatchInterrupted} from '../../types/utility'


export type BatchCallResult = {
    ok: true
} | {
    ok: false
    failedItemIndex: number
    error: unknown
}


export function BATCH_CALL_END(runtime: Runtime, event: EventRecord):  BatchCallResult | undefined {
    switch(event.name) {
        case 'Utility.BatchCompleted':
            return {ok: true}
        case 'Utility.BatchInterrupted':
            assertEvent(runtime, BatchInterrupted, event)
            let failedItemIndex
            let error
            if (Array.isArray(event.args)) {
                failedItemIndex = event.args[0]
                error = event.args[1]
            } else {
                failedItemIndex = event.args.index
                error = event.args.error
            }
            return {
                ok: false,
                failedItemIndex,
                error
            }
        default:
            return undefined
    }
}


export function BATCH_ITEM_COMPLETED(event: Event): boolean {
    return event.name == 'Utility.ItemCompleted'
}


export function FORCE_BATCH_CALL_END(event: Event): boolean {
    switch(event.name) {
        case 'Utility.BatchCompleted':
        case 'Utility.BatchCompletedWithErrors':
            return true
        default:
            return false
    }
}
