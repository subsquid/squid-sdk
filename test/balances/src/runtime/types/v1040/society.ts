import {sts} from '../../pallet.support'
import {AccountId, BalanceOf, LookupSource, SocietyJudgement, Balance} from './types'

/**
 *  As a member, vouch for someone to join society by placing a bid on their behalf.
 * 
 *  There is no deposit required to vouch for a new bid, but a member can only vouch for
 *  one bid at a time. If the bid becomes a suspended candidate and ultimately rejected by
 *  the suspension judgement origin, the member will be banned from vouching again.
 * 
 *  As a vouching member, you can claim a tip if the candidate is accepted. This tip will
 *  be paid as a portion of the reward the member will receive for joining the society.
 * 
 *  The dispatch origin for this call must be _Signed_ and a member.
 * 
 *  Parameters:
 *  - `who`: The user who you would like to vouch for.
 *  - `value`: The total reward to be paid between you and the candidate if they become
 *  a member in the society.
 *  - `tip`: Your cut of the total `value` payout when the candidate is inducted into
 *  the society. Tips larger than `value` will be saturated upon payout.
 * 
 *  # <weight>
 *  Key: B (len of bids), C (len of candidates), M (len of members)
 *  - Storage Reads:
 *  	- One storage read to retrieve all members. O(M)
 *  	- One storage read to check member is not already vouching. O(1)
 *  	- One storage read to check for suspended candidate. O(1)
 *  	- One storage read to check for suspended member. O(1)
 *  	- One storage read to retrieve all current bids. O(B)
 *  	- One storage read to retrieve all current candidates. O(C)
 *  - Storage Writes:
 *  	- One storage write to insert vouching status to the member. O(1)
 *  	- One storage mutate to add a new bid to the vector O(B) (TODO: possible optimization w/ read)
 *  	- Up to one storage removal if bid.len() > MAX_BID_COUNT. O(1)
 *  - Notable Computation:
 *  	- O(log M) search to check sender is a member.
 *  	- O(B + C + log M) search to check user is not already a part of society.
 *  	- O(log B) search to insert the new bid sorted.
 *  - External Module Operations:
 *  	- One balance reserve operation. O(X)
 *  	- Up to one balance unreserve operation if bids.len() > MAX_BID_COUNT.
 *  - Events:
 *  	- One event for vouch.
 *  	- Up to one event for AutoUnbid if bid.len() > MAX_BID_COUNT.
 * 
 *  Total Complexity: O(M + B + C + logM + logB + X)
 *  # </weight>
 */
export type SocietyVouchCall = {
    who: AccountId,
    value: BalanceOf,
    tip: BalanceOf,
}

export const SocietyVouchCall: sts.Type<SocietyVouchCall> = sts.struct(() => {
    return  {
        who: AccountId,
        value: BalanceOf,
        tip: BalanceOf,
    }
})

/**
 *  As a member, vote on a candidate.
 * 
 *  The dispatch origin for this call must be _Signed_ and a member.
 * 
 *  Parameters:
 *  - `candidate`: The candidate that the member would like to bid on.
 *  - `approve`: A boolean which says if the candidate should be
 *               approved (`true`) or rejected (`false`).
 * 
 *  # <weight>
 *  Key: C (len of candidates), M (len of members)
 *  - One storage read O(M) and O(log M) search to check user is a member.
 *  - One account lookup.
 *  - One storage read O(C) and O(C) search to check that user is a candidate.
 *  - One storage write to add vote to votes. O(1)
 *  - One event.
 * 
 *  Total Complexity: O(M + logM + C)
 *  # </weight>
 */
export type SocietyVoteCall = {
    candidate: LookupSource,
    approve: boolean,
}

export const SocietyVoteCall: sts.Type<SocietyVoteCall> = sts.struct(() => {
    return  {
        candidate: LookupSource,
        approve: sts.boolean(),
    }
})

/**
 *  As a vouching member, unvouch a bid. This only works while vouched user is
 *  only a bidder (and not a candidate).
 * 
 *  The dispatch origin for this call must be _Signed_ and a vouching member.
 * 
 *  Parameters:
 *  - `pos`: Position in the `Bids` vector of the bid who should be unvouched.
 * 
 *  # <weight>
 *  Key: B (len of bids)
 *  - One storage read O(1) to check the signer is a vouching member.
 *  - One storage mutate to retrieve and update the bids. O(B)
 *  - One vouching storage removal. O(1)
 *  - One event.
 * 
 *  Total Complexity: O(B)
 *  # </weight>
 */
export type SocietyUnvouchCall = {
    pos: number,
}

