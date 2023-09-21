import {sts} from '../../pallet.support'
import {Hash, AccountId, Proposal, MemberCount, ProposalIndex} from './types'

/**
 *  # <weight>
 *  - Bounded storage read and writes.
 *  - Will be slightly heavier if the proposal is approved / disapproved after the vote.
 *  # </weight>
 */
export type TechnicalCommitteeVoteCall = {
    proposal: Hash,
    index: number,
    approve: boolean,
}

export const TechnicalCommitteeVoteCall: sts.Type<TechnicalCommitteeVoteCall> = sts.struct(() => {
    return  {
        proposal: Hash,
        index: sts.number(),
        approve: sts.boolean(),
    }
})

/**
 *  Set the collective's membership manually to `new_members`. Be nice to the chain and
 *  provide it pre-sorted.
 * 
 *  Requires root origin.
 */
export type TechnicalCommitteeSetMembersCall = {
    new_members: AccountId[],
}

export const TechnicalCommitteeSetMembersCall: sts.Type<TechnicalCommitteeSetMembersCall> = sts.struct(() => {
    return  {
        new_members: sts.array(() => AccountId),
    }
})

/**
 *  # <weight>
 *  - Bounded storage reads and writes.
 *  - Argument `threshold` has bearing on weight.
 *  # </weight>
 */
export type TechnicalCommitteeProposeCall = {
    threshold: number,
    proposal: Proposal,
}

export const TechnicalCommitteeProposeCall: sts.Type<TechnicalCommitteeProposeCall> = sts.struct(() => {
    return  {
        threshold: sts.number(),
        proposal: Proposal,
    }
})

/**
 *  Dispatch a proposal from a member using the `Member` origin.
 * 
 *  Origin must be a member of the collective.
 */
export type TechnicalCommitteeExecuteCall = {
    proposal: Proposal,
}

export const TechnicalCommitteeExecuteCall: sts.Type<TechnicalCommitteeExecuteCall> = sts.struct(() => {
    return  {
        proposal: Proposal,
    }
})

/**
 *  A motion (given hash) has been voted on by given account, leaving
 *  a tally (yes votes and no votes given respectively as `MemberCount`).
 */
export type TechnicalCommitteeVotedEvent = [AccountId, Hash, boolean, MemberCount, MemberCount]

export const TechnicalCommitteeVotedEvent: sts.Type<TechnicalCommitteeVotedEvent> = sts.tuple(() => AccountId, Hash, sts.boolean(), MemberCount, MemberCount)

/**
 *  A motion (given hash) has been proposed (by given account) with a threshold (given
 *  `MemberCount`).
 */
export type TechnicalCommitteeProposedEvent = [AccountId, ProposalIndex, Hash, MemberCount]

export const TechnicalCommitteeProposedEvent: sts.Type<TechnicalCommitteeProposedEvent> = sts.tuple(() => AccountId, ProposalIndex, Hash, MemberCount)

/**
 *  A single member did some action; `bool` is true if returned without error.
 */
export type TechnicalCommitteeMemberExecutedEvent = [Hash, boolean]

export const TechnicalCommitteeMemberExecutedEvent: sts.Type<TechnicalCommitteeMemberExecutedEvent> = sts.tuple(() => Hash, sts.boolean())

/**
 *  A motion was executed; `bool` is true if returned without error.
 */
export type TechnicalCommitteeExecutedEvent = [Hash, boolean]

export const TechnicalCommitteeExecutedEvent: sts.Type<TechnicalCommitteeExecutedEvent> = sts.tuple(() => Hash, sts.boolean())

/**
 *  A motion was not approved by the required threshold.
 */
export type TechnicalCommitteeDisapprovedEvent = [Hash]

export const TechnicalCommitteeDisapprovedEvent: sts.Type<TechnicalCommitteeDisapprovedEvent> = sts.tuple(() => Hash)

/**
 *  A motion was approved by the required threshold.
 */
export type TechnicalCommitteeApprovedEvent = [Hash]

export const TechnicalCommitteeApprovedEvent: sts.Type<TechnicalCommitteeApprovedEvent> = sts.tuple(() => Hash)
