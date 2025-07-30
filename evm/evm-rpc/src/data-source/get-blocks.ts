import {FiniteRange, rangeToArray} from '@subsquid/util-internal-range'
import {Rpc} from '../rpc'
import {Block, DataRequest} from '../types'


export async function getBlocks(
    rpc: Rpc,
    req: DataRequest,
    range: FiniteRange,
): Promise<Block[]>
{
    let numbers = rangeToArray(range)
    return rpc.getBlockBatch(numbers, req)
}
