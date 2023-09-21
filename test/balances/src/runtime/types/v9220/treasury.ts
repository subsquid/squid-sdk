import {sts} from '../../pallet.support'

/**
 * Force a previously approved proposal to be removed from the approval queue.
 * The original deposit will no longer be returned.
 * 
 * May only be called from `T::RejectOrigin`.
 * - `proposal_id`: The index of a proposal
 * 
 * # <weight>
 * - Complexity: O(A) where `A` is the number of approvals
 * - Db reads and writes: `Approvals`
 * # </weight>
 * 
 * Errors:
 * - `ProposalNotApproved`: The `proposal_id` supplied was not found in the approval queue,
 * i.e., the proposal has not been approved. This could also mean the proposal does not
 * exist altogether, thus there is no way it would have been approved in the first place.
 */
export type TreasuryRemoveApprovalCall = {
    proposalId: number,
}

export const TreasuryRemoveApprovalCall: sts.Type<TreasuryRemoveApprovalCall> = sts.struct(() => {
    return  {
        proposalId: sts.number(),
    }
})
