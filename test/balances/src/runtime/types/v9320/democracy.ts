import {sts} from '../../pallet.support'
import {Bounded} from './types'

/**
 * Signals agreement with a particular proposal.
 * 
 * The dispatch origin of this call must be _Signed_ and the sender
 * must have funds to cover the deposit, equal to the original deposit.
 * 
 * - `proposal`: The index of the proposal to second.
 */
export type DemocracySecondCall = {
    proposal: number,
}

export const DemocracySecondCall: sts.Type<DemocracySecondCall> = sts.struct(() => {
    return  {
        proposal: sts.number(),
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
 */
export type DemocracyProposeCall = {
    proposal: Bounded,
    value: bigint,
}

export const DemocracyProposeCall: sts.Type<DemocracyProposeCall> = sts.struct(() => {
    return  {
        proposal: Bounded,
        value: sts.bigint(),
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
    proposal: Bounded,
}

export const DemocracyExternalProposeMajorityCall: sts.Type<DemocracyExternalProposeMajorityCall> = sts.struct(() => {
    return  {
        proposal: Bounded,
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
    proposal: Bounded,
}

export const DemocracyExternalProposeDefaultCall: sts.Type<DemocracyExternalProposeDefaultCall> = sts.struct(() => {
    return  {
        proposal: Bounded,
    }
})

/**
 * Schedule a referendum to be tabled once it is legal to schedule an external
 * referendum.
 * 
 * The dispatch origin of this call must be `ExternalOrigin`.
 * 
 * - `proposal_hash`: The preimage hash of the proposal.
 */
export type DemocracyExternalProposeCall = {
    proposal: Bounded,
}

export const DemocracyExternalProposeCall: sts.Type<DemocracyExternalProposeCall> = sts.struct(() => {
    return  {
        proposal: Bounded,
    }
})

/**
 * A public proposal has been tabled for referendum vote.
 */
export type DemocracyTabledEvent = {
    proposalIndex: number,
    deposit: bigint,
}

export const DemocracyTabledEvent: sts.Type<DemocracyTabledEvent> = sts.struct(() => {
    return  {
        proposalIndex: sts.number(),
        deposit: sts.bigint(),
    }
})
