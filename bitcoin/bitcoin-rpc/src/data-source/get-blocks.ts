import { FiniteRange, rangeToArray } from '@subsquid/util-internal-range'
import { Rpc } from '../rpc'
import { Block, DataRequest } from '../types'

export async function getBlocks(
    rpc: Rpc,
    req: DataRequest,
    range: FiniteRange,
): Promise<Block[]> {
    const numbers = rangeToArray(range)
    const blocks = await rpc.getBlockBatch(numbers, req)

    return blocks
}
