import {FiniteRange} from '@subsquid/util-internal-range'
import {Rpc} from '../rpc'
import {Block, DataRequest} from '../types'


export async function getBlocks(
    rpc: Rpc,
    req: DataRequest,
    range: FiniteRange,
): Promise<Block[]>
{
    let numbers: number[] = []
    for (let i = range.from; i <= range.to; i++) {
        numbers.push(i)
    }
    return rpc.getBlockBatch(numbers, req)
}
