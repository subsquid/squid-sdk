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

        if (retries == 5) {
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

        await wait(100)
        let result = await rpc.getBlockBatch(indices.map(i => numbers[i]), req)
        for (let i = 0; i < result.length; i++) {
            blocks[indices[i]] = result[i]
        }

        retries += 1
    }
}
