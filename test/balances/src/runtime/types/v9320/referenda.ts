import {sts} from '../../pallet.support'
import {OriginCaller, Bounded, DispatchTime, Tally, AccountId32} from './types'

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
export type ReferendaSubmitCall = {
    proposalOrigin: OriginCaller,
    proposal: Bounded,
    enactmentMoment: DispatchTime,
}

export const ReferendaSubmitCall: sts.Type<ReferendaSubmitCall> = sts.struct(() => {
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
export type ReferendaRefundDecisionDepositCall = {
    index: number,
}

export const ReferendaRefundDecisionDepositCall: sts.Type<ReferendaRefundDecisionDepositCall> = sts.struct(() => {
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
export type ReferendaPlaceDecisionDepositCall = {
    index: number,
}

export const ReferendaPlaceDecisionDepositCall: sts.Type<ReferendaPlaceDecisionDepositCall> = sts.struct(() => {
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
export type ReferendaOneFewerDecidingCall = {
    track: number,
}

export const ReferendaOneFewerDecidingCall: sts.Type<ReferendaOneFewerDecidingCall> = sts.struct(() => {
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
export type ReferendaNudgeReferendumCall = {
    index: number,
}

export const ReferendaNudgeReferendumCall: sts.Type<ReferendaNudgeReferendumCall> = sts.struct(() => {
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
export type ReferendaKillCall = {
    index: number,
}

export const ReferendaKillCall: sts.Type<ReferendaKillCall> = sts.struct(() => {
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
export type ReferendaCancelCall = {
    index: number,
}

export const ReferendaCancelCall: sts.Type<ReferendaCancelCall> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})

/**
 * A referendum has been timed out without being decided.
 */
export type ReferendaTimedOutEvent = {
    index: number,
    tally: Tally,
}

export const ReferendaTimedOutEvent: sts.Type<ReferendaTimedOutEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        tally: Tally,
    }
})

/**
 * A referendum has being submitted.
 */
export type ReferendaSubmittedEvent = {
    index: number,
    track: number,
    proposal: Bounded,
}

export const ReferendaSubmittedEvent: sts.Type<ReferendaSubmittedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        track: sts.number(),
        proposal: Bounded,
    }
})

/**
 * A proposal has been rejected by referendum.
 */
export type ReferendaRejectedEvent = {
    index: number,
    tally: Tally,
}

export const ReferendaRejectedEvent: sts.Type<ReferendaRejectedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        tally: Tally,
    }
})

/**
 * A referendum has been killed.
 */
export type ReferendaKilledEvent = {
    index: number,
    tally: Tally,
}

export const ReferendaKilledEvent: sts.Type<ReferendaKilledEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        tally: Tally,
    }
})

/**
 * A deposit has been slashaed.
 */
export type ReferendaDepositSlashedEvent = {
    who: AccountId32,
    amount: bigint,
}

export const ReferendaDepositSlashedEvent: sts.Type<ReferendaDepositSlashedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * A referendum has moved into the deciding phase.
 */
export type ReferendaDecisionStartedEvent = {
    index: number,
    track: number,
    proposal: Bounded,
    tally: Tally,
}

export const ReferendaDecisionStartedEvent: sts.Type<ReferendaDecisionStartedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        track: sts.number(),
        proposal: Bounded,
        tally: Tally,
    }
})

/**
 * The decision deposit has been refunded.
 */
export type ReferendaDecisionDepositRefundedEvent = {
    index: number,
    who: AccountId32,
    amount: bigint,
}

export const ReferendaDecisionDepositRefundedEvent: sts.Type<ReferendaDecisionDepositRefundedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * The decision deposit has been placed.
 */
export type ReferendaDecisionDepositPlacedEvent = {
    index: number,
    who: AccountId32,
    amount: bigint,
}

export const ReferendaDecisionDepositPlacedEvent: sts.Type<ReferendaDecisionDepositPlacedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * A referendum has ended its confirmation phase and is ready for approval.
 */
export type ReferendaConfirmedEvent = {
    index: number,
    tally: Tally,
}

export const ReferendaConfirmedEvent: sts.Type<ReferendaConfirmedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        tally: Tally,
    }
})

export type ReferendaConfirmStartedEvent = {
    index: number,
}

export const ReferendaConfirmStartedEvent: sts.Type<ReferendaConfirmStartedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})

export type ReferendaConfirmAbortedEvent = {
    index: number,
}

export const ReferendaConfirmAbortedEvent: sts.Type<ReferendaConfirmAbortedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})

/**
 * A referendum has been cancelled.
 */
export type ReferendaCancelledEvent = {
    index: number,
    tally: Tally,
}

export const ReferendaCancelledEvent: sts.Type<ReferendaCancelledEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        tally: Tally,
    }
})

/**
 * A referendum has been approved and its proposal has been scheduled.
 */
export type ReferendaApprovedEvent = {
    index: number,
}

export const ReferendaApprovedEvent: sts.Type<ReferendaApprovedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})
