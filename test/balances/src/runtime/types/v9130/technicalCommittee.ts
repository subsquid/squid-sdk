import {sts} from '../../pallet.support'
import {Call, AccountId32, H256, Type_49} from './types'

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
 * A motion (given hash) has been voted on by given account, leaving
 * a tally (yes votes and no votes given respectively as `MemberCount`).
 */
export type TechnicalCommitteeVotedEvent = {
    account: AccountId32,
    proposalHash: H256,
    voted: boolean,
    yes: number,
    no: number,
}

export const TechnicalCommitteeVotedEvent: sts.Type<TechnicalCommitteeVotedEvent> = sts.struct(() => {
    return  {
        account: AccountId32,
        proposalHash: H256,
        voted: sts.boolean(),
        yes: sts.number(),
        no: sts.number(),
    }
})

/**
 * A motion (given hash) has been proposed (by given account) with a threshold (given
 * `MemberCount`).
 */
export type TechnicalCommitteeProposedEvent = {
    account: AccountId32,
    proposalIndex: number,
    proposalHash: H256,
    threshold: number,
}

export const TechnicalCommitteeProposedEvent: sts.Type<TechnicalCommitteeProposedEvent> = sts.struct(() => {
    return  {
        account: AccountId32,
        proposalIndex: sts.number(),
        proposalHash: H256,
        threshold: sts.number(),
    }
})

/**
 * A single member did some action; result will be `Ok` if it returned without error.
 */
export type TechnicalCommitteeMemberExecutedEvent = {
    proposalHash: H256,
    result: Type_49,
}

export const TechnicalCommitteeMemberExecutedEvent: sts.Type<TechnicalCommitteeMemberExecutedEvent> = sts.struct(() => {
    return  {
        proposalHash: H256,
        result: Type_49,
    }
})

/**
 * A motion was executed; result will be `Ok` if it returned without error.
 */
export type TechnicalCommitteeExecutedEvent = {
    proposalHash: H256,
    result: Type_49,
}

export const TechnicalCommitteeExecutedEvent: sts.Type<TechnicalCommitteeExecutedEvent> = sts.struct(() => {
    return  {
        proposalHash: H256,
        result: Type_49,
    }
})

/**
 * A motion was not approved by the required threshold.
 */
export type TechnicalCommitteeDisapprovedEvent = {
    proposalHash: H256,
}

export const TechnicalCommitteeDisapprovedEvent: sts.Type<TechnicalCommitteeDisapprovedEvent> = sts.struct(() => {
    return  {
        proposalHash: H256,
    }
})

/**
 * A proposal was closed because its threshold was reached or after its duration was up.
 */
export type TechnicalCommitteeClosedEvent = {
    proposalHash: H256,
    yes: number,
    no: number,
}

export const TechnicalCommitteeClosedEvent: sts.Type<TechnicalCommitteeClosedEvent> = sts.struct(() => {
    return  {
        proposalHash: H256,
        yes: sts.number(),
        no: sts.number(),
    }
})

/**
 * A motion was approved by the required threshold.
 */
export type TechnicalCommitteeApprovedEvent = {
    proposalHash: H256,
}

export const TechnicalCommitteeApprovedEvent: sts.Type<TechnicalCommitteeApprovedEvent> = sts.struct(() => {
    return  {
        proposalHash: H256,
    }
})
