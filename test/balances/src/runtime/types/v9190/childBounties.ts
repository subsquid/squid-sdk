import {sts} from '../../pallet.support'
import {MultiAddress, AccountId32} from './types'

/**
 * Unassign curator from a child-bounty.
 * 
 * The dispatch origin for this call can be either `RejectOrigin`, or
 * the curator of the parent bounty, or any signed origin.
 * 
 * For the origin other than T::RejectOrigin and the child-bounty
 * curator, parent-bounty must be in active state, for this call to
 * work. We allow child-bounty curator and T::RejectOrigin to execute
 * this call irrespective of the parent-bounty state.
 * 
 * If this function is called by the `RejectOrigin` or the
 * parent-bounty curator, we assume that the child-bounty curator is
 * malicious or inactive. As a result, child-bounty curator deposit is
 * slashed.
 * 
 * If the origin is the child-bounty curator, we take this as a sign
 * that they are unable to do their job, and are willingly giving up.
 * We could slash the deposit, but for now we allow them to unreserve
 * their deposit and exit without issue. (We may want to change this if
 * it is abused.)
 * 
 * Finally, the origin can be anyone iff the child-bounty curator is
 * "inactive". Expiry update due of parent bounty is used to estimate
 * inactive state of child-bounty curator.
 * 
 * This allows anyone in the community to call out that a child-bounty
 * curator is not doing their due diligence, and we should pick a new
 * one. In this case the child-bounty curator deposit is slashed.
 * 
 * State of child-bounty is moved to Added state on successful call
 * completion.
 * 
 * - `parent_bounty_id`: Index of parent bounty.
 * - `child_bounty_id`: Index of child bounty.
 */
export type ChildBountiesUnassignCuratorCall = {
    parentBountyId: number,
    childBountyId: number,
}

export const ChildBountiesUnassignCuratorCall: sts.Type<ChildBountiesUnassignCuratorCall> = sts.struct(() => {
    return  {
        parentBountyId: sts.number(),
        childBountyId: sts.number(),
    }
})

/**
 * Propose curator for funded child-bounty.
 * 
 * The dispatch origin for this call must be curator of parent bounty.
 * 
 * Parent bounty must be in active state, for this child-bounty call to
 * work.
 * 
 * Child-bounty must be in "Added" state, for processing the call. And
 * state of child-bounty is moved to "CuratorProposed" on successful
 * call completion.
 * 
 * - `parent_bounty_id`: Index of parent bounty.
 * - `child_bounty_id`: Index of child bounty.
 * - `curator`: Address of child-bounty curator.
 * - `fee`: payment fee to child-bounty curator for execution.
 */
export type ChildBountiesProposeCuratorCall = {
    parentBountyId: number,
    childBountyId: number,
    curator: MultiAddress,
    fee: bigint,
}

export const ChildBountiesProposeCuratorCall: sts.Type<ChildBountiesProposeCuratorCall> = sts.struct(() => {
    return  {
        parentBountyId: sts.number(),
        childBountyId: sts.number(),
        curator: MultiAddress,
        fee: sts.bigint(),
    }
})

/**
 * Cancel a proposed or active child-bounty. Child-bounty account funds
 * are transferred to parent bounty account. The child-bounty curator
 * deposit may be unreserved if possible.
 * 
 * The dispatch origin for this call must be either parent curator or
 * `T::RejectOrigin`.
 * 
 * If the state of child-bounty is `Active`, curator deposit is
 * unreserved.
 * 
 * If the state of child-bounty is `PendingPayout`, call fails &
 * returns `PendingPayout` error.
 * 
 * For the origin other than T::RejectOrigin, parent bounty must be in
 * active state, for this child-bounty call to work. For origin
 * T::RejectOrigin execution is forced.
 * 
 * Instance of child-bounty is removed from the state on successful
 * call completion.
 * 
 * - `parent_bounty_id`: Index of parent bounty.
 * - `child_bounty_id`: Index of child bounty.
 */
export type ChildBountiesCloseChildBountyCall = {
    parentBountyId: number,
    childBountyId: number,
}

export const ChildBountiesCloseChildBountyCall: sts.Type<ChildBountiesCloseChildBountyCall> = sts.struct(() => {
    return  {
        parentBountyId: sts.number(),
        childBountyId: sts.number(),
    }
})

/**
 * Claim the payout from an awarded child-bounty after payout delay.
 * 
 * The dispatch origin for this call may be any signed origin.
 * 
 * Call works independent of parent bounty state, No need for parent
 * bounty to be in active state.
 * 
 * The Beneficiary is paid out with agreed bounty value. Curator fee is
 * paid & curator deposit is unreserved.
 * 
 * Child-bounty must be in "PendingPayout" state, for processing the
 * call. And instance of child-bounty is removed from the state on
 * successful call completion.
 * 
 * - `parent_bounty_id`: Index of parent bounty.
 * - `child_bounty_id`: Index of child bounty.
 */