export const SocietyUnvouchCall: sts.Type<SocietyUnvouchCall> = sts.struct(() => {
    return  {
        pos: sts.number(),
    }
})

/**
 *  A bidder can remove their bid for entry into society.
 *  By doing so, they will have their candidate deposit returned or
 *  they will unvouch their voucher.
 * 
 *  Payment: The bid deposit is unreserved if the user made a bid.
 * 
 *  The dispatch origin for this call must be _Signed_ and a bidder.
 * 
 *  Parameters:
 *  - `pos`: Position in the `Bids` vector of the bid who wants to unbid.
 * 
 *  # <weight>
 *  Key: B (len of bids), X (balance unreserve)
 *  - One storage read and write to retrieve and update the bids. O(B)
 *  - Either one unreserve balance action O(X) or one vouching storage removal. O(1)
 *  - One event.
 * 
 *  Total Complexity: O(B + X)
 *  # </weight>
 */
export type SocietyUnbidCall = {
    pos: number,
}

export const SocietyUnbidCall: sts.Type<SocietyUnbidCall> = sts.struct(() => {
    return  {
        pos: sts.number(),
    }
})

/**
 *  Allows root origin to change the maximum number of members in society.
 *  Max membership count must be greater than 1.
 * 
 *  The dispatch origin for this call must be from _ROOT_.
 * 
 *  Parameters:
 *  - `max` - The maximum number of members for the society.
 * 
 *  # <weight>
 *  - One storage write to update the max. O(1)
 *  - One event.
 * 
 *  Total Complexity: O(1)
 *  # </weight>
 */
export type SocietySetMaxMembersCall = {
    max: number,
}

export const SocietySetMaxMembersCall: sts.Type<SocietySetMaxMembersCall> = sts.struct(() => {
    return  {
        max: sts.number(),
    }
})

/**
 *  Transfer the first matured payout for the sender and remove it from the records.
 * 
 *  NOTE: This extrinsic needs to be called multiple times to claim multiple matured payouts.
 * 
 *  Payment: The member will receive a payment equal to their first matured
 *  payout to their free balance.
 * 
 *  The dispatch origin for this call must be _Signed_ and a member with
 *  payouts remaining.
 * 
 *  # <weight>
 *  Key: M (len of members), P (number of payouts for a particular member)
 *  - One storage read O(M) and O(log M) search to check signer is a member.
 *  - One storage read O(P) to get all payouts for a member.
 *  - One storage read O(1) to get the current block number.
 *  - One currency transfer call. O(X)
 *  - One storage write or removal to update the member's payouts. O(P)
 * 
 *  Total Complexity: O(M + logM + P + X)
 *  # </weight>
 */
export type SocietyPayoutCall = null

export const SocietyPayoutCall: sts.Type<SocietyPayoutCall> = sts.unit()

/**
 *  Allow suspension judgement origin to make judgement on a suspended member.
 * 
 *  If a suspended member is forgiven, we simply add them back as a member, not affecting
 *  any of the existing storage items for that member.
 * 
 *  If a suspended member is rejected, remove all associated storage items, including
 *  their payouts, and remove any vouched bids they currently have.
 * 
 *  The dispatch origin for this call must be from the _SuspensionJudgementOrigin_.
 * 
 *  Parameters:
 *  - `who` - The suspended member to be judged.
 *  - `forgive` - A boolean representing whether the suspension judgement origin
 *                forgives (`true`) or rejects (`false`) a suspended member.
 * 
 *  # <weight>
 *  Key: B (len of bids), M (len of members)
 *  - One storage read to check `who` is a suspended member. O(1)
 *  - Up to one storage write O(M) with O(log M) binary search to add a member back to society.
 *  - Up to 3 storage removals O(1) to clean up a removed member.
 *  - Up to one storage write O(B) with O(B) search to remove vouched bid from bids.
 *  - Up to one additional event if unvouch takes place.
 *  - One storage removal. O(1)
 *  - One event for the judgement.
 * 
 *  Total Complexity: O(M + logM + B)
 *  # </weight>
 */
export type SocietyJudgeSuspendedMemberCall = {
    who: AccountId,
    forgive: boolean,
}

export const SocietyJudgeSuspendedMemberCall: sts.Type<SocietyJudgeSuspendedMemberCall> = sts.struct(() => {
    return  {
        who: AccountId,
        forgive: sts.boolean(),
    }
})

