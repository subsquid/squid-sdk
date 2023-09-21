import {sts} from '../../pallet.support'
import {LookupSource, BountyIndex, Balance, AccountId} from './types'

/**
 *  Unassign curator from a bounty.
 * 
 *  This function can only be called by the `RejectOrigin` a signed origin.
 * 
 *  If this function is called by the `RejectOrigin`, we assume that the curator is malicious
 *  or inactive. As a result, we will slash the curator when possible.
 * 
 *  If the origin is the curator, we take this as a sign they are unable to do their job and
 *  they willingly give up. We could slash them, but for now we allow them to recover their
 *  deposit and exit without issue. (We may want to change this if it is abused.)
 * 
 *  Finally, the origin can be anyone if and only if the curator is "inactive". This allows
 *  anyone in the community to call out that a curator is not doing their due diligence, and
 *  we should pick a new curator. In this case the curator should also be slashed.
 * 
 *  # <weight>
 *  - O(1).
 *  # </weight>
 */
export type BountiesUnassignCuratorCall = {
    bounty_id: number,
}

export const BountiesUnassignCuratorCall: sts.Type<BountiesUnassignCuratorCall> = sts.struct(() => {
    return  {
        bounty_id: sts.number(),
    }
})

/**
 *  Assign a curator to a funded bounty.
 * 
 *  May only be called from `T::ApproveOrigin`.
 * 
 *  # <weight>
 *  - O(1).
 *  # </weight>
 */
export type BountiesProposeCuratorCall = {
    bounty_id: number,
    curator: LookupSource,
    fee: bigint,
}

export const BountiesProposeCuratorCall: sts.Type<BountiesProposeCuratorCall> = sts.struct(() => {
    return  {
        bounty_id: sts.number(),
        curator: LookupSource,
        fee: sts.bigint(),
    }
})

/**
 *  Propose a new bounty.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Payment: `TipReportDepositBase` will be reserved from the origin account, as well as
 *  `DataDepositPerByte` for each byte in `reason`. It will be unreserved upon approval,
 *  or slashed when rejected.
 * 
 *  - `curator`: The curator account whom will manage this bounty.
 *  - `fee`: The curator fee.
 *  - `value`: The total payment amount of this bounty, curator fee included.
 *  - `description`: The description of this bounty.
 */
export type BountiesProposeBountyCall = {
    value: bigint,
    description: Bytes,
}

export const BountiesProposeBountyCall: sts.Type<BountiesProposeBountyCall> = sts.struct(() => {
    return  {
        value: sts.bigint(),
        description: sts.bytes(),
    }
})

/**
 *  Extend the expiry time of an active bounty.
 * 
 *  The dispatch origin for this call must be the curator of this bounty.
 * 
 *  - `bounty_id`: Bounty ID to extend.
 *  - `remark`: additional information.
 * 
 *  # <weight>
 *  - O(1).
 *  # </weight>
 */
export type BountiesExtendBountyExpiryCall = {
    bounty_id: number,
    _remark: Bytes,
}

export const BountiesExtendBountyExpiryCall: sts.Type<BountiesExtendBountyExpiryCall> = sts.struct(() => {
    return  {
        bounty_id: sts.number(),
        _remark: sts.bytes(),
    }
})

/**
 *  Cancel a proposed or active bounty. All the funds will be sent to treasury and
 *  the curator deposit will be unreserved if possible.
 * 
 *  Only `T::RejectOrigin` is able to cancel a bounty.
 * 
 *  - `bounty_id`: Bounty ID to cancel.
 * 
 *  # <weight>
 *  - O(1).
 *  # </weight>
 */
export type BountiesCloseBountyCall = {
    bounty_id: number,
}

export const BountiesCloseBountyCall: sts.Type<BountiesCloseBountyCall> = sts.struct(() => {
    return  {
        bounty_id: sts.number(),
    }
})

/**
 *  Claim the payout from an awarded bounty after payout delay.
 * 
 *  The dispatch origin for this call must be the beneficiary of this bounty.
 * 
 *  - `bounty_id`: Bounty ID to claim.
 * 
 *  # <weight>
 *  - O(1).
 *  # </weight>
 */
