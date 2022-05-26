import {getBlocksCount, mergeBatches} from "./generic"
import {Hooks} from "../interfaces/hooks"
import {Range, rangeIntersection} from "../util/range"
import {DataHandlers, mergeDataHandlers} from "./handlers"


export {getBlocksCount, DataHandlers}


export interface Batch {
    range: Range
    handlers: DataHandlers
}


export function createBatches(hooks: Hooks, blockRange?: Range): Batch[] {
    let batches: Batch[] = []

    function getRange(hook: { range?: Range }): Range | undefined {
        let range: Range | undefined = hook.range || {from: 0}
        if (blockRange) {
            range = rangeIntersection(range, blockRange)
        }
        return range
    }

    hooks.pre.forEach(hook => {
        let range = getRange(hook)
        if (!range) return
        batches.push({
            range,
            handlers: {
                pre: [hook.handler],
                post: [],
                events: {},
                calls: {},
                evmLogs: {},
                contractsContractEmitted: {},
            }
        })
    })

    hooks.post.forEach(hook => {
        let range = getRange(hook)
        if (!range) return
        batches.push({
            range,
            handlers: {
                pre: [],
                post: [hook.handler],
                events: {},
                calls: {},
                evmLogs: {},
                contractsContractEmitted: {},
            }
        })
    })

    hooks.event.forEach(hook => {
        let range = getRange(hook)
        if (!range) return
        batches.push({
            range,
            handlers: {
                pre: [],
                post: [],
                events: {
                    [hook.event]: {data: hook.data, handlers: [hook.handler]}
                },
                calls: {},
                evmLogs: {},
                contractsContractEmitted: {},
            }
        })
    })

    hooks.call.forEach(hook => {
        let range = getRange(hook)
        if (!range) return
        batches.push({
            range,
            handlers: {
                pre: [],
                post: [],
                events: {},
                calls: {
                    [hook.call]: {data: hook.data, handlers: [hook.handler]}
                },
                evmLogs: {},
                contractsContractEmitted: {},
            }
        })
    })

    hooks.evmLog.forEach(hook => {
        let range = getRange(hook)
        if (!range) return
        batches.push({
            range,
            handlers: {
                pre: [],
                post: [],
                events: {},
                calls: {},
                evmLogs: {
                    [hook.contractAddress]: [{
                        filter: hook.filter,
                        handler: hook.handler
                    }]
                },
                contractsContractEmitted: {},
            }
        })
    })

    hooks.contractsContractEmitted.forEach(hook => {
        let range = getRange(hook)
        if (!range) return
        batches.push({
            range,
            handlers: {
                pre: [],
                post: [],
                events: {},
                calls: {},
                evmLogs: {},
                contractsContractEmitted: {
                    [hook.contractAddress]: {data: hook.data, handlers: [hook.handler]}
                }
            }
        })
    })

    batches = mergeBatches(batches, mergeDataHandlers)

    return batches
}
