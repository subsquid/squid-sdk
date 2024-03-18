import {EventRecord, Runtime} from '@subsquid/substrate-runtime'
import {array, number, struct, tuple, union, unknown} from '@subsquid/substrate-runtime/lib/sts'
import assert from 'assert'
import {Call, Event} from '../../interfaces/data'
import {assertEvent} from '../../types/util'
import type {CallParser, CallResult} from './parser'


const PolymeshBatchCompleted = array(number())


const BatchInterrupted = union(
    struct({
        index: number(),
        error: unknown()
    }),
    tuple([number(), unknown()])
)


type BatchCallResult = {
    ok: true
} | {
    ok: false
    failedItemIndex: number
    error: unknown
}


function BATCH_CALL_END(runtime: Runtime, event: EventRecord):  BatchCallResult | undefined {
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
    }
}


function ITEM_COMPLETED(runtime: Runtime, event: Event): boolean {
    return event.name == 'Utility.ItemCompleted'
}


export function visitBatch(cp: CallParser, call: Call) {
    assert(call.name == 'Utility.batch')

    if (cp.runtime.checkEventType('Utility.BatchCompleted', PolymeshBatchCompleted)) {
        // Polymesh batch calls are different
        return
    }

    let items = cp.getSubcalls(call)
    let result = cp.get(BATCH_CALL_END)
    if (result.ok) {
        visitBatchItems(cp, items)
    } else {
        cp.visitFailedCall(items[result.failedItemIndex], result.error)
        visitBatchItems(cp, items.slice(0, result.failedItemIndex))
    }
}


function visitBatchItems(cp: CallParser, items: Call[]): void {
    if (items.length == 0) return
    if (cp.runtime.hasEvent('Utility.ItemCompleted')) {
        for (let i = items.length - 1; i >= 0; i--) {
            cp.get(ITEM_COMPLETED)
            if (i > 0) {
                cp.withBoundary(ITEM_COMPLETED, () => cp.visitCall(items[i]))
            } else {
                cp.visitCall(items[i])
            }
        }
    } else {
        // Utility.ItemCompleted doesn't exist yet
        for (let item of items) {
            cp.unwrap(item, true)
        }
    }
}


export function visitBatchAll(cp: CallParser, call: Call): void {
    assert(call.name == 'Utility.batch_all')
    cp.get((_rt, e) => e.name == 'Utility.BatchCompleted')
    let items = cp.getSubcalls(call)
    visitBatchItems(cp, items)
}


function FORCE_BATCH_CALL_END(runtime: Runtime, event: Event): boolean {
    switch(event.name) {
        case 'Utility.BatchCompleted':
        case 'Utility.BatchCompletedWithErrors':
            return true
        default:
            return false
    }
}


const ItemFailed = struct({
    error: unknown()
})


function FORCE_BATCH_ITEM(runtime: Runtime, event: Event): CallResult | undefined {
    switch(event.name) {
        case 'Utility.ItemCompleted':
            return {ok: true}
        case 'Utility.ItemFailed':
            assertEvent(runtime, ItemFailed, event)
            return {
                ok: false,
                error: event.args.error
            }
    }
}


export function visitForceBatch(cp: CallParser, call: Call): void {
    assert(call.name == 'Utility.force_batch')
    cp.get(FORCE_BATCH_CALL_END)
    let items = cp.getSubcalls(call)
    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i]
        let result = cp.get(FORCE_BATCH_ITEM)
        if (result.ok) {
            if (i > 0) {
                cp.withBoundary(FORCE_BATCH_ITEM, () => cp.visitCall(item))
            } else {
                cp.visitCall(item)
            }
        } else {
            cp.visitFailedCall(item, result.error)
        }
    }
}
