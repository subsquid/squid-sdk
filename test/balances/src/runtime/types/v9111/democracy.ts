import {sts} from '../../pallet.support'
import {AccountVote, H256, Type_52} from './types'

/**
 * Vote in a referendum. If `vote.is_aye()`, the vote is to enact the proposal;
 * otherwise it is a vote to keep the status quo.
 * 
 * The dispatch origin of this call must be _Signed_.
 * 
 * - `ref_index`: The index of the referendum to vote for.
 * - `vote`: The vote configuration.
 * 
 * Weight: `O(R)` where R is the number of referendums the voter has voted on.
 */
export type DemocracyVoteCall = {
    refIndex: number,
    vote: AccountVote,
}

export const DemocracyVoteCall: sts.Type<DemocracyVoteCall> = sts.struct(() => {
    return  {
        refIndex: sts.number(),
        vote: AccountVote,
    }
})

/**
 * Veto and blacklist the external proposal hash.
 * 
 * The dispatch origin of this call must be `VetoOrigin`.
 * 
 * - `proposal_hash`: The preimage hash of the proposal to veto and blacklist.
 * 
 * Emits `Vetoed`.
 * 
 * Weight: `O(V + log(V))` where V is number of `existing vetoers`
 */
export type DemocracyVetoExternalCall = {
    proposalHash: H256,
}

export const DemocracyVetoExternalCall: sts.Type<DemocracyVetoExternalCall> = sts.struct(() => {
    return  {
        proposalHash: H256,
    }
})

/**
 * Signals agreement with a particular proposal.
 * 
 * The dispatch origin of this call must be _Signed_ and the sender
 * must have funds to cover the deposit, equal to the original deposit.
 * 
 * - `proposal`: The index of the proposal to second.
 * - `seconds_upper_bound`: an upper bound on the current number of seconds on this
 *   proposal. Extrinsic is weighted according to this value with no refund.
 * 
 * Weight: `O(S)` where S is the number of seconds a proposal already has.
 */
export type DemocracySecondCall = {
    proposal: number,
    secondsUpperBound: number,
}

export const DemocracySecondCall: sts.Type<DemocracySecondCall> = sts.struct(() => {
    return  {
        proposal: sts.number(),
        secondsUpperBound: sts.number(),
    }
})

/**
 * Remove an expired proposal preimage and collect the deposit.
 * 
 * The dispatch origin of this call must be _Signed_.
 * 
 * - `proposal_hash`: The preimage hash of a proposal.
 * - `proposal_length_upper_bound`: an upper bound on length of the proposal. Extrinsic is
 *   weighted according to this value with no refund.
 * 
 * This will only work after `VotingPeriod` blocks from the time that the preimage was
 * noted, if it's the same account doing it. If it's a different account, then it'll only
 * work an additional `EnactmentPeriod` later.
 * 
 * Emits `PreimageReaped`.
 * 
 * Weight: `O(D)` where D is length of proposal.
 */
export type DemocracyReapPreimageCall = {
    proposalHash: H256,
    proposalLenUpperBound: number,
}

export const DemocracyReapPreimageCall: sts.Type<DemocracyReapPreimageCall> = sts.struct(() => {
    return  {
        proposalHash: H256,
        proposalLenUpperBound: sts.number(),
    }
})

/**
 * Propose a sensitive action to be taken.
 * 
 * The dispatch origin of this call must be _Signed_ and the sender must
 * have funds to cover the deposit.
 * 
 * - `proposal_hash`: The hash of the proposal preimage.
 * - `value`: The amount of deposit (must be at least `MinimumDeposit`).
 * 
 * Emits `Proposed`.
 * 
 * Weight: `O(p)`
 */
export type DemocracyProposeCall = {
    proposalHash: H256,
    value: bigint,
}

export const DemocracyProposeCall: sts.Type<DemocracyProposeCall> = sts.struct(() => {
    return  {
        proposalHash: H256,
        value: sts.bigint(),
    }
})

/**
 * Same as `note_preimage` but origin is `OperationalPreimageOrigin`.
 */
export type DemocracyNotePreimageOperationalCall = {
    encodedProposal: Bytes,
}

