import {createLogger} from '@subsquid/logger'
import {last, wait} from '@subsquid/util-internal'
import {FiniteRange} from '@subsquid/util-internal-range'
import assert from 'assert'
import {Commitment} from '../base'
import {Block, DataRequest} from './data'
import {Rpc} from './rpc'


const log = createLogger('sqd:solana-data')


interface HeightAndSlot {
    slot: number
    height: number
}


export async function getFinalizedTop(rpc: Rpc): Promise<HeightAndSlot> {
    let {context: {slot}} = await rpc.getLatestBlockhash('finalized')
    let attempts = 10
    while (attempts) {
        let block = await rpc.getBlockInfo('finalized', slot)
        if (block) {
            assert(block.blockHeight != null)
            return {
                slot,
                height: block.blockHeight
            }
        } else {
            await wait(100)
            attempts -= 1
        }
    }
    throw new Error(`Failed to getBlock at finalized slot ${slot} 10 times in a row`)
}


export async function getSlot(rpc: Rpc, height: number): Promise<number> {
    if (height == 0) return 0
    let top = await getFinalizedTop(rpc)
    if (top.height == height) return top.slot
    if (top.height < height) throw new Error(`block height ${height} haven't been reached`)
    return findSlot(rpc, height, {height: 0, slot: 0}, top)
}


export async function findSlot(rpc: Rpc, height: number, bottom: HeightAndSlot, top: HeightAndSlot): Promise<number> {
    if (bottom.height == height) return bottom.slot
    if (top.height == height) return top.slot
    if (top.slot - bottom.slot == top.height - bottom.height) return bottom.slot + height - bottom.height

    log.debug({
        height,
        bottom,
        top,
        distance: top.slot - bottom.slot
    }, 'block search')

    assert(bottom.height < height)
    assert(height < top.height)
    assert(top.slot - bottom.slot > top.height - bottom.height)

    if (height - bottom.height < 100) {
        let blocks = await rpc.getBlocksWithLimit('finalized', bottom.slot + 1, height - bottom.height)
        assert(blocks.length == height - bottom.height)
        return last(blocks)
    }

    let middle: number

    if (height - bottom.height < top.height - height) {
        middle = bottom.slot + Math.floor(
            (top.slot - bottom.slot) * Math.max((height - bottom.height) / (top.height - bottom.height), 0.01)
        )
        if (middle - bottom.slot < 100) {
            let end = Math.min(bottom.slot + 100, top.slot)
            let blocks = await rpc.getBlocks('finalized', bottom.slot + 1, end)
            if (blocks.length >= height - bottom.height) return blocks[height - bottom.height - 1]
            return findSlot(
                rpc,
                height,
                {
                    height: bottom.height + blocks.length,
                    slot: end
                },
                top
            )
        }
    } else {
        middle = top.slot - Math.floor(
            (top.slot - bottom.slot) * Math.max((top.height - height) / (top.height - bottom.height), 0.01)
        )
        if (top.slot - middle < 100) {
            let beg = Math.max(bottom.slot + 1, top.slot - 100)
            let blocks = await rpc.getBlocks('finalized', beg, top.slot - 1)
            if (blocks.length >= top.height - height) return blocks[height - (top.height - blocks.length)]
            return findSlot(
                rpc,
                height,
                bottom,
                {
                    height: top.height - blocks.length,
                    slot: beg
                }
            )
        }
    }

    let blocks = await rpc.getBlocksWithLimit('finalized', middle, 1)
    assert(blocks.length == 1)
    let slot = blocks[0]

    let info = await rpc.getBlockInfo('finalized', slot)
    assert(info)
    assert(info.blockHeight != null, 'block search is not possible in this block range')

    if (info.blockHeight == height) return slot
    if (info.blockHeight > height) {
        return findSlot(rpc, height, bottom, {height: info.blockHeight, slot: middle})
    } else {
        return findSlot(rpc, height, {height: info.blockHeight, slot}, top)
    }
}


export async function getData(
    rpc: Rpc,
    commitment: Commitment,
    slotRange: FiniteRange,
    req: DataRequest
): Promise<(Block | null)[]> {
    let slots: number[] = []

    for (let slot = slotRange.from; slot <= slotRange.to ; slot++) {
        slots.push(slot)
    }

    let result = await rpc.getBlockBatch(slots, {
        commitment,
        maxSupportedTransactionVersion: 0,
        rewards: !!req.rewards,
        transactionDetails: req.transactions ? 'full' : 'none'
    })

    let blocks: (Block | null)[] = []

    for (let i = 0; i < result.length; i++) {
        let block = result[i]
        if (block === undefined) continue
        if (block == null) {
            blocks.push(null)
        } else {
            assert(block.blockHeight != null)
            let slot = slotRange.from + i
            blocks.push({
                hash: block.blockhash,
                height: block.blockHeight,
                slot,
                block
            })
        }
    }

    return blocks
}


export function isConsistentChain(prev: Block, next: Block) {
    return prev.height + 1 == next.height &&
        prev.hash == next.block.previousBlockhash &&
        prev.slot == next.block.parentSlot
}
