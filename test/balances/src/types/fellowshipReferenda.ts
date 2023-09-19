import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    Approved: createEvent(
        'FellowshipReferenda.Approved',
        {
            v9320: FellowshipReferendaApprovedEvent,
        }
    ),
    Cancelled: createEvent(
        'FellowshipReferenda.Cancelled',
        {
            v9320: FellowshipReferendaCancelledEvent,
        }
    ),
    ConfirmAborted: createEvent(
        'FellowshipReferenda.ConfirmAborted',
        {
            v9320: FellowshipReferendaConfirmAbortedEvent,
        }
    ),
    ConfirmStarted: createEvent(
        'FellowshipReferenda.ConfirmStarted',
        {
            v9320: FellowshipReferendaConfirmStartedEvent,
        }
    ),
    Confirmed: createEvent(
        'FellowshipReferenda.Confirmed',
        {
            v9320: FellowshipReferendaConfirmedEvent,
        }
    ),
    DecisionDepositPlaced: createEvent(
        'FellowshipReferenda.DecisionDepositPlaced',
        {
            v9320: FellowshipReferendaDecisionDepositPlacedEvent,
        }
    ),
    DecisionDepositRefunded: createEvent(
        'FellowshipReferenda.DecisionDepositRefunded',
        {
            v9320: FellowshipReferendaDecisionDepositRefundedEvent,
        }
    ),
    DecisionStarted: createEvent(
        'FellowshipReferenda.DecisionStarted',
        {
            v9320: FellowshipReferendaDecisionStartedEvent,
        }
    ),
    DepositSlashed: createEvent(
        'FellowshipReferenda.DepositSlashed',
        {
            v9320: FellowshipReferendaDepositSlashedEvent,
        }
    ),
    Killed: createEvent(
        'FellowshipReferenda.Killed',
        {
            v9320: FellowshipReferendaKilledEvent,
        }
    ),
    MetadataCleared: createEvent(
        'FellowshipReferenda.MetadataCleared',
        {
            v9420: FellowshipReferendaMetadataClearedEvent,
        }
    ),
    MetadataSet: createEvent(
        'FellowshipReferenda.MetadataSet',
        {
            v9420: FellowshipReferendaMetadataSetEvent,
        }
    ),
    Rejected: createEvent(
        'FellowshipReferenda.Rejected',
        {
            v9320: FellowshipReferendaRejectedEvent,
        }
    ),
    SubmissionDepositRefunded: createEvent(
        'FellowshipReferenda.SubmissionDepositRefunded',
        {
            v9350: FellowshipReferendaSubmissionDepositRefundedEvent,
        }
    ),
    Submitted: createEvent(
        'FellowshipReferenda.Submitted',
        {
            v9320: FellowshipReferendaSubmittedEvent,
        }
    ),
    TimedOut: createEvent(
        'FellowshipReferenda.TimedOut',
        {
            v9320: FellowshipReferendaTimedOutEvent,
        }
    ),
}

export const calls = {
    cancel: createCall(
        'FellowshipReferenda.cancel',
        {
            v9320: FellowshipReferendaCancelCall,
        }
    ),
    kill: createCall(
        'FellowshipReferenda.kill',
        {
            v9320: FellowshipReferendaKillCall,
        }
    ),
    nudge_referendum: createCall(
        'FellowshipReferenda.nudge_referendum',
        {
            v9320: FellowshipReferendaNudgeReferendumCall,
        }
    ),
    one_fewer_deciding: createCall(
        'FellowshipReferenda.one_fewer_deciding',
        {
            v9320: FellowshipReferendaOneFewerDecidingCall,
        }
    ),
    place_decision_deposit: createCall(
        'FellowshipReferenda.place_decision_deposit',
        {
            v9320: FellowshipReferendaPlaceDecisionDepositCall,
        }
    ),
    refund_decision_deposit: createCall(
        'FellowshipReferenda.refund_decision_deposit',
        {
            v9320: FellowshipReferendaRefundDecisionDepositCall,
        }
    ),
    refund_submission_deposit: createCall(
        'FellowshipReferenda.refund_submission_deposit',
        {
            v9350: FellowshipReferendaRefundSubmissionDepositCall,
        }
    ),
    set_metadata: createCall(
        'FellowshipReferenda.set_metadata',
        {
            v9420: FellowshipReferendaSetMetadataCall,
        }
    ),
    submit: createCall(
        'FellowshipReferenda.submit',
        {
            v9320: FellowshipReferendaSubmitCall,
            v9370: FellowshipReferendaSubmitCall,
            v9381: FellowshipReferendaSubmitCall,
            v9420: FellowshipReferendaSubmitCall,
        }
    ),
}

export const constants = {
    AlarmInterval: createConstant(
        'FellowshipReferenda.AlarmInterval',
        {
            v9320: FellowshipReferendaAlarmIntervalConstant,
        }
    ),
    MaxQueued: createConstant(
        'FellowshipReferenda.MaxQueued',
        {
            v9320: FellowshipReferendaMaxQueuedConstant,
        }
    ),
    SubmissionDeposit: createConstant(
        'FellowshipReferenda.SubmissionDeposit',
        {
            v9320: FellowshipReferendaSubmissionDepositConstant,
        }
    ),
    Tracks: createConstant(
        'FellowshipReferenda.Tracks',
        {
            v9320: FellowshipReferendaTracksConstant,
        }
    ),
    UndecidingTimeout: createConstant(
        'FellowshipReferenda.UndecidingTimeout',
        {
            v9320: FellowshipReferendaUndecidingTimeoutConstant,
        }
    ),
}

export const storage = {
    DecidingCount: createStorage(
        'FellowshipReferenda.DecidingCount',
        {
            v9320: FellowshipReferendaDecidingCountStorage,
        }
    ),
    MetadataOf: createStorage(
        'FellowshipReferenda.MetadataOf',
        {
            v9420: FellowshipReferendaMetadataOfStorage,
        }
    ),
    ReferendumCount: createStorage(
        'FellowshipReferenda.ReferendumCount',
        {
            v9320: FellowshipReferendaReferendumCountStorage,
        }
    ),
    ReferendumInfoFor: createStorage(
        'FellowshipReferenda.ReferendumInfoFor',
        {
            v9320: FellowshipReferendaReferendumInfoForStorage,
            v9350: FellowshipReferendaReferendumInfoForStorage,
            v9370: FellowshipReferendaReferendumInfoForStorage,
            v9381: FellowshipReferendaReferendumInfoForStorage,
            v9420: FellowshipReferendaReferendumInfoForStorage,
        }
    ),
    TrackQueue: createStorage(
        'FellowshipReferenda.TrackQueue',
        {
            v9320: FellowshipReferendaTrackQueueStorage,
        }
    ),
}

export default {events, calls, constants}
