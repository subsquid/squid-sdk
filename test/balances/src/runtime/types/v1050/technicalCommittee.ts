import {sts} from '../../pallet.support'
import {AccountId, Proposal, Hash, MemberCount} from './types'

/**
 *  Set the collective's membership.
 * 
 *  - `new_members`: The new member list. Be nice to the chain and
 *  - `prime`: The prime member whose vote sets the default.
 * 
 *  Requires root origin.
 */
export type TechnicalCommitteeSetMembersCall = {
    new_members: AccountId[],
    prime?: (AccountId | undefined),
}

export const TechnicalCommitteeSetMembersCall: sts.Type<TechnicalCommitteeSetMembersCall> = sts.struct(() => {
    return  {
        new_members: sts.array(() => AccountId),
        prime: sts.option(() => AccountId),
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
 *  May be called by any signed account after the voting duration has ended in order to
 *  finish voting and close the proposal.
 * 
 *  Abstentions are counted as rejections unless there is a prime member set and the prime
 *  member cast an approval.
 * 
 *  - the weight of `proposal` preimage.
 *  - up to three events deposited.
 *  - one read, two removals, one mutation. (plus three static reads.)
 *  - computation and i/o `O(P + L + M)` where:
 *    - `M` is number of members,
 *    - `P` is number of active proposals,
 *    - `L` is the encoded length of `proposal` preimage.
 */
export type TechnicalCommitteeCloseCall = {
    proposal: Hash,
    index: number,
}

export const TechnicalCommitteeCloseCall: sts.Type<TechnicalCommitteeCloseCall> = sts.struct(() => {
    return  {
        proposal: Hash,
        index: sts.number(),
    }
})

/**
 *  A proposal was closed after its duration was up.
 */
export type TechnicalCommitteeClosedEvent = [Hash, MemberCount, MemberCount]

export const TechnicalCommitteeClosedEvent: sts.Type<TechnicalCommitteeClosedEvent> = sts.tuple(() => Hash, MemberCount, MemberCount)