export const DemocracyNotePreimageOperationalCall: sts.Type<DemocracyNotePreimageOperationalCall> = sts.struct(() => {
    return  {
        encodedProposal: sts.bytes(),
    }
})

/**
 * Register the preimage for an upcoming proposal. This doesn't require the proposal to be
 * in the dispatch queue but does require a deposit, returned once enacted.
 * 
 * The dispatch origin of this call must be _Signed_.
 * 
 * - `encoded_proposal`: The preimage of a proposal.
 * 
 * Emits `PreimageNoted`.
 * 
 * Weight: `O(E)` with E size of `encoded_proposal` (protected by a required deposit).
 */
export type DemocracyNotePreimageCall = {
    encodedProposal: Bytes,
}

export const DemocracyNotePreimageCall: sts.Type<DemocracyNotePreimageCall> = sts.struct(() => {
    return  {
        encodedProposal: sts.bytes(),
    }
})

/**
 * Same as `note_imminent_preimage` but origin is `OperationalPreimageOrigin`.
 */
export type DemocracyNoteImminentPreimageOperationalCall = {
    encodedProposal: Bytes,
}

export const DemocracyNoteImminentPreimageOperationalCall: sts.Type<DemocracyNoteImminentPreimageOperationalCall> = sts.struct(() => {
    return  {
        encodedProposal: sts.bytes(),
    }
})

/**
 * Register the preimage for an upcoming proposal. This requires the proposal to be
 * in the dispatch queue. No deposit is needed. When this call is successful, i.e.
 * the preimage has not been uploaded before and matches some imminent proposal,
 * no fee is paid.
 * 
 * The dispatch origin of this call must be _Signed_.
 * 
 * - `encoded_proposal`: The preimage of a proposal.
 * 
 * Emits `PreimageNoted`.
 * 
 * Weight: `O(E)` with E size of `encoded_proposal` (protected by a required deposit).
 */
export type DemocracyNoteImminentPreimageCall = {
    encodedProposal: Bytes,
}

export const DemocracyNoteImminentPreimageCall: sts.Type<DemocracyNoteImminentPreimageCall> = sts.struct(() => {
    return  {
        encodedProposal: sts.bytes(),
    }
})

/**
 * Schedule the currently externally-proposed majority-carries referendum to be tabled
 * immediately. If there is no externally-proposed referendum currently, or if there is one
 * but it is not a majority-carries referendum then it fails.
 * 
 * The dispatch of this call must be `FastTrackOrigin`.
 * 
 * - `proposal_hash`: The hash of the current external proposal.
 * - `voting_period`: The period that is allowed for voting on this proposal. Increased to
 *   `FastTrackVotingPeriod` if too low.
 * - `delay`: The number of block after voting has ended in approval and this should be
 *   enacted. This doesn't have a minimum amount.
 * 
 * Emits `Started`.
 * 
 * Weight: `O(1)`
 */
export type DemocracyFastTrackCall = {
    proposalHash: H256,
    votingPeriod: number,
    delay: number,
}

export const DemocracyFastTrackCall: sts.Type<DemocracyFastTrackCall> = sts.struct(() => {
    return  {
        proposalHash: H256,
        votingPeriod: sts.number(),
        delay: sts.number(),
    }
})

/**
 * Schedule a majority-carries referendum to be tabled next once it is legal to schedule
 * an external referendum.
 * 
 * The dispatch of this call must be `ExternalMajorityOrigin`.
 * 
 * - `proposal_hash`: The preimage hash of the proposal.
 * 
 * Unlike `external_propose`, blacklisting has no effect on this and it may replace a
 * pre-scheduled `external_propose` call.
 * 
 * Weight: `O(1)`
 */
export type DemocracyExternalProposeMajorityCall = {
    proposalHash: H256,
}

export const DemocracyExternalProposeMajorityCall: sts.Type<DemocracyExternalProposeMajorityCall> = sts.struct(() => {
    return  {
        proposalHash: H256,
    }
})

/**
 * Schedule a negative-turnout-bias referendum to be tabled next once it is legal to
 * schedule an external referendum.
 * 
 * The dispatch of this call must be `ExternalDefaultOrigin`.
 * 
 * - `proposal_hash`: The preimage hash of the proposal.
 * 
 * Unlike `external_propose`, blacklisting has no effect on this and it may replace a
 * pre-scheduled `external_propose` call.
 * 
 * Weight: `O(1)`
 */
