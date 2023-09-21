import {sts} from '../../pallet.support'
import {MultiAddress} from './types'

/**
 * Reject a proposed spend. The original deposit will be slashed.
 * 
 * May only be called from `T::RejectOrigin`.
 * 
 * # <weight>
 * - Complexity: O(1)
 * - DbReads: `Proposals`, `rejected proposer account`
 * - DbWrites: `Proposals`, `rejected proposer account`
 * # </weight>
 */
export type TreasuryRejectProposalCall = {
    proposalId: number,
}

export const TreasuryRejectProposalCall: sts.Type<TreasuryRejectProposalCall> = sts.struct(() => {
    return  {
        proposalId: sts.number(),
    }
})

/**
 * Put forward a suggestion for spending. A deposit proportional to the value
 * is reserved and slashed if the proposal is rejected. It is returned once the
 * proposal is awarded.
 * 
 * # <weight>
 * - Complexity: O(1)
 * - DbReads: `ProposalCount`, `origin account`
 * - DbWrites: `ProposalCount`, `Proposals`, `origin account`
 * # </weight>
 */
export type TreasuryProposeSpendCall = {
    value: bigint,
    beneficiary: MultiAddress,
}

export const TreasuryProposeSpendCall: sts.Type<TreasuryProposeSpendCall> = sts.struct(() => {
    return  {
        value: sts.bigint(),
        beneficiary: MultiAddress,
    }
})

/**
 * Approve a proposal. At a later time, the proposal will be allocated to the beneficiary
 * and the original deposit will be returned.
 * 
 * May only be called from `T::ApproveOrigin`.
 * 
 * # <weight>
 * - Complexity: O(1).
 * - DbReads: `Proposals`, `Approvals`
 * - DbWrite: `Approvals`
 * # </weight>
 */
export type TreasuryApproveProposalCall = {
    proposalId: number,
}

export const TreasuryApproveProposalCall: sts.Type<TreasuryApproveProposalCall> = sts.struct(() => {
    return  {
        proposalId: sts.number(),
    }
})
