import {sts} from '../../pallet.support'
import {Hash, ReferendumIndex} from './types'

/**
 *  Remove a proposal.
 * 
 *  The dispatch origin of this call must be `CancelProposalOrigin`.
 * 
 *  - `prop_index`: The index of the proposal to cancel.
 * 
 *  Weight: `O(p)` where `p = PublicProps::<T>::decode_len()`
 */
export type DemocracyCancelProposalCall = {
    prop_index: number,
}

export const DemocracyCancelProposalCall: sts.Type<DemocracyCancelProposalCall> = sts.struct(() => {
    return  {
        prop_index: sts.number(),
    }
})

/**
 *  Permanently place a proposal into the blacklist. This prevents it from ever being
 *  proposed again.
 * 
 *  If called on a queued public or external proposal, then this will result in it being
 *  removed. If the `ref_index` supplied is an active referendum with the proposal hash,
 *  then it will be cancelled.
 * 
 *  The dispatch origin of this call must be `BlacklistOrigin`.
 * 
 *  - `proposal_hash`: The proposal hash to blacklist permanently.
 *  - `ref_index`: An ongoing referendum whose hash is `proposal_hash`, which will be
 *  cancelled.
 * 
 *  Weight: `O(p)` (though as this is an high-privilege dispatch, we assume it has a
 *    reasonable value).
 */
export type DemocracyBlacklistCall = {
    proposal_hash: Hash,
    maybe_ref_index?: (ReferendumIndex | undefined),
}

export const DemocracyBlacklistCall: sts.Type<DemocracyBlacklistCall> = sts.struct(() => {
    return  {
        proposal_hash: Hash,
        maybe_ref_index: sts.option(() => ReferendumIndex),
    }
})

/**
 *  A proposal \[hash\] has been blacklisted permanently.
 */
export type DemocracyBlacklistedEvent = [Hash]

export const DemocracyBlacklistedEvent: sts.Type<DemocracyBlacklistedEvent> = sts.tuple(() => Hash)