export type DemocracyExternalProposeDefaultCall = {
    proposalHash: H256,
}

export const DemocracyExternalProposeDefaultCall: sts.Type<DemocracyExternalProposeDefaultCall> = sts.struct(() => {
    return  {
        proposalHash: H256,
    }
})

/**
 * Schedule a referendum to be tabled once it is legal to schedule an external
 * referendum.
 * 
 * The dispatch origin of this call must be `ExternalOrigin`.
 * 
 * - `proposal_hash`: The preimage hash of the proposal.
 * 
 * Weight: `O(V)` with V number of vetoers in the blacklist of proposal.
 *   Decoding vec of length V. Charged as maximum
 */
export type DemocracyExternalProposeCall = {
    proposalHash: H256,
}

export const DemocracyExternalProposeCall: sts.Type<DemocracyExternalProposeCall> = sts.struct(() => {
    return  {
        proposalHash: H256,
    }
})

/**
 * Enact a proposal from a referendum. For now we just make the weight be the maximum.
 */
export type DemocracyEnactProposalCall = {
    proposalHash: H256,
    index: number,
}

export const DemocracyEnactProposalCall: sts.Type<DemocracyEnactProposalCall> = sts.struct(() => {
    return  {
        proposalHash: H256,
        index: sts.number(),
    }
})

/**
 * Schedule an emergency cancellation of a referendum. Cannot happen twice to the same
 * referendum.
 * 
 * The dispatch origin of this call must be `CancellationOrigin`.
 * 
 * -`ref_index`: The index of the referendum to cancel.
 * 
 * Weight: `O(1)`.
 */
export type DemocracyEmergencyCancelCall = {
    refIndex: number,
}

export const DemocracyEmergencyCancelCall: sts.Type<DemocracyEmergencyCancelCall> = sts.struct(() => {
    return  {
        refIndex: sts.number(),
    }
})

/**
 * Remove a referendum.
 * 
 * The dispatch origin of this call must be _Root_.
 * 
 * - `ref_index`: The index of the referendum to cancel.
 * 
 * # Weight: `O(1)`.
 */
export type DemocracyCancelReferendumCall = {
    refIndex: number,
}

export const DemocracyCancelReferendumCall: sts.Type<DemocracyCancelReferendumCall> = sts.struct(() => {
    return  {
        refIndex: sts.number(),
    }
})

/**
 * Remove a proposal.
 * 
 * The dispatch origin of this call must be `CancelProposalOrigin`.
 * 
 * - `prop_index`: The index of the proposal to cancel.
 * 
 * Weight: `O(p)` where `p = PublicProps::<T>::decode_len()`
 */
export type DemocracyCancelProposalCall = {
    propIndex: number,
}

export const DemocracyCancelProposalCall: sts.Type<DemocracyCancelProposalCall> = sts.struct(() => {
    return  {
        propIndex: sts.number(),
    }
})

/**
 * Permanently place a proposal into the blacklist. This prevents it from ever being
 * proposed again.
 * 
 * If called on a queued public or external proposal, then this will result in it being
 * removed. If the `ref_index` supplied is an active referendum with the proposal hash,
 * then it will be cancelled.
 * 
 * The dispatch origin of this call must be `BlacklistOrigin`.
 * 
 * - `proposal_hash`: The proposal hash to blacklist permanently.
 * - `ref_index`: An ongoing referendum whose hash is `proposal_hash`, which will be
 * cancelled.
 * 
 * Weight: `O(p)` (though as this is an high-privilege dispatch, we assume it has a
 *   reasonable value).
 */
export type DemocracyBlacklistCall = {
    proposalHash: H256,
    maybeRefIndex?: (number | undefined),
}

export const DemocracyBlacklistCall: sts.Type<DemocracyBlacklistCall> = sts.struct(() => {
    return  {
        proposalHash: H256,
        maybeRefIndex: sts.option(() => sts.number()),
    }
})

/**
 * A proposal has been enacted. \[ref_index, result\]
 */
export type DemocracyExecutedEvent = [number, Type_52]

export const DemocracyExecutedEvent: sts.Type<DemocracyExecutedEvent> = sts.tuple(() => sts.number(), Type_52)
