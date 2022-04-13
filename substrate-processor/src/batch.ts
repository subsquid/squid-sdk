import {assertNotNull} from "@subsquid/util"
import {EvmContractAddress, EvmLogHandler, EvmTopicSet} from "./interfaces/evm"
import {BlockHandler, EventHandler, ExtrinsicHandler} from "./interfaces/handlerContext"
import {Hooks} from "./interfaces/hooks"
import {QualifiedName} from "./interfaces/substrate"
import {Heap} from "./util/heap"
import {Range, rangeDifference, rangeIntersection} from "./util/range"

/**
 * Collects handlers for the various trigger types (pre/post block, event, extrinsic, EVM log).
 * Keeps a list of handlers of the type corresponding to the trigger
 * 
 * @property pre: array of {@link BlockHandler}
 * @property post: array of {@link BlockHandler}
 * @property events: mapping of `trigger event` -> array of {@link EventHandler}
 * @property extrinsics: mapping of type `trigger event` -> `extrinsic` -> array of {@link ExtrinsicHandler}
 * @property evmLogs: mapping of {@link EvmContractAddress} -> array of { {@link EvmTopicSet}[], EvmLogHandler} objects
 */
export interface DataHandlers {
    pre: BlockHandler[]
    post: BlockHandler[]
    events: Record<QualifiedName, EventHandler[]>
    /**
     * Mapping of type `trigger event` -> `extrinsic` -> `extrinsic handler list`
     */
    extrinsics: Record<QualifiedName, Record<QualifiedName, ExtrinsicHandler[]>>
    evmLogs: Record<EvmContractAddress, {filter?: EvmTopicSet[], handler: EvmLogHandler}[]>
}

/**
 * Defines a batch of blocks to be processed
 * 
 * @property range: a {@link Range} defining start and end blocks for the batch
 * @property handlers: a {@link DataHandlers} objects to collect the handlers that should be triggered for the batch.
 */
export interface Batch {
    range: Range
    handlers: DataHandlers
}

/**
 * Forms an array of {@link Batch} for the given {@link Range} by mixing in the provided hooks
 * 
 * @param hooks a {@link Hooks} object, containing hooks for the various trigger types 
 * (Block, Event, Extrinsic, EvmLog)
 * @param blockRange a {@link Range} of blocks for which to create batches
 * @returns an array of {@link Batch}
 */
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
                extrinsics: {},
                evmLogs: {}
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
                extrinsics: {},
                evmLogs: {}
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
                    [hook.event]: [hook.handler]
                },
                extrinsics: {},
                evmLogs: {}
            }
        })
    })

    hooks.extrinsic.forEach(hook => {
        let range = getRange(hook)
        if (!range) return
        batches.push({
            range,
            handlers: {
                pre: [],
                post: [],
                events: {},
                extrinsics: {
                    [hook.event]: {[hook.extrinsic]: [hook.handler]}
                },
                evmLogs: {}
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
                extrinsics: {},
                evmLogs: {
                    [hook.contractAddress]: [{
                        filter: hook.filter,
                        handler: hook.handler
                    }]
                }
            }
        })
    })

    batches = mergeBatches(batches)

    return batches
}

/**
 * Given a list of {@link Batch}, it merges their Data Handlers by coalescing them based on their {@link Range}
 * @param batches an array of {@link Batch}
 * @returns an array of merged {@link Batch}
 */
export function mergeBatches(batches: Batch[]): Batch[] {
    if (batches.length <= 1) return batches

    let union: Batch[] = []
    let heap = new Heap<Batch>((a, b) => a.range.from - b.range.from)

    heap.init(batches.slice())

    let top = assertNotNull(heap.pop())
    let batch: Batch | undefined
    while (batch = heap.peek()) {
        let i = rangeIntersection(top.range, batch.range)
        if (i == null) {
            union.push(top)
            top = assertNotNull(heap.pop())
        } else {
            heap.pop()
            rangeDifference(top.range, i).forEach(range => {
                heap.push({range, handlers: top.handlers})
            })
            rangeDifference(batch.range, i).forEach(range => {
                heap.push({range, handlers: batch!.handlers})
            })
            heap.push({
                range: i,
                handlers: mergeDataHandlers(top.handlers, batch.handlers)
            })
            top = assertNotNull(heap.pop())
        }
    }
    union.push(top)
    return union
}

/**
 * @internal
 */
function mergeDataHandlers(a: DataHandlers, b: DataHandlers): DataHandlers {
    return {
        pre: a.pre.concat(b.pre),
        post: a.post.concat(b.post),
        events: mergeMaps(a.events, b.events, (ha, hb) => ha.concat(hb)),
        extrinsics: mergeMaps(a.extrinsics, b.extrinsics, (ea, eb) => {
            return mergeMaps(ea, eb, (ha, hb) => ha.concat(hb))
        }),
        evmLogs: mergeMaps(a.evmLogs, b.evmLogs, (ha, hb) => ha.concat(hb)),
    }
}

/**
 * @internal
 */
function mergeMaps<T>(a: Record<string, T>, b: Record<string, T>, mergeItems: (a: T, b: T) => T): Record<string, T> {
    let result: Record<string, T> = {}
    for (let key in a) {
        if (b[key] == null) {
            result[key] = a[key]
        } else {
            result[key] = mergeItems(a[key], b[key])
        }
    }
    for (let key in b) {
        if (result[key] == null) {
            result[key] = b[key]
        }
    }
    return result
}

/**
 * Given a list of {@link Range}, it counts the total number of blocks, adding each range until the chain height is 
 * reached
 * 
 * @param batches an array of objects containing {@link Range}
 * @param chainHeight the blockchain height (number of blocks up until the chain's head)
 * @returns the number of total blocks counted
 */
export function getBlocksCount(batches: { range: Range }[], chainHeight: number): number {
    let count = 0
    for (let i = 0; i < batches.length; i++) {
        let range = batches[i].range
        if (chainHeight < range.from) return count
        let to = Math.min(chainHeight, range.to ?? Infinity)
        count += to - range.from + 1
    }
    return count
}