export type ChildBountiesClaimChildBountyCall = {
    parentBountyId: number,
    childBountyId: number,
}

export const ChildBountiesClaimChildBountyCall: sts.Type<ChildBountiesClaimChildBountyCall> = sts.struct(() => {
    return  {
        parentBountyId: sts.number(),
        childBountyId: sts.number(),
    }
})

/**
 * Award child-bounty to a beneficiary.
 * 
 * The beneficiary will be able to claim the funds after a delay.
 * 
 * The dispatch origin for this call must be the master curator or
 * curator of this child-bounty.
 * 
 * Parent bounty must be in active state, for this child-bounty call to
 * work.
 * 
 * Child-bounty must be in active state, for processing the call. And
 * state of child-bounty is moved to "PendingPayout" on successful call
 * completion.
 * 
 * - `parent_bounty_id`: Index of parent bounty.
 * - `child_bounty_id`: Index of child bounty.
 * - `beneficiary`: Beneficiary account.
 */
export type ChildBountiesAwardChildBountyCall = {
    parentBountyId: number,
    childBountyId: number,
    beneficiary: MultiAddress,
}

export const ChildBountiesAwardChildBountyCall: sts.Type<ChildBountiesAwardChildBountyCall> = sts.struct(() => {
    return  {
        parentBountyId: sts.number(),
        childBountyId: sts.number(),
        beneficiary: MultiAddress,
    }
})

/**
 * Add a new child-bounty.
 * 
 * The dispatch origin for this call must be the curator of parent
 * bounty and the parent bounty must be in "active" state.
 * 
 * Child-bounty gets added successfully & fund gets transferred from
 * parent bounty to child-bounty account, if parent bounty has enough
 * funds, else the call fails.
 * 
 * Upper bound to maximum number of active  child-bounties that can be
 * added are managed via runtime trait config
 * [`Config::MaxActiveChildBountyCount`].
 * 
 * If the call is success, the status of child-bounty is updated to
 * "Added".
 * 
 * - `parent_bounty_id`: Index of parent bounty for which child-bounty is being added.
 * - `value`: Value for executing the proposal.
 * - `description`: Text description for the child-bounty.
 */
export type ChildBountiesAddChildBountyCall = {
    parentBountyId: number,
    value: bigint,
    description: Bytes,
}

export const ChildBountiesAddChildBountyCall: sts.Type<ChildBountiesAddChildBountyCall> = sts.struct(() => {
    return  {
        parentBountyId: sts.number(),
        value: sts.bigint(),
        description: sts.bytes(),
    }
})

/**
 * Accept the curator role for the child-bounty.
 * 
 * The dispatch origin for this call must be the curator of this
 * child-bounty.
 * 
 * A deposit will be reserved from the curator and refund upon
 * successful payout or cancellation.
 * 
 * Fee for curator is deducted from curator fee of parent bounty.
 * 
 * Parent bounty must be in active state, for this child-bounty call to
 * work.
 * 
 * Child-bounty must be in "CuratorProposed" state, for processing the
 * call. And state of child-bounty is moved to "Active" on successful
 * call completion.
 * 
 * - `parent_bounty_id`: Index of parent bounty.
 * - `child_bounty_id`: Index of child bounty.
 */
export type ChildBountiesAcceptCuratorCall = {
    parentBountyId: number,
    childBountyId: number,
}

export const ChildBountiesAcceptCuratorCall: sts.Type<ChildBountiesAcceptCuratorCall> = sts.struct(() => {
    return  {
        parentBountyId: sts.number(),
        childBountyId: sts.number(),
    }
})

/**
 * A child-bounty is claimed by beneficiary.
 */
export type ChildBountiesClaimedEvent = {
    index: number,
    childIndex: number,
    payout: bigint,
    beneficiary: AccountId32,
}

export const ChildBountiesClaimedEvent: sts.Type<ChildBountiesClaimedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        childIndex: sts.number(),
        payout: sts.bigint(),
        beneficiary: AccountId32,
    }
})

/**
 * A child-bounty is cancelled.
 */
export type ChildBountiesCanceledEvent = {
    index: number,
    childIndex: number,
}

export const ChildBountiesCanceledEvent: sts.Type<ChildBountiesCanceledEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        childIndex: sts.number(),
    }
})

/**
 * A child-bounty is awarded to a beneficiary.
 */
export type ChildBountiesAwardedEvent = {
    index: number,
    childIndex: number,
    beneficiary: AccountId32,
}

export const ChildBountiesAwardedEvent: sts.Type<ChildBountiesAwardedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        childIndex: sts.number(),
        beneficiary: AccountId32,
    }
})

/**
 * A child-bounty is added.
 */
export type ChildBountiesAddedEvent = {
    index: number,
    childIndex: number,
}

export const ChildBountiesAddedEvent: sts.Type<ChildBountiesAddedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        childIndex: sts.number(),
    }
})
