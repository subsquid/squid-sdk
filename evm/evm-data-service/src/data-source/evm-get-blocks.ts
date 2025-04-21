import {FiniteRange} from '@subsquid/util-internal-range'
import {Rpc} from './evm-rpc'
import {Block, DataRequest} from './evm-types'

export async function getBlocks(
    rpc: Rpc,
    req: DataRequest,
    range: FiniteRange,
): Promise<Block[]>
{
    let numbers: number[] = []
    for (let i = range.from; i <= range.to ; i++) {
        numbers.push(i)
    }
    
    let batch = await rpc.getBlockBatch(numbers, {transactionDetails: req.transactions});

    let result: Block[] = []
    for (let i = 0; i < batch.length; i++) {
        let block = batch[i]
        if (block) {
            result.push({
                number: parseInt(block.number, 16),
                block
            })
        }
    }
    return result
}
