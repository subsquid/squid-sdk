import {FiniteRange, rangeToArray} from '@subsquid/util-internal-range'
import {wait} from '@subsquid/util-internal'
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
            let invalid = blocks.find(b => b?._isInvalid)
            if (invalid) throw new Error(invalid._errorMessage)
            throw new Error(`failed to load blocks: ${indices.map(i => numbers[i]).join(', ')}`)
        }

        await wait(100)
        let result = await rpc.getBlockBatch(indices.map(i => numbers[i]), req)
        for (let i = 0; i < result.length; i++) {
            blocks[indices[i]] = result[i]
        }

        retries += 1
    }
}
