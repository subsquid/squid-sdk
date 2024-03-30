import {wait} from '@subsquid/util-internal'
import {FiniteRange} from '@subsquid/util-internal-range'
import assert from 'assert'
import {Commitment} from '../base'
import {Block, DataRequest, GetBlock} from './data'
import {GetBlockOptions, Rpc} from './rpc'


export interface HeightAndSlot {
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


export async function getData(
    rpc: Rpc,
    commitment: Commitment,
    slotRange: FiniteRange,
    req: DataRequest
): Promise<Block[]> {
    let slots: number[] = []

    for (let slot = slotRange.from; slot <= slotRange.to ; slot++) {
        slots.push(slot)
    }

    let result = await getSlots(rpc, slots, {
        commitment,
        maxSupportedTransactionVersion: 0,
        rewards: !!req.rewards,
        transactionDetails: req.transactions ? 'full' : 'none'
    }, 1)

    let blocks: Block[] = []

    for (let i = 0; i < result.length; i++) {
        let block = result[i]
        if (block) {
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


async function getSlots(rpc: Rpc, slots: number[], options: GetBlockOptions, depth: number): Promise<(GetBlock | undefined)[]> {
    let result = await rpc.getBlockBatch(slots, options)
    let missing: number[] = []

    for (let i = 0; i < result.length; i++) {
        if (result[i] === null) {
            missing.push(i)
        }
    }

    if (missing.length == 0) return result as (GetBlock | undefined)[]

    if (depth > 10) {
        throw new Error(`Block at slot ${slots[missing[0]]} is not conformed with ${options.commitment || 'finalized'} commitment`)
    }

    let filled = await getSlots(rpc, missing.map(i => slots[i]), options, depth + 1)

    for (let i = 0; i < missing.length; i++) {
        result[missing[i]] = filled[i]
    }

    return result as (GetBlock | undefined)[]
}


export function isConsistentChain(prev: Block, next: Block) {
    return prev.height + 1 == next.height &&
        prev.hash == next.block.previousBlockhash &&
        prev.slot == next.block.parentSlot
}
