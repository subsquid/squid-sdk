import {GetBlock} from '@subsquid/solana-rpc-data'
import {wait} from '@subsquid/util-internal'
import {FiniteRange} from '@subsquid/util-internal-range'
import {Commitment, Rpc} from '../rpc'
import {Block, DataRequest} from '../types'


export function requestSlotBatch(
    rpc: Rpc,
    commitment: Commitment,
    req: DataRequest,
    slots: number[],
): Promise<(GetBlock | null | undefined)[]>
{
    return rpc.getBlockBatch(slots, {
        commitment,
        maxSupportedTransactionVersion: 0,
        rewards: !!req.rewards,
        transactionDetails: req.transactions ? 'full' : 'none'
    })
}


export async function getBlocks(
    rpc: Rpc,
    commitment: Commitment,
    req: DataRequest,
    slots: FiniteRange | number[],
    maxConfirmationAttempts: number = 10,
    confirmationPauseMs: number = 100
): Promise<Block[]>
{
    if (!Array.isArray(slots)) {
        let range = slots
        slots = []
        for (let i = range.from; i <= range.to ; i++) {
            slots.push(i)
        }
    }

    let batch = await getSlots(
        rpc,
        commitment,
        req,
        slots,
        maxConfirmationAttempts,
        confirmationPauseMs,
        1
    )

    let result: Block[] = []
    for (let i = 0; i < batch.length; i++) {
        let block = batch[i]
        if (block) {
            result.push({
                slot: slots[i],
                block
            })
        }
    }
    return result
}


async function getSlots(
    rpc: Rpc,
    commitment: Commitment,
    req: DataRequest,
    slots: number[],
    maxConfirmationAttempts: number,
    confirmationPause: number,
    attempt: number
): Promise<(GetBlock | undefined)[]>
{
    let result = await requestSlotBatch(rpc, commitment, req, slots)

    let missing = []
    for (let i = 0; i < result.length; i++) {
        if (result[i] === null) {
            missing.push(i)
        }
    }

    if (missing.length == 0) return result as (GetBlock | undefined)[]

    if (maxConfirmationAttempts <= attempt) throw new Error(
        `failed to get slot ${slots[missing[0]]} with ${commitment} commitment ${attempt} time(s) in a row`
    )

    if (confirmationPause) {
        await wait(confirmationPause)
    }

    let filled = await getSlots(
        rpc,
        commitment,
        req,
        missing.map(i => slots[i]),
        maxConfirmationAttempts,
        confirmationPause,
        attempt + 1
    )

    for (let i = 0; i < missing.length; i++) {
        result[missing[i]] = filled[i]
    }

    return result as (GetBlock | undefined)[]
}
