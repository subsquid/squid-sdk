import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    DisputeConcluded: createEvent(
        'ParasDisputes.DisputeConcluded',
        {
            v9130: ParasDisputesDisputeConcludedEvent,
        }
    ),
    DisputeInitiated: createEvent(
        'ParasDisputes.DisputeInitiated',
        {
            v9130: ParasDisputesDisputeInitiatedEvent,
        }
    ),
    DisputeTimedOut: createEvent(
        'ParasDisputes.DisputeTimedOut',
        {
            v9130: ParasDisputesDisputeTimedOutEvent,
        }
    ),
    Revert: createEvent(
        'ParasDisputes.Revert',
        {
            v9130: ParasDisputesRevertEvent,
        }
    ),
}

export const calls = {
    force_unfreeze: createCall(
        'ParasDisputes.force_unfreeze',
        {
            v9130: ParasDisputesForceUnfreezeCall,
        }
    ),
}

export const storage = {
    BackersOnDisputes: createStorage(
        'ParasDisputes.BackersOnDisputes',
        {
            v9381: ParasDisputesBackersOnDisputesStorage,
        }
    ),
    Disputes: createStorage(
        'ParasDisputes.Disputes',
        {
            v9130: ParasDisputesDisputesStorage,
        }
    ),
    Frozen: createStorage(
        'ParasDisputes.Frozen',
        {
            v9130: ParasDisputesFrozenStorage,
        }
    ),
    Included: createStorage(
        'ParasDisputes.Included',
        {
            v9130: ParasDisputesIncludedStorage,
        }
    ),
    LastPrunedSession: createStorage(
        'ParasDisputes.LastPrunedSession',
        {
            v9130: ParasDisputesLastPrunedSessionStorage,
        }
    ),
    SpamSlots: createStorage(
        'ParasDisputes.SpamSlots',
        {
            v9130: ParasDisputesSpamSlotsStorage,
        }
    ),
}

export default {events, calls}