/**
 *  Allow suspended judgement origin to make judgement on a suspended candidate.
 * 
 *  If the judgement is `Approve`, we add them to society as a member with the appropriate
 *  payment for joining society.
 * 
 *  If the judgement is `Reject`, we either slash the deposit of the bid, giving it back
 *  to the society treasury, or we ban the voucher from vouching again.
 * 
 *  If the judgement is `Rebid`, we put the candidate back in the bid pool and let them go
 *  through the induction process again.
 * 
 *  The dispatch origin for this call must be from the _SuspensionJudgementOrigin_.
 * 
 *  Parameters:
 *  - `who` - The suspended candidate to be judged.
 *  - `judgement` - `Approve`, `Reject`, or `Rebid`.
 * 
 *  # <weight>
 *  Key: B (len of bids), M (len of members), X (balance action)
 *  - One storage read to check `who` is a suspended candidate.
 *  - One storage removal of the suspended candidate.
 *  - Approve Logic
 *  	- One storage read to get the available pot to pay users with. O(1)
 *  	- One storage write to update the available pot. O(1)
 *  	- One storage read to get the current block number. O(1)
 *  	- One storage read to get all members. O(M)
 *  	- Up to one unreserve currency action.
 *  	- Up to two new storage writes to payouts.
 *  	- Up to one storage write with O(log M) binary search to add a member to society.
 *  - Reject Logic
 *  	- Up to one repatriate reserved currency action. O(X)
 *  	- Up to one storage write to ban the vouching member from vouching again.
 *  - Rebid Logic
 *  	- Storage mutate with O(log B) binary search to place the user back into bids.
 *  - Up to one additional event if unvouch takes place.
 *  - One storage removal.
 *  - One event for the judgement.
 * 
 *  Total Complexity: O(M + logM + B + X)
 *  # </weight>
 */
export type SocietyJudgeSuspendedCandidateCall = {
    who: AccountId,
    judgement: SocietyJudgement,
}

export const SocietyJudgeSuspendedCandidateCall: sts.Type<SocietyJudgeSuspendedCandidateCall> = sts.struct(() => {
    return  {
        who: AccountId,
        judgement: SocietyJudgement,
    }
})

/**
 *  Found the society.
 * 
 *  This is done as a discrete action in order to allow for the
 *  module to be included into a running chain and can only be done once.
 * 
 *  The dispatch origin for this call must be from the _FounderSetOrigin_.
 * 
 *  Parameters:
 *  - `founder` - The first member and head of the newly founded society.
 * 
 *  # <weight>
 *  - Two storage mutates to set `Head` and `Founder`. O(1)
 *  - One storage write to add the first member to society. O(1)
 *  - One event.
 * 
 *  Total Complexity: O(1)
 *  # </weight>
 */
export type SocietyFoundCall = {
    founder: AccountId,
}

export const SocietyFoundCall: sts.Type<SocietyFoundCall> = sts.struct(() => {
    return  {
        founder: AccountId,
    }
})

/**
 *  As a member, vote on the defender.
 * 
 *  The dispatch origin for this call must be _Signed_ and a member.
 * 
 *  Parameters:
 *  - `approve`: A boolean which says if the candidate should be
 *  approved (`true`) or rejected (`false`).
 * 
 *  # <weight>
 *  - Key: M (len of members)
 *  - One storage read O(M) and O(log M) search to check user is a member.
 *  - One storage write to add vote to votes. O(1)
 *  - One event.
 * 
 *  Total Complexity: O(M + logM)
 *  # </weight>
 */
export type SocietyDefenderVoteCall = {
    approve: boolean,
}

export const SocietyDefenderVoteCall: sts.Type<SocietyDefenderVoteCall> = sts.struct(() => {
    return  {
        approve: sts.boolean(),
    }
})

/**
 *  A user outside of the society can make a bid for entry.
 * 
 *  Payment: `CandidateDeposit` will be reserved for making a bid. It is returned
 *  when the bid becomes a member, or if the bid calls `unbid`.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Parameters:
 *  - `value`: A one time payment the bid would like to receive when joining the society.
 * 
 *  # <weight>
 *  Key: B (len of bids), C (len of candidates), M (len of members), X (balance reserve)
 *  - Storage Reads:
 *  	- One storage read to check for suspended candidate. O(1)
 *  	- One storage read to check for suspended member. O(1)
 *  	- One storage read to retrieve all current bids. O(B)
 *  	- One storage read to retrieve all current candidates. O(C)
 *  	- One storage read to retrieve all members. O(M)
 *  - Storage Writes:
 *  	- One storage mutate to add a new bid to the vector O(B) (TODO: possible optimization w/ read)
 *  	- Up to one storage removal if bid.len() > MAX_BID_COUNT. O(1)
 *  - Notable Computation:
 *  	- O(B + C + log M) search to check user is not already a part of society.
 *  	- O(log B) search to insert the new bid sorted.
 *  - External Module Operations:
 *  	- One balance reserve operation. O(X)
 *  	- Up to one balance unreserve operation if bids.len() > MAX_BID_COUNT.
 *  - Events:
 *  	- One event for new bid.
 *  	- Up to one event for AutoUnbid if bid.len() > MAX_BID_COUNT.
 * 
 *  Total Complexity: O(M + B + C + logM + logB + X)
 *  # </weight>
 */
