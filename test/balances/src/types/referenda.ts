import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    Approved: createEvent(
        'Referenda.Approved',
        {
            v9320: ReferendaApprovedEvent,
        }
    ),
    Cancelled: createEvent(
        'Referenda.Cancelled',
        {
            v9320: ReferendaCancelledEvent,
        }
    ),
    ConfirmAborted: createEvent(
        'Referenda.ConfirmAborted',
        {
            v9320: ReferendaConfirmAbortedEvent,
        }
    ),
    ConfirmStarted: createEvent(
        'Referenda.ConfirmStarted',
        {
            v9320: ReferendaConfirmStartedEvent,
        }
    ),
    Confirmed: createEvent(
        'Referenda.Confirmed',
        {
            v9320: ReferendaConfirmedEvent,
        }
    ),
    DecisionDepositPlaced: createEvent(
        'Referenda.DecisionDepositPlaced',
        {
            v9320: ReferendaDecisionDepositPlacedEvent,
        }
    ),
    DecisionDepositRefunded: createEvent(
        'Referenda.DecisionDepositRefunded',
        {
            v9320: ReferendaDecisionDepositRefundedEvent,
        }
    ),
    DecisionStarted: createEvent(
        'Referenda.DecisionStarted',
        {
            v9320: ReferendaDecisionStartedEvent,
        }
    ),
    DepositSlashed: createEvent(
        'Referenda.DepositSlashed',
        {
            v9320: ReferendaDepositSlashedEvent,
        }
    ),
    Killed: createEvent(
        'Referenda.Killed',
        {
            v9320: ReferendaKilledEvent,
        }
    ),
    MetadataCleared: createEvent(
        'Referenda.MetadataCleared',
        {
            v9420: ReferendaMetadataClearedEvent,
        }
    ),
    MetadataSet: createEvent(
        'Referenda.MetadataSet',
        {
            v9420: ReferendaMetadataSetEvent,
        }
    ),
    Rejected: createEvent(
        'Referenda.Rejected',
        {
            v9320: ReferendaRejectedEvent,
        }
    ),
    SubmissionDepositRefunded: createEvent(
        'Referenda.SubmissionDepositRefunded',
        {
            v9350: ReferendaSubmissionDepositRefundedEvent,
        }
    ),
    Submitted: createEvent(
        'Referenda.Submitted',
        {
            v9320: ReferendaSubmittedEvent,
        }
    ),
    TimedOut: createEvent(
        'Referenda.TimedOut',
        {
            v9320: ReferendaTimedOutEvent,
        }
    ),
}

export const calls = {
    cancel: createCall(
        'Referenda.cancel',
        {
            v9320: ReferendaCancelCall,
        }
    ),
    kill: createCall(
        'Referenda.kill',
        {
            v9320: ReferendaKillCall,
        }
    ),
    nudge_referendum: createCall(
        'Referenda.nudge_referendum',
        {
            v9320: ReferendaNudgeReferendumCall,
        }
    ),
    one_fewer_deciding: createCall(
        'Referenda.one_fewer_deciding',
        {
            v9320: ReferendaOneFewerDecidingCall,
        }
    ),
    place_decision_deposit: createCall(
        'Referenda.place_decision_deposit',
        {
            v9320: ReferendaPlaceDecisionDepositCall,
        }
    ),
    refund_decision_deposit: createCall(
        'Referenda.refund_decision_deposit',
        {
            v9320: ReferendaRefundDecisionDepositCall,
        }
    ),
    refund_submission_deposit: createCall(
        'Referenda.refund_submission_deposit',
        {
            v9350: ReferendaRefundSubmissionDepositCall,
        }
    ),
    set_metadata: createCall(
        'Referenda.set_metadata',
        {
            v9420: ReferendaSetMetadataCall,
        }
    ),
    submit: createCall(
        'Referenda.submit',
        {
            v9320: ReferendaSubmitCall,
            v9370: ReferendaSubmitCall,
            v9381: ReferendaSubmitCall,
            v9420: ReferendaSubmitCall,
        }
    ),
}

export const constants = {
    AlarmInterval: createConstant(
        'Referenda.AlarmInterval',
        {
            v9320: ReferendaAlarmIntervalConstant,
        }
    ),
    MaxQueued: createConstant(
        'Referenda.MaxQueued',
        {
            v9320: ReferendaMaxQueuedConstant,
        }
    ),
    SubmissionDeposit: createConstant(
        'Referenda.SubmissionDeposit',
        {
            v9320: ReferendaSubmissionDepositConstant,
        }
    ),
    Tracks: createConstant(
        'Referenda.Tracks',
        {
            v9320: ReferendaTracksConstant,
        }
    ),
    UndecidingTimeout: createConstant(
        'Referenda.UndecidingTimeout',
        {
            v9320: ReferendaUndecidingTimeoutConstant,
        }
    ),
}

export const storage = {
    DecidingCount: createStorage(
        'Referenda.DecidingCount',
        {
            v9320: ReferendaDecidingCountStorage,
        }
    ),
    MetadataOf: createStorage(
        'Referenda.MetadataOf',
        {
            v9420: ReferendaMetadataOfStorage,
        }
    ),
    ReferendumCount: createStorage(
        'Referenda.ReferendumCount',
        {
            v9320: ReferendaReferendumCountStorage,
        }
    ),
    ReferendumInfoFor: createStorage(
        'Referenda.ReferendumInfoFor',
        {
            v9320: ReferendaReferendumInfoForStorage,
            v9350: ReferendaReferendumInfoForStorage,
            v9370: ReferendaReferendumInfoForStorage,
            v9381: ReferendaReferendumInfoForStorage,
            v9420: ReferendaReferendumInfoForStorage,
        }
    ),
    TrackQueue: createStorage(
        'Referenda.TrackQueue',
        {
            v9320: ReferendaTrackQueueStorage,
        }
    ),
}

export default {events, calls, constants}
