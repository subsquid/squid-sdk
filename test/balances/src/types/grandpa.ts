import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    NewAuthorities: createEvent(
        'Grandpa.NewAuthorities',
        {
            v1020: GrandpaNewAuthoritiesEvent,
            v9130: GrandpaNewAuthoritiesEvent,
        }
    ),
    Paused: createEvent(
        'Grandpa.Paused',
        {
            v1020: GrandpaPausedEvent,
        }
    ),
    Resumed: createEvent(
        'Grandpa.Resumed',
        {
            v1020: GrandpaResumedEvent,
        }
    ),
}

export const calls = {
    note_stalled: createCall(
        'Grandpa.note_stalled',
        {
            v2022: GrandpaNoteStalledCall,
            v9111: GrandpaNoteStalledCall,
        }
    ),
    report_equivocation: createCall(
        'Grandpa.report_equivocation',
        {
            v2005: GrandpaReportEquivocationCall,
            v9111: GrandpaReportEquivocationCall,
        }
    ),
    report_equivocation_unsigned: createCall(
        'Grandpa.report_equivocation_unsigned',
        {
            v2015: GrandpaReportEquivocationUnsignedCall,
            v9111: GrandpaReportEquivocationUnsignedCall,
        }
    ),
    report_misbehavior: createCall(
        'Grandpa.report_misbehavior',
        {
            v1020: GrandpaReportMisbehaviorCall,
        }
    ),
}

export const constants = {
    MaxAuthorities: createConstant(
        'Grandpa.MaxAuthorities',
        {
            v9111: GrandpaMaxAuthoritiesConstant,
        }
    ),
    MaxSetIdSessionEntries: createConstant(
        'Grandpa.MaxSetIdSessionEntries',
        {
            v9381: GrandpaMaxSetIdSessionEntriesConstant,
        }
    ),
}

export const storage = {
    Authorities: createStorage(
        'Grandpa.Authorities',
        {
            v1020: GrandpaAuthoritiesStorage,
        }
    ),
    CurrentSetId: createStorage(
        'Grandpa.CurrentSetId',
        {
            v1020: GrandpaCurrentSetIdStorage,
        }
    ),
    NextForced: createStorage(
        'Grandpa.NextForced',
        {
            v1020: GrandpaNextForcedStorage,
        }
    ),
    PendingChange: createStorage(
        'Grandpa.PendingChange',
        {
            v1020: GrandpaPendingChangeStorage,
            v9111: GrandpaPendingChangeStorage,
        }
    ),
    SetIdSession: createStorage(
        'Grandpa.SetIdSession',
        {
            v1020: GrandpaSetIdSessionStorage,
        }
    ),
    Stalled: createStorage(
        'Grandpa.Stalled',
        {
            v1020: GrandpaStalledStorage,
        }
    ),
    State: createStorage(
        'Grandpa.State',
        {
            v1020: GrandpaStateStorage,
            v9111: GrandpaStateStorage,
        }
    ),
}

export default {events, calls, constants}
