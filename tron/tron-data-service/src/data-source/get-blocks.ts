import {addErrorContext, last, wait} from '@subsquid/util-internal'
import {BlockRef} from '@subsquid/util-internal-data-source'
import {FiniteRange, rangeToArray} from '@subsquid/util-internal-range'
import {BlockData, fetchBlock, fetchTransactionsInfo, getParentHash, HttpApi} from '@subsquid/tron-data'


export function getBlockRef(block: BlockData): BlockRef {
    return {
        number: block.height,
        hash: block.hash
    }
}


/**
 * Current chain head (the latest, not yet finalized block).
 */
export async function getChainHead(httpApi: HttpApi): Promise<BlockRef> {
    let block = await httpApi.getNowBlock()
    return {
        number: block.block_header.raw_data.number ?? 0,
        hash: block.blockID
    }
}


/**
 * Latest solidified (irreversible) block, which is TRON's finality point.
 */
export async function getSolidifiedHead(httpApi: HttpApi): Promise<BlockRef> {
    let block = await httpApi.getNowSolidifiedBlock()
    return {
        number: block.block_header.raw_data.number ?? 0,
        hash: block.blockID
    }
}


/**
 * Fetch a contiguous range of blocks with full data.
 *
 * All blocks in the range are expected to be available and to form a chain,
 * otherwise the fetch is retried a few times before failing. This is used
 * for the finalized (below the head) part of the stream, where blocks
 * are not supposed to disappear or reorg.
 */
export async function getBlocks(httpApi: HttpApi, range: FiniteRange): Promise<BlockData[]> {
    let numbers = rangeToArray(range)

    for (let retries = 0; ; retries++) {
        let result = await tryGetBlocks(httpApi, numbers)
        if (result.blocks) return result.blocks
        if (retries >= 5) {
            throw addErrorContext(new Error(result.error), {
                failedBlocks: `${numbers[0]}..${last(numbers)}`,
                retries
            })
        }
        await wait(100)
    }
}


async function tryGetBlocks(
    httpApi: HttpApi,
    numbers: number[]
): Promise<{blocks: BlockData[], error?: undefined} | {blocks?: undefined, error: string}> {
    let maybe = await Promise.all(numbers.map(n => fetchBlock(httpApi, n, true)))

    let blocks: BlockData[] = []
    for (let i = 0; i < maybe.length; i++) {
        let block = maybe[i]
        if (block == null) {
            return {error: `block ${numbers[i]} is not available`}
        }
        if (i > 0 && getParentHash(block) !== blocks[i - 1].hash) {
            return {error: `chain continuity is broken at block ${block.height}#${block.hash}`}
        }
        blocks.push(block)
    }

    let infoOk = await Promise.all(blocks.map(block => fetchTransactionsInfo(httpApi, block)))
    let badIndex = infoOk.findIndex(ok => !ok)
    if (badIndex >= 0) {
        return {error: `transactions info for block ${blocks[badIndex].height} is not consistent`}
    }

    return {blocks}
}
