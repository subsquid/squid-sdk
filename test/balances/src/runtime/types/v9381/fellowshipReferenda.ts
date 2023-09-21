import {sts} from '../../pallet.support'
import {OriginCaller, Bounded, DispatchTime} from './types'

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
