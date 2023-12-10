import {createLogger} from '@subsquid/logger'
import {last} from '@subsquid/util-internal'
import assert from 'assert'
import {Rpc} from './rpc'


const log = createLogger('sqd:solana-data')


interface HeightAndSlot {
    slot: number
    height: number
}


export async function getFinalizedTop(rpc: Rpc): Promise<HeightAndSlot> {
    let head = await rpc.getRecentHead('finalized')
    let block = await rpc.getBlockInfo('finalized', head.slot)
    assert(block, 'finalized block is not supposed to disappear')
    assert(block.blockhash === head.blockHash)
    assert(block.blockHeight != null)
    return {
        slot: head.slot,
        height: block.blockHeight
    }
}


export async function findSlot(rpc: Rpc, height: number): Promise<HeightAndSlot> {
    if (height == 0) return {slot: 0, height: 0}
    let top = await getFinalizedTop(rpc)
    if (top.height <= height) return top
    let slot = await searchSlot(rpc, height, {height: 0, slot: 0}, top)
    return {slot, height}
}


async function searchSlot(rpc: Rpc, height: number, bottom: HeightAndSlot, top: HeightAndSlot): Promise<number> {
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
            return searchSlot(
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
            return searchSlot(
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
        return searchSlot(rpc, height, bottom, {height: info.blockHeight, slot: middle})
    } else {
        return searchSlot(rpc, height, {height: info.blockHeight, slot}, top)
    }
}
