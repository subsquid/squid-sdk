import {leadingU32} from './base58'
import type {GetBlock, Transaction} from './schema'

export * from './schema'

/**
 * Base58 encoded bytes
 */
export type Base58Bytes = string

const VOTE_PROGRAM = 'Vote111111111111111111111111111111111111111'

/**
 * The Vote program's `VoteInstruction` tags that cast a consensus vote, the set its own `is_simple_vote` names.
 * Every other tag manages a vote account: Withdraw, Authorize, UpdateCommission and the like.
 */
const CONSENSUS_VOTE_TAGS = new Set([
    2, // Vote
    6, // VoteSwitch
    8, // UpdateVoteState
    9, // UpdateVoteStateSwitch
    12, // CompactUpdateVoteState
    13, // CompactUpdateVoteStateSwitch
    14, // TowerSync
    15, // TowerSyncSwitch
])

/**
 * A consensus vote: one instruction, to the Vote program through the static keys, and it casts a vote.
 */
export function isVoteTransaction(tx: Transaction): boolean {
    let message = tx.transaction.message
    if (message.instructions.length != 1) return false

    let ins = message.instructions[0]
    if (message.accountKeys[ins.programIdIndex] !== VOTE_PROGRAM) return false

    let tag = leadingU32(ins.data)
    return tag != null && CONSENSUS_VOTE_TAGS.has(tag)
}

export function removeVoteTransactions(block: GetBlock): void {
    if (!block.transactions) return
    block.transactions = block.transactions.filter((tx: Transaction, index) => {
        tx._index = tx._index ?? index
        return !isVoteTransaction(tx)
    })
}
