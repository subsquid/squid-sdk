import {GetBlock} from '@subsquid/solana-rpc-data'
import {wait} from '@subsquid/util-internal'
import {FiniteRange} from '@subsquid/util-internal-range'
import assert from 'assert'
import {Commitment, RpcApi} from '../rpc'
import {Block, DataRequest} from '../types'


export interface Slot {
    slot: number
    block?: GetBlock | 'skipped' | null | undefined
}


export async function requestMissingSlots(
    rpc: RpcApi,
    commitment: Commitment,
    req: DataRequest,
    slots: Slot[]
): Promise<void>
{
    let missing: number[] = []
    for (let i = 0; i < slots.length; i++) {
        if (slots[i].block == null) {
            missing.push(i)
        }
    }
    if (missing.length == 0) return

    let result = await rpc.getBlockBatch(missing.map(i => slots[i].slot), {
        commitment,
        maxSupportedTransactionVersion: 0,
        rewards: !!req.rewards,
        transactionDetails: req.transactions ? 'full' : 'none'
    })

    for (let i = 0; i < missing.length; i++) {
        slots[missing[i]].block = result[i]
    }
}


export function eliminateContradictions(slots: Slot[]): boolean {
    let found = false
    for (let i = 0; i < slots.length; i++) {
        let next = slots[i]
        if (i == 0 || next.block == null || next.block === 'skipped') {
            continue
        }
        let p = i - 1
        while (p >= 0) {
            let prev = slots[p]
            if (prev.slot < next.block.parentSlot) {
                break
            }
            if (prev.slot === next.block.parentSlot) {
                if (
                    prev.block === 'skipped'
                    // || prev.block != null && prev.block.blockhash !== next.block.previousBlockhash
                ) {
                    next.block = 'skipped'
                    found = true
                }
                break
            }
            prev.block = 'skipped'
            p -= 1
        }
    }
    return found
}


export async function getBlocks(
    rpc: RpcApi,
    commitment: Commitment,
    req: DataRequest,
    range: FiniteRange,
    maxConfirmationAttempts: number = 10,
    confirmationPauseMs: number = 100
): Promise<Block[]>
{
    let slots: Slot[] = []
    for (let i = range.from; i <= range.to ; i++) {
        slots.push({slot: i})
    }

    let inconsistentAttempts = 0
    let attempts = 0
    while (slots.some(s => s.block == null)) {
        if (inconsistentAttempts >= 2) {
            throw new Error(
                `getBlock results are not consistent within slot range ${range.from}..${range.to}, perhaps node has missed some block`
            )
        }
        if (attempts > 0) {
            if (attempts >= maxConfirmationAttempts) {
                let firstMissingSlot = slots.find(s => s.block == null)!.slot
                throw new Error(
                    `failed to get slot ${firstMissingSlot} with ${commitment} commitment ${attempts} time(s) in a row`
                )
            }
            if (confirmationPauseMs) {
                await wait(confirmationPauseMs)
            }
        }
        await requestMissingSlots(rpc, commitment, req, slots)
        attempts += 1
        if (eliminateContradictions(slots)) {
            inconsistentAttempts += 1
            for (let s of slots) {
                s.block = undefined
            }
        }
    }

    return slots.filter(b => {
        assert(b.block != null)
        return b.block !== 'skipped'
    }) as Block[]
}
