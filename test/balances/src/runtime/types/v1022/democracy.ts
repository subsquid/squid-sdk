import {sts} from '../../pallet.support'
import {Hash, BlockNumber, AccountId, Balance, ReferendumIndex} from './types'

/**
 *  Remove an expired proposal preimage and collect the deposit.
 */
export type DemocracyReapPreimageCall = {
    proposal_hash: Hash,
}

export const DemocracyReapPreimageCall: sts.Type<DemocracyReapPreimageCall> = sts.struct(() => {
    return  {
        proposal_hash: Hash,
    }
})

/**
 *  Propose a sensitive action to be taken.
 * 
 *  # <weight>
 *  - O(1).
 *  - Two DB changes, one DB entry.
 *  # </weight>
 */
export type DemocracyProposeCall = {
    proposal_hash: Hash,
    value: bigint,
}

export const DemocracyProposeCall: sts.Type<DemocracyProposeCall> = sts.struct(() => {
    return  {
        proposal_hash: Hash,
        value: sts.bigint(),
    }
})

/**
 *  Register the preimage for an upcoming proposal. This doesn't require the proposal to be
 *  in the dispatch queue but does require a deposit, returned once enacted.
 */
export type DemocracyNotePreimageCall = {
    encoded_proposal: Bytes,
}

export const DemocracyNotePreimageCall: sts.Type<DemocracyNotePreimageCall> = sts.struct(() => {
    return  {
        encoded_proposal: sts.bytes(),
    }
})

/**
 *  Register the preimage for an upcoming proposal. This requires the proposal to be
 *  in the dispatch queue. No deposit is needed.
 */
export type DemocracyNoteImminentPreimageCall = {
    encoded_proposal: Bytes,
    when: BlockNumber,
    which: number,
}

export const DemocracyNoteImminentPreimageCall: sts.Type<DemocracyNoteImminentPreimageCall> = sts.struct(() => {
    return  {
        encoded_proposal: sts.bytes(),
        when: BlockNumber,
        which: sts.number(),
    }
})

/**
 *  Schedule a majority-carries referendum to be tabled next once it is legal to schedule
 *  an external referendum.
 * 
 *  Unlike `external_propose`, blacklisting has no effect on this and it may replace a
 *  pre-scheduled `external_propose` call.
 */
export type DemocracyExternalProposeMajorityCall = {
    proposal_hash: Hash,
}

export const DemocracyExternalProposeMajorityCall: sts.Type<DemocracyExternalProposeMajorityCall> = sts.struct(() => {
    return  {
        proposal_hash: Hash,
    }
})

/**
 *  Schedule a negative-turnout-bias referendum to be tabled next once it is legal to
 *  schedule an external referendum.
 * 
 *  Unlike `external_propose`, blacklisting has no effect on this and it may replace a
 *  pre-scheduled `external_propose` call.
 */
export type DemocracyExternalProposeDefaultCall = {
    proposal_hash: Hash,
}

export const DemocracyExternalProposeDefaultCall: sts.Type<DemocracyExternalProposeDefaultCall> = sts.struct(() => {
    return  {
        proposal_hash: Hash,
    }
})

/**
 *  Schedule a referendum to be tabled once it is legal to schedule an external
 *  referendum.
 */
export type DemocracyExternalProposeCall = {
    proposal_hash: Hash,
}

export const DemocracyExternalProposeCall: sts.Type<DemocracyExternalProposeCall> = sts.struct(() => {
    return  {
        proposal_hash: Hash,
    }
})

/**
 *  Veto and blacklist the proposal hash. Must be from Root origin.
 */
export type DemocracyClearPublicProposalsCall = null

export const DemocracyClearPublicProposalsCall: sts.Type<DemocracyClearPublicProposalsCall> = sts.unit()

/**
 *  A proposal preimage was removed and used (the deposit was returned).
 */
export type DemocracyPreimageUsedEvent = [Hash, AccountId, Balance]

export const DemocracyPreimageUsedEvent: sts.Type<DemocracyPreimageUsedEvent> = sts.tuple(() => Hash, AccountId, Balance)

/**
 *  A registered preimage was removed and the deposit collected by the reaper (last item).
 */
export type DemocracyPreimageReapedEvent = [Hash, AccountId, Balance, AccountId]

export const DemocracyPreimageReapedEvent: sts.Type<DemocracyPreimageReapedEvent> = sts.tuple(() => Hash, AccountId, Balance, AccountId)

/**
 *  A proposal's preimage was noted, and the deposit taken.
 */
export type DemocracyPreimageNotedEvent = [Hash, AccountId, Balance]

export const DemocracyPreimageNotedEvent: sts.Type<DemocracyPreimageNotedEvent> = sts.tuple(() => Hash, AccountId, Balance)

/**
 *  A proposal could not be executed because its preimage was missing.
 */
export type DemocracyPreimageMissingEvent = [Hash, ReferendumIndex]

export const DemocracyPreimageMissingEvent: sts.Type<DemocracyPreimageMissingEvent> = sts.tuple(() => Hash, ReferendumIndex)

/**
 *  A proposal could not be executed because its preimage was invalid.
 */
export type DemocracyPreimageInvalidEvent = [Hash, ReferendumIndex]

export const DemocracyPreimageInvalidEvent: sts.Type<DemocracyPreimageInvalidEvent> = sts.tuple(() => Hash, ReferendumIndex)
