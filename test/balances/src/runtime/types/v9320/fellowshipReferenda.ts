import {sts} from '../../pallet.support'
import {OriginCaller, Bounded, DispatchTime, Type_441, AccountId32} from './types'

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
 * Refund the Decision Deposit for a closed referendum back to the depositor.
 * 
 * - `origin`: must be `Signed` or `Root`.
 * - `index`: The index of a closed referendum whose Decision Deposit has not yet been
 *   refunded.
 * 
 * Emits `DecisionDepositRefunded`.
 */
export type FellowshipReferendaRefundDecisionDepositCall = {
    index: number,
}

export const FellowshipReferendaRefundDecisionDepositCall: sts.Type<FellowshipReferendaRefundDecisionDepositCall> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})

/**
 * Post the Decision Deposit for a referendum.
 * 
 * - `origin`: must be `Signed` and the account must have funds available for the
 *   referendum's track's Decision Deposit.
 * - `index`: The index of the submitted referendum whose Decision Deposit is yet to be
 *   posted.
 * 
 * Emits `DecisionDepositPlaced`.
 */
export type FellowshipReferendaPlaceDecisionDepositCall = {
    index: number,
}

export const FellowshipReferendaPlaceDecisionDepositCall: sts.Type<FellowshipReferendaPlaceDecisionDepositCall> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})

/**
 * Advance a track onto its next logical state. Only used internally.
 * 
 * - `origin`: must be `Root`.
 * - `track`: the track to be advanced.
 * 
 * Action item for when there is now one fewer referendum in the deciding phase and the
 * `DecidingCount` is not yet updated. This means that we should either:
 * - begin deciding another referendum (and leave `DecidingCount` alone); or
 * - decrement `DecidingCount`.
 */
export type FellowshipReferendaOneFewerDecidingCall = {
    track: number,
}

export const FellowshipReferendaOneFewerDecidingCall: sts.Type<FellowshipReferendaOneFewerDecidingCall> = sts.struct(() => {
    return  {
        track: sts.number(),
    }
})

/**
 * Advance a referendum onto its next logical state. Only used internally.
 * 
 * - `origin`: must be `Root`.
 * - `index`: the referendum to be advanced.
 */
export type FellowshipReferendaNudgeReferendumCall = {
    index: number,
}

export const FellowshipReferendaNudgeReferendumCall: sts.Type<FellowshipReferendaNudgeReferendumCall> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})

/**
 * Cancel an ongoing referendum and slash the deposits.
 * 
 * - `origin`: must be the `KillOrigin`.
 * - `index`: The index of the referendum to be cancelled.
 * 
 * Emits `Killed` and `DepositSlashed`.
 */
export type FellowshipReferendaKillCall = {
    index: number,
}

export const FellowshipReferendaKillCall: sts.Type<FellowshipReferendaKillCall> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})

/**
 * Cancel an ongoing referendum.
 * 
 * - `origin`: must be the `CancelOrigin`.
 * - `index`: The index of the referendum to be cancelled.
 * 
 * Emits `Cancelled`.
 */
export type FellowshipReferendaCancelCall = {
    index: number,
}

export const FellowshipReferendaCancelCall: sts.Type<FellowshipReferendaCancelCall> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})

/**
 * A referendum has been timed out without being decided.
 */
export type FellowshipReferendaTimedOutEvent = {
    index: number,
    tally: Type_441,
}

export const FellowshipReferendaTimedOutEvent: sts.Type<FellowshipReferendaTimedOutEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        tally: Type_441,
    }
})

/**
 * A referendum has being submitted.
 */
export type FellowshipReferendaSubmittedEvent = {
    index: number,
    track: number,
    proposal: Bounded,
}

export const FellowshipReferendaSubmittedEvent: sts.Type<FellowshipReferendaSubmittedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        track: sts.number(),
        proposal: Bounded,
    }
})

/**
 * A proposal has been rejected by referendum.
 */
export type FellowshipReferendaRejectedEvent = {
    index: number,
    tally: Type_441,
}

export const FellowshipReferendaRejectedEvent: sts.Type<FellowshipReferendaRejectedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        tally: Type_441,
    }
})

/**
 * A referendum has been killed.
 */
export type FellowshipReferendaKilledEvent = {
    index: number,
    tally: Type_441,
}

export const FellowshipReferendaKilledEvent: sts.Type<FellowshipReferendaKilledEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        tally: Type_441,
    }
})

/**
 * A deposit has been slashaed.
 */
export type FellowshipReferendaDepositSlashedEvent = {
    who: AccountId32,
    amount: bigint,
}

export const FellowshipReferendaDepositSlashedEvent: sts.Type<FellowshipReferendaDepositSlashedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * A referendum has moved into the deciding phase.
 */
export type FellowshipReferendaDecisionStartedEvent = {
    index: number,
    track: number,
    proposal: Bounded,
    tally: Type_441,
}

export const FellowshipReferendaDecisionStartedEvent: sts.Type<FellowshipReferendaDecisionStartedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        track: sts.number(),
        proposal: Bounded,
        tally: Type_441,
    }
})

/**
 * The decision deposit has been refunded.
 */
export type FellowshipReferendaDecisionDepositRefundedEvent = {
    index: number,
    who: AccountId32,
    amount: bigint,
}

export const FellowshipReferendaDecisionDepositRefundedEvent: sts.Type<FellowshipReferendaDecisionDepositRefundedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * The decision deposit has been placed.
 */
export type FellowshipReferendaDecisionDepositPlacedEvent = {
    index: number,
    who: AccountId32,
    amount: bigint,
}

export const FellowshipReferendaDecisionDepositPlacedEvent: sts.Type<FellowshipReferendaDecisionDepositPlacedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * A referendum has ended its confirmation phase and is ready for approval.
 */
export type FellowshipReferendaConfirmedEvent = {
    index: number,
    tally: Type_441,
}

export const FellowshipReferendaConfirmedEvent: sts.Type<FellowshipReferendaConfirmedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        tally: Type_441,
    }
})

export type FellowshipReferendaConfirmStartedEvent = {
    index: number,
}

export const FellowshipReferendaConfirmStartedEvent: sts.Type<FellowshipReferendaConfirmStartedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})

export type FellowshipReferendaConfirmAbortedEvent = {
    index: number,
}

export const FellowshipReferendaConfirmAbortedEvent: sts.Type<FellowshipReferendaConfirmAbortedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})

/**
 * A referendum has been cancelled.
 */
export type FellowshipReferendaCancelledEvent = {
    index: number,
    tally: Type_441,
}

export const FellowshipReferendaCancelledEvent: sts.Type<FellowshipReferendaCancelledEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        tally: Type_441,
    }
})

/**
 * A referendum has been approved and its proposal has been scheduled.
 */
export type FellowshipReferendaApprovedEvent = {
    index: number,
}

export const FellowshipReferendaApprovedEvent: sts.Type<FellowshipReferendaApprovedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})
