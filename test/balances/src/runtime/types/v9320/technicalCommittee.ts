import {sts} from '../../pallet.support'
import {Call, H256, Weight, Type_60} from './types'

/**
 * Add a new proposal to either be voted on or executed directly.
 * 
 * Requires the sender to be member.
 * 
 * `threshold` determines whether `proposal` is executed directly (`threshold < 2`)
 * or put up for voting.
 * 
 * # <weight>
 * ## Weight
 * - `O(B + M + P1)` or `O(B + M + P2)` where:
 *   - `B` is `proposal` size in bytes (length-fee-bounded)
 *   - `M` is members-count (code- and governance-bounded)
 *   - branching is influenced by `threshold` where:
 *     - `P1` is proposal execution complexity (`threshold < 2`)
 *     - `P2` is proposals-count (code-bounded) (`threshold >= 2`)
 * - DB:
 *   - 1 storage read `is_member` (codec `O(M)`)
 *   - 1 storage read `ProposalOf::contains_key` (codec `O(1)`)
 *   - DB accesses influenced by `threshold`:
 *     - EITHER storage accesses done by `proposal` (`threshold < 2`)
 *     - OR proposal insertion (`threshold <= 2`)
 *       - 1 storage mutation `Proposals` (codec `O(P2)`)
 *       - 1 storage mutation `ProposalCount` (codec `O(1)`)
 *       - 1 storage write `ProposalOf` (codec `O(B)`)
 *       - 1 storage write `Voting` (codec `O(M)`)
 *   - 1 event
 * # </weight>
 */
export type TechnicalCommitteeProposeCall = {
    threshold: number,
    proposal: Call,
    lengthBound: number,
}

export const TechnicalCommitteeProposeCall: sts.Type<TechnicalCommitteeProposeCall> = sts.struct(() => {
    return  {
        threshold: sts.number(),
        proposal: Call,
        lengthBound: sts.number(),
    }
})

/**
 * Dispatch a proposal from a member using the `Member` origin.
 * 
 * Origin must be a member of the collective.
 * 
 * # <weight>
 * ## Weight
 * - `O(M + P)` where `M` members-count (code-bounded) and `P` complexity of dispatching
 *   `proposal`
 * - DB: 1 read (codec `O(M)`) + DB access of `proposal`
 * - 1 event
 * # </weight>
 */
export type TechnicalCommitteeExecuteCall = {
    proposal: Call,
    lengthBound: number,
}

export const TechnicalCommitteeExecuteCall: sts.Type<TechnicalCommitteeExecuteCall> = sts.struct(() => {
    return  {
        proposal: Call,
        lengthBound: sts.number(),
    }
})

/**
 * Close a vote that is either approved, disapproved or whose voting period has ended.
 * 
 * May be called by any signed account in order to finish voting and close the proposal.
 * 
 * If called before the end of the voting period it will only close the vote if it is
 * has enough votes to be approved or disapproved.
 * 
 * If called after the end of the voting period abstentions are counted as rejections
 * unless there is a prime member set and the prime member cast an approval.
 * 
 * If the close operation completes successfully with disapproval, the transaction fee will
 * be waived. Otherwise execution of the approved operation will be charged to the caller.
 * 
 * + `proposal_weight_bound`: The maximum amount of weight consumed by executing the closed
 * proposal.
 * + `length_bound`: The upper bound for the length of the proposal in storage. Checked via
 * `storage::read` so it is `size_of::<u32>() == 4` larger than the pure length.
 * 
 * # <weight>
 * ## Weight
 * - `O(B + M + P1 + P2)` where:
 *   - `B` is `proposal` size in bytes (length-fee-bounded)
 *   - `M` is members-count (code- and governance-bounded)
 *   - `P1` is the complexity of `proposal` preimage.
 *   - `P2` is proposal-count (code-bounded)
 * - DB:
 *  - 2 storage reads (`Members`: codec `O(M)`, `Prime`: codec `O(1)`)
 *  - 3 mutations (`Voting`: codec `O(M)`, `ProposalOf`: codec `O(B)`, `Proposals`: codec
 *    `O(P2)`)
 *  - any mutations done while executing `proposal` (`P1`)
 * - up to 3 events
 * # </weight>
 */
export type TechnicalCommitteeCloseOldWeightCall = {
    proposalHash: H256,
    index: number,
    proposalWeightBound: bigint,
    lengthBound: number,
}

export const TechnicalCommitteeCloseOldWeightCall: sts.Type<TechnicalCommitteeCloseOldWeightCall> = sts.struct(() => {
    return  {
        proposalHash: H256,
        index: sts.number(),
        proposalWeightBound: sts.bigint(),
        lengthBound: sts.number(),
    }
})

/**
 * Close a vote that is either approved, disapproved or whose voting period has ended.
 * 
 * May be called by any signed account in order to finish voting and close the proposal.
 * 
 * If called before the end of the voting period it will only close the vote if it is
 * has enough votes to be approved or disapproved.
 * 
 * If called after the end of the voting period abstentions are counted as rejections
 * unless there is a prime member set and the prime member cast an approval.
 * 
 * If the close operation completes successfully with disapproval, the transaction fee will
 * be waived. Otherwise execution of the approved operation will be charged to the caller.
 * 
 * + `proposal_weight_bound`: The maximum amount of weight consumed by executing the closed
 * proposal.
 * + `length_bound`: The upper bound for the length of the proposal in storage. Checked via
 * `storage::read` so it is `size_of::<u32>() == 4` larger than the pure length.
 * 
 * # <weight>
 * ## Weight
 * - `O(B + M + P1 + P2)` where:
 *   - `B` is `proposal` size in bytes (length-fee-bounded)
 *   - `M` is members-count (code- and governance-bounded)
 *   - `P1` is the complexity of `proposal` preimage.
 *   - `P2` is proposal-count (code-bounded)
 * - DB:
 *  - 2 storage reads (`Members`: codec `O(M)`, `Prime`: codec `O(1)`)
 *  - 3 mutations (`Voting`: codec `O(M)`, `ProposalOf`: codec `O(B)`, `Proposals`: codec
 *    `O(P2)`)
 *  - any mutations done while executing `proposal` (`P1`)
 * - up to 3 events
 * # </weight>
 */
export type TechnicalCommitteeCloseCall = {
    proposalHash: H256,
    index: number,
    proposalWeightBound: Weight,
    lengthBound: number,
}

export const TechnicalCommitteeCloseCall: sts.Type<TechnicalCommitteeCloseCall> = sts.struct(() => {
    return  {
        proposalHash: H256,
        index: sts.number(),
        proposalWeightBound: Weight,
        lengthBound: sts.number(),
    }
})

/**
 * A single member did some action; result will be `Ok` if it returned without error.
 */
export type TechnicalCommitteeMemberExecutedEvent = {
    proposalHash: H256,
    result: Type_60,
}

export const TechnicalCommitteeMemberExecutedEvent: sts.Type<TechnicalCommitteeMemberExecutedEvent> = sts.struct(() => {
    return  {
        proposalHash: H256,
        result: Type_60,
    }
})

/**
 * A motion was executed; result will be `Ok` if it returned without error.
 */
export type TechnicalCommitteeExecutedEvent = {
    proposalHash: H256,
    result: Type_60,
}

export const TechnicalCommitteeExecutedEvent: sts.Type<TechnicalCommitteeExecutedEvent> = sts.struct(() => {
    return  {
        proposalHash: H256,
        result: Type_60,
    }
})
