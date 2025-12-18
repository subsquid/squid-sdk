import {FiniteRange, rangeToArray} from '@subsquid/util-internal-range'
import {wait} from '@subsquid/util-internal'
import {Rpc} from '../rpc'
import {Block, DataRequest} from '../types'


async function requestInvalidBlocks(
    rpc: Rpc,
    req: DataRequest,
    blocks: Block[]
) {
    let invalid: number[] = []
    for (let i = 0; i < blocks.length; i++) {
        if (blocks[i]._isInvalid || invalid.length != 0) {
            invalid.push(i)
        }
    }

    let result = await rpc.getBlockBatch(invalid.map(i => blocks[i].number), req)
    for (let i = 0; i < invalid.length; i++) {
        blocks[invalid[i]] = result[i]
    }
}


export async function getBlocks(
    rpc: Rpc,
    req: DataRequest,
    range: FiniteRange,
): Promise<Block[]> {
    let numbers = rangeToArray(range)
    let blocks = await rpc.getBlockBatch(numbers, req)

    let retries = 0
    let invalid = blocks.find(b => b._isInvalid)
    while (invalid != null) {
        await wait(100)

        if (retries == 3) {
            throw new Error(invalid._errorMessage)
        }

        await requestInvalidBlocks(rpc, req, blocks)
        retries += 1
    }

    return blocks
}
