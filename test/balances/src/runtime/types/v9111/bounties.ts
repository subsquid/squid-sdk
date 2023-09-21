import {sts} from '../../pallet.support'
import {MultiAddress} from './types'

/**
 * Unassign curator from a bounty.
 * 
 * This function can only be called by the `RejectOrigin` a signed origin.
 * 
 * If this function is called by the `RejectOrigin`, we assume that the curator is
 * malicious or inactive. As a result, we will slash the curator when possible.
 * 
 * If the origin is the curator, we take this as a sign they are unable to do their job and
 * they willingly give up. We could slash them, but for now we allow them to recover their
 * deposit and exit without issue. (We may want to change this if it is abused.)
 * 
 * Finally, the origin can be anyone if and only if the curator is "inactive". This allows
 * anyone in the community to call out that a curator is not doing their due diligence, and
 * we should pick a new curator. In this case the curator should also be slashed.
 * 
 * # <weight>
 * - O(1).
 * # </weight>
 */
export type BountiesUnassignCuratorCall = {
    bountyId: number,
}

export const BountiesUnassignCuratorCall: sts.Type<BountiesUnassignCuratorCall> = sts.struct(() => {
    return  {
        bountyId: sts.number(),
    }
})

/**
 * Assign a curator to a funded bounty.
 * 
 * May only be called from `T::ApproveOrigin`.
 * 
 * # <weight>
 * - O(1).
 * # </weight>
 */
export type BountiesProposeCuratorCall = {
    bountyId: number,
    curator: MultiAddress,
    fee: bigint,
}

export const BountiesProposeCuratorCall: sts.Type<BountiesProposeCuratorCall> = sts.struct(() => {
    return  {
        bountyId: sts.number(),
        curator: MultiAddress,
        fee: sts.bigint(),
    }
})

/**
 * Extend the expiry time of an active bounty.
 * 
 * The dispatch origin for this call must be the curator of this bounty.
 * 
 * - `bounty_id`: Bounty ID to extend.
 * - `remark`: additional information.
 * 
 * # <weight>
 * - O(1).
 * # </weight>
 */
export type BountiesExtendBountyExpiryCall = {
    bountyId: number,
    remark: Bytes,
}

export const BountiesExtendBountyExpiryCall: sts.Type<BountiesExtendBountyExpiryCall> = sts.struct(() => {
    return  {
        bountyId: sts.number(),
        remark: sts.bytes(),
    }
})

/**
 * Cancel a proposed or active bounty. All the funds will be sent to treasury and
 * the curator deposit will be unreserved if possible.
 * 
 * Only `T::RejectOrigin` is able to cancel a bounty.
 * 
 * - `bounty_id`: Bounty ID to cancel.
 * 
 * # <weight>
 * - O(1).
 * # </weight>
 */
export type BountiesCloseBountyCall = {
    bountyId: number,
}

export const BountiesCloseBountyCall: sts.Type<BountiesCloseBountyCall> = sts.struct(() => {
    return  {
        bountyId: sts.number(),
    }
})

/**
 * Claim the payout from an awarded bounty after payout delay.
 * 
 * The dispatch origin for this call must be the beneficiary of this bounty.
 * 
 * - `bounty_id`: Bounty ID to claim.
 * 
 * # <weight>
 * - O(1).
 * # </weight>
 */
export type BountiesClaimBountyCall = {
    bountyId: number,
}

export const BountiesClaimBountyCall: sts.Type<BountiesClaimBountyCall> = sts.struct(() => {
    return  {
        bountyId: sts.number(),
    }
})

/**
 * Award bounty to a beneficiary account. The beneficiary will be able to claim the funds
 * after a delay.
 * 
 * The dispatch origin for this call must be the curator of this bounty.
 * 
 * - `bounty_id`: Bounty ID to award.
 * - `beneficiary`: The beneficiary account whom will receive the payout.
 * 
 * # <weight>
 * - O(1).
 * # </weight>
 */
export type BountiesAwardBountyCall = {
    bountyId: number,
    beneficiary: MultiAddress,
}

export const BountiesAwardBountyCall: sts.Type<BountiesAwardBountyCall> = sts.struct(() => {
    return  {
        bountyId: sts.number(),
        beneficiary: MultiAddress,
    }
})

/**
 * Approve a bounty proposal. At a later time, the bounty will be funded and become active
 * and the original deposit will be returned.
 * 
 * May only be called from `T::ApproveOrigin`.
 * 
 * # <weight>
 * - O(1).
 * # </weight>
 */
export type BountiesApproveBountyCall = {
    bountyId: number,
}

export const BountiesApproveBountyCall: sts.Type<BountiesApproveBountyCall> = sts.struct(() => {
    return  {
        bountyId: sts.number(),
    }
})

/**
 * Accept the curator role for a bounty.
 * A deposit will be reserved from curator and refund upon successful payout.
 * 
 * May only be called from the curator.
 * 
 * # <weight>
 * - O(1).
 * # </weight>
 */
export type BountiesAcceptCuratorCall = {
    bountyId: number,
}

export const BountiesAcceptCuratorCall: sts.Type<BountiesAcceptCuratorCall> = sts.struct(() => {
    return  {
        bountyId: sts.number(),
    }
})
