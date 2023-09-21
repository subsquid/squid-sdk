import {sts} from '../../pallet.support'
import {OriginCaller, Bounded, DispatchTime, H256} from './types'

/**
 * Propose a referendum on a privileged action.
 * 
 * - `origin`: must be `SubmitOrigin` and the account must have `SubmissionDeposit` funds
 *   available.
 * - `proposal_origin`: The origin from which the proposal should be executed.
 * - `proposal`: The proposal.
 * - `enactment_moment`: The moment that the proposal should be enacted.
 * 
 * Emits `Submitted`.
 */
export type FellowshipReferendaSubmitCall = {
    proposalOrigin: OriginCaller,
    proposal: Bounded,
    enactmentMoment: DispatchTime,
}

export const FellowshipReferendaSubmitCall: sts.Type<FellowshipReferendaSubmitCall> = sts.struct(() => {
    return  {
        proposalOrigin: OriginCaller,
        proposal: Bounded,
        enactmentMoment: DispatchTime,
    }
})

/**
 * Set or clear metadata of a referendum.
 * 
 * Parameters:
 * - `origin`: Must be `Signed` by a creator of a referendum or by anyone to clear a
 *   metadata of a finished referendum.
 * - `index`:  The index of a referendum to set or clear metadata for.
 * - `maybe_hash`: The hash of an on-chain stored preimage. `None` to clear a metadata.
 */
export type FellowshipReferendaSetMetadataCall = {
    index: number,
    maybeHash?: (H256 | undefined),
}

export const FellowshipReferendaSetMetadataCall: sts.Type<FellowshipReferendaSetMetadataCall> = sts.struct(() => {
    return  {
        index: sts.number(),
        maybeHash: sts.option(() => H256),
    }
})

/**
 * Metadata for a referendum has been set.
 */
export type FellowshipReferendaMetadataSetEvent = {
    index: number,
    hash: H256,
}

export const FellowshipReferendaMetadataSetEvent: sts.Type<FellowshipReferendaMetadataSetEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        hash: H256,
    }
})

/**
 * Metadata for a referendum has been cleared.
 */
export type FellowshipReferendaMetadataClearedEvent = {
    index: number,
    hash: H256,
}

export const FellowshipReferendaMetadataClearedEvent: sts.Type<FellowshipReferendaMetadataClearedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        hash: H256,
    }
})
