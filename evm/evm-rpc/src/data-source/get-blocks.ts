import {FiniteRange, rangeToArray} from '@subsquid/util-internal-range'
import {addErrorContext, wait} from '@subsquid/util-internal'
import {Rpc} from '../rpc'
import {Block, DataRequest} from '../types'


export async function getBlocks(
    rpc: Rpc,
    req: DataRequest,
    range: FiniteRange,
): Promise<Block[]> {
    let numbers = rangeToArray(range)
    let blocks = await rpc.getBlockBatch(numbers, req)

    let retries = 0
    while (true) {
        let indices: number[] = []
        for (let i = 0; i < numbers.length; i++) {
            if (blocks[i] == null || blocks[i]._isInvalid) {
                indices.push(i)
            }
        }

        if (indices.length == 0) return blocks

        if (retries == MAX_RETRIES) {
            // When a provider silently stops serving some blocks or a method,
            // the bare "failed to load blocks: N" message names neither the
            // endpoint nor the reason. Attach both so a single log line
            // localizes the failure.
            let failedBlocks = indices.map(i => numbers[i])
            let invalid = blocks.find(b => b?._isInvalid)
            if (invalid) {
                throw addErrorContext(new Error(invalid._errorMessage), {
                    rpcUrl: rpc.endpoint,
                    failedBlocks,
                    retries
                })
            }
            throw addErrorContext(
                new Error(`failed to load blocks: ${failedBlocks.join(', ')}`),
                {
                    rpcUrl: rpc.endpoint,
                    failedBlocks,
                    retries,
                    reason: 'rpc returned null for these blocks (provider may not serve them or the method)'
                }
            )
        }

        // Some providers intermittently return null / an `_isInvalid` block for
        // a block that genuinely has data — e.g. a flaky `eth_getBlockReceipts`
        // that serves the very same block on a later attempt. A fixed ~0.5s of
        // retries (5 x 100ms) is too short to ride out such a transient
        // degradation window, so the bad response would propagate as a fatal
        // error and crash-loop the dumper. Back off exponentially (mirroring the
        // rpc-client's own escalating pause) so a transient hiccup is absorbed,
        // while a genuinely unservable block still fails loudly once the budget
        // is exhausted.
        await wait(Math.min(100 * 2 ** retries, MAX_RETRY_BACKOFF_MS))
        let result = await rpc.getBlockBatch(indices.map(i => numbers[i]), req)
        for (let i = 0; i < result.length; i++) {
            blocks[indices[i]] = result[i]
        }

        retries += 1
    }
}


// Retry budget for transiently missing / invalid blocks. With exponential
// backoff capped at MAX_RETRY_BACKOFF_MS this spans ~40s before failing, enough
// to absorb a flaky provider window without crash-looping while still surfacing
// a persistently unservable block.
const MAX_RETRIES = 10
const MAX_RETRY_BACKOFF_MS = 10_000