export type BountiesClaimBountyCall = {
    bounty_id: number,
}

export const BountiesClaimBountyCall: sts.Type<BountiesClaimBountyCall> = sts.struct(() => {
    return  {
        bounty_id: sts.number(),
    }
})

/**
 *  Award bounty to a beneficiary account. The beneficiary will be able to claim the funds after a delay.
 * 
 *  The dispatch origin for this call must be the curator of this bounty.
 * 
 *  - `bounty_id`: Bounty ID to award.
 *  - `beneficiary`: The beneficiary account whom will receive the payout.
 * 
 *  # <weight>
 *  - O(1).
 *  # </weight>
 */
export type BountiesAwardBountyCall = {
    bounty_id: number,
    beneficiary: LookupSource,
}

export const BountiesAwardBountyCall: sts.Type<BountiesAwardBountyCall> = sts.struct(() => {
    return  {
        bounty_id: sts.number(),
        beneficiary: LookupSource,
    }
})

/**
 *  Approve a bounty proposal. At a later time, the bounty will be funded and become active
 *  and the original deposit will be returned.
 * 
 *  May only be called from `T::ApproveOrigin`.
 * 
 *  # <weight>
 *  - O(1).
 *  # </weight>
 */
export type BountiesApproveBountyCall = {
    bounty_id: number,
}

export const BountiesApproveBountyCall: sts.Type<BountiesApproveBountyCall> = sts.struct(() => {
    return  {
        bounty_id: sts.number(),
    }
})

/**
 *  Accept the curator role for a bounty.
 *  A deposit will be reserved from curator and refund upon successful payout.
 * 
 *  May only be called from the curator.
 * 
 *  # <weight>
 *  - O(1).
 *  # </weight>
 */
export type BountiesAcceptCuratorCall = {
    bounty_id: number,
}

export const BountiesAcceptCuratorCall: sts.Type<BountiesAcceptCuratorCall> = sts.struct(() => {
    return  {
        bounty_id: sts.number(),
    }
})

/**
 *  A bounty proposal was rejected; funds were slashed. \[index, bond\]
 */
export type BountiesBountyRejectedEvent = [BountyIndex, Balance]

export const BountiesBountyRejectedEvent: sts.Type<BountiesBountyRejectedEvent> = sts.tuple(() => BountyIndex, Balance)

/**
 *  New bounty proposal. \[index\]
 */
export type BountiesBountyProposedEvent = [BountyIndex]

export const BountiesBountyProposedEvent: sts.Type<BountiesBountyProposedEvent> = sts.tuple(() => BountyIndex)

/**
 *  A bounty expiry is extended. \[index\]
 */
export type BountiesBountyExtendedEvent = [BountyIndex]

export const BountiesBountyExtendedEvent: sts.Type<BountiesBountyExtendedEvent> = sts.tuple(() => BountyIndex)

/**
 *  A bounty is claimed by beneficiary. \[index, payout, beneficiary\]
 */
export type BountiesBountyClaimedEvent = [BountyIndex, Balance, AccountId]

export const BountiesBountyClaimedEvent: sts.Type<BountiesBountyClaimedEvent> = sts.tuple(() => BountyIndex, Balance, AccountId)

/**
 *  A bounty is cancelled. \[index\]
 */
export type BountiesBountyCanceledEvent = [BountyIndex]

export const BountiesBountyCanceledEvent: sts.Type<BountiesBountyCanceledEvent> = sts.tuple(() => BountyIndex)

/**
 *  A bounty proposal is funded and became active. \[index\]
 */
export type BountiesBountyBecameActiveEvent = [BountyIndex]

export const BountiesBountyBecameActiveEvent: sts.Type<BountiesBountyBecameActiveEvent> = sts.tuple(() => BountyIndex)

/**
 *  A bounty is awarded to a beneficiary. \[index, beneficiary\]
 */
export type BountiesBountyAwardedEvent = [BountyIndex, AccountId]

export const BountiesBountyAwardedEvent: sts.Type<BountiesBountyAwardedEvent> = sts.tuple(() => BountyIndex, AccountId)