export type SocietyBidCall = {
    value: BalanceOf,
}

export const SocietyBidCall: sts.Type<SocietyBidCall> = sts.struct(() => {
    return  {
        value: BalanceOf,
    }
})

/**
 *  A membership bid just happened by vouching. The given account is the candidate's ID and
 *  their offer is the second. The vouching party is the third.
 */
export type SocietyVouchEvent = [AccountId, Balance, AccountId]

export const SocietyVouchEvent: sts.Type<SocietyVouchEvent> = sts.tuple(() => AccountId, Balance, AccountId)

/**
 *  A vote has been placed (candidate, voter, vote)
 */
export type SocietyVoteEvent = [AccountId, AccountId, boolean]

export const SocietyVoteEvent: sts.Type<SocietyVoteEvent> = sts.tuple(() => AccountId, AccountId, sts.boolean())

/**
 *  A candidate was dropped (by request of who vouched for them).
 */
export type SocietyUnvouchEvent = [AccountId]

export const SocietyUnvouchEvent: sts.Type<SocietyUnvouchEvent> = sts.tuple(() => AccountId)

/**
 *  A candidate was dropped (by their request).
 */
export type SocietyUnbidEvent = [AccountId]

export const SocietyUnbidEvent: sts.Type<SocietyUnbidEvent> = sts.tuple(() => AccountId)

/**
 *  A suspended member has been judged
 */
export type SocietySuspendedMemberJudgementEvent = [AccountId, boolean]

export const SocietySuspendedMemberJudgementEvent: sts.Type<SocietySuspendedMemberJudgementEvent> = sts.tuple(() => AccountId, sts.boolean())

/**
 *  A new max member count has been set
 */
export type SocietyNewMaxMembersEvent = [number]

export const SocietyNewMaxMembersEvent: sts.Type<SocietyNewMaxMembersEvent> = sts.tuple(() => sts.number())

/**
 *  A member has been suspended
 */
export type SocietyMemberSuspendedEvent = [AccountId]

export const SocietyMemberSuspendedEvent: sts.Type<SocietyMemberSuspendedEvent> = sts.tuple(() => AccountId)

/**
 *  A group of candidates have been inducted. The batch's primary is the first value, the
 *  batch in full is the second.
 */
export type SocietyInductedEvent = [AccountId, AccountId[]]

export const SocietyInductedEvent: sts.Type<SocietyInductedEvent> = sts.tuple(() => AccountId, sts.array(() => AccountId))

/**
 *  The society is founded by the given identity.
 */
export type SocietyFoundedEvent = [AccountId]

export const SocietyFoundedEvent: sts.Type<SocietyFoundedEvent> = sts.tuple(() => AccountId)

/**
 *  A vote has been placed for a defending member (voter, vote)
 */
export type SocietyDefenderVoteEvent = [AccountId, boolean]

export const SocietyDefenderVoteEvent: sts.Type<SocietyDefenderVoteEvent> = sts.tuple(() => AccountId, sts.boolean())

/**
 *  A member has been challenged
 */
export type SocietyChallengedEvent = [AccountId]

export const SocietyChallengedEvent: sts.Type<SocietyChallengedEvent> = sts.tuple(() => AccountId)

/**
 *  A candidate has been suspended
 */
export type SocietyCandidateSuspendedEvent = [AccountId]

export const SocietyCandidateSuspendedEvent: sts.Type<SocietyCandidateSuspendedEvent> = sts.tuple(() => AccountId)

/**
 *  A membership bid just happened. The given account is the candidate's ID and their offer
 *  is the second.
 */
export type SocietyBidEvent = [AccountId, Balance]

export const SocietyBidEvent: sts.Type<SocietyBidEvent> = sts.tuple(() => AccountId, Balance)

/**
 *  A candidate was dropped (due to an excess of bids in the system).
 */
export type SocietyAutoUnbidEvent = [AccountId]

export const SocietyAutoUnbidEvent: sts.Type<SocietyAutoUnbidEvent> = sts.tuple(() => AccountId)
