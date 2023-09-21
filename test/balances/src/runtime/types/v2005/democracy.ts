import {sts} from '../../pallet.support'
import {Hash} from './types'

/**
 *  Signals agreement with a particular proposal.
 * 
 *  The dispatch origin of this call must be _Signed_ and the sender
 *  must have funds to cover the deposit, equal to the original deposit.
 * 
 *  - `proposal`: The index of the proposal to second.
 *  - `seconds_upper_bound`: an upper bound on the current number of seconds on this
 *    proposal. Extrinsic is weighted according to this value with no refund.
 * 
 *  # <weight>
 *  - Complexity: `O(S)` where S is the number of seconds a proposal already has.
 *  - Db reads: `DepositOf`
 *  - Db writes: `DepositOf`
 *  ---------
 *  - Base Weight: 22.28 + .229 * S µs
 *  # </weight>
 */
export type DemocracySecondCall = {
    proposal: number,
    seconds_upper_bound: number,
}

export const DemocracySecondCall: sts.Type<DemocracySecondCall> = sts.struct(() => {
    return  {
        proposal: sts.number(),
        seconds_upper_bound: sts.number(),
    }
})

/**
 *  Remove an expired proposal preimage and collect the deposit.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  - `proposal_hash`: The preimage hash of a proposal.
 *  - `proposal_length_upper_bound`: an upper bound on length of the proposal.
 *    Extrinsic is weighted according to this value with no refund.
 * 
 *  This will only work after `VotingPeriod` blocks from the time that the preimage was
 *  noted, if it's the same account doing it. If it's a different account, then it'll only
 *  work an additional `EnactmentPeriod` later.
 * 
 *  Emits `PreimageReaped`.
 * 
 *  # <weight>
 *  - Complexity: `O(D)` where D is length of proposal.
 *  - Db reads: `Preimages`
 *  - Db writes: `Preimages`
 *  - Base Weight: 39.31 + .003 * b µs
 *  # </weight>
 */
export type DemocracyReapPreimageCall = {
    proposal_hash: Hash,
    proposal_len_upper_bound: number,
}

export const DemocracyReapPreimageCall: sts.Type<DemocracyReapPreimageCall> = sts.struct(() => {
    return  {
        proposal_hash: Hash,
        proposal_len_upper_bound: sts.number(),
    }
})

/**
 *  Same as `note_preimage` but origin is `OperationalPreimageOrigin`.
 */
export type DemocracyNotePreimageOperationalCall = {
    encoded_proposal: Bytes,
}

export const DemocracyNotePreimageOperationalCall: sts.Type<DemocracyNotePreimageOperationalCall> = sts.struct(() => {
    return  {
        encoded_proposal: sts.bytes(),
    }
})

/**
 *  Same as `note_imminent_preimage` but origin is `OperationalPreimageOrigin`.
 */
export type DemocracyNoteImminentPreimageOperationalCall = {
    encoded_proposal: Bytes,
}

export const DemocracyNoteImminentPreimageOperationalCall: sts.Type<DemocracyNoteImminentPreimageOperationalCall> = sts.struct(() => {
    return  {
        encoded_proposal: sts.bytes(),
    }
})
