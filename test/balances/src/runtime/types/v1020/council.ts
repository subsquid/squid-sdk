import {sts} from '../../pallet.support'
import {Hash, AccountId, Proposal, MemberCount, ProposalIndex} from './types'

/**
 *  # <weight>
 *  - Bounded storage read and writes.
 *  - Will be slightly heavier if the proposal is approved / disapproved after the vote.
 *  # </weight>
 */
export type CouncilVoteCall = {
    proposal: Hash,
    index: number,
    approve: boolean,
}

export const CouncilVoteCall: sts.Type<CouncilVoteCall> = sts.struct(() => {
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
export type CouncilSetMembersCall = {
    new_members: AccountId[],
}

export const CouncilSetMembersCall: sts.Type<CouncilSetMembersCall> = sts.struct(() => {
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
export type CouncilProposeCall = {
    threshold: number,
    proposal: Proposal,
}

export const CouncilProposeCall: sts.Type<CouncilProposeCall> = sts.struct(() => {
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
export type CouncilExecuteCall = {
    proposal: Proposal,
}

export const CouncilExecuteCall: sts.Type<CouncilExecuteCall> = sts.struct(() => {
    return  {
        proposal: Proposal,
    }
})

/**
 *  A motion (given hash) has been voted on by given account, leaving
 *  a tally (yes votes and no votes given respectively as `MemberCount`).
 */
export type CouncilVotedEvent = [AccountId, Hash, boolean, MemberCount, MemberCount]

export const CouncilVotedEvent: sts.Type<CouncilVotedEvent> = sts.tuple(() => AccountId, Hash, sts.boolean(), MemberCount, MemberCount)

/**
 *  A motion (given hash) has been proposed (by given account) with a threshold (given
 *  `MemberCount`).
 */
export type CouncilProposedEvent = [AccountId, ProposalIndex, Hash, MemberCount]

export const CouncilProposedEvent: sts.Type<CouncilProposedEvent> = sts.tuple(() => AccountId, ProposalIndex, Hash, MemberCount)

/**
 *  A single member did some action; `bool` is true if returned without error.
 */
export type CouncilMemberExecutedEvent = [Hash, boolean]

export const CouncilMemberExecutedEvent: sts.Type<CouncilMemberExecutedEvent> = sts.tuple(() => Hash, sts.boolean())

/**
 *  A motion was executed; `bool` is true if returned without error.
 */
export type CouncilExecutedEvent = [Hash, boolean]

export const CouncilExecutedEvent: sts.Type<CouncilExecutedEvent> = sts.tuple(() => Hash, sts.boolean())

/**
 *  A motion was not approved by the required threshold.
 */
export type CouncilDisapprovedEvent = [Hash]

export const CouncilDisapprovedEvent: sts.Type<CouncilDisapprovedEvent> = sts.tuple(() => Hash)

/**
 *  A motion was approved by the required threshold.
 */
export type CouncilApprovedEvent = [Hash]

export const CouncilApprovedEvent: sts.Type<CouncilApprovedEvent> = sts.tuple(() => Hash)
