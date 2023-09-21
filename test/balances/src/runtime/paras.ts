import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9340 from './types/v9340'
import * as v9160 from './types/v9160'
import * as v9111 from './types/v9111'
import * as v9090 from './types/v9090'
import * as v9010 from './types/v9010'

export const events = {
    ActionQueued: createEvent(
        'Paras.ActionQueued',
        {
            v9010: v9010.ParasActionQueuedEvent,
        }
    ),
    CodeUpgradeScheduled: createEvent(
        'Paras.CodeUpgradeScheduled',
        {
            v9010: v9010.ParasCodeUpgradeScheduledEvent,
        }
    ),
    CurrentCodeUpdated: createEvent(
        'Paras.CurrentCodeUpdated',
        {
            v9010: v9010.ParasCurrentCodeUpdatedEvent,
        }
    ),
    CurrentHeadUpdated: createEvent(
        'Paras.CurrentHeadUpdated',
        {
            v9010: v9010.ParasCurrentHeadUpdatedEvent,
        }
    ),
    NewHeadNoted: createEvent(
        'Paras.NewHeadNoted',
        {
            v9010: v9010.ParasNewHeadNotedEvent,
        }
    ),
    PvfCheckAccepted: createEvent(
        'Paras.PvfCheckAccepted',
        {
            v9160: v9160.ParasPvfCheckAcceptedEvent,
        }
    ),
    PvfCheckRejected: createEvent(
        'Paras.PvfCheckRejected',
        {
            v9160: v9160.ParasPvfCheckRejectedEvent,
        }
    ),
    PvfCheckStarted: createEvent(
        'Paras.PvfCheckStarted',
        {
            v9160: v9160.ParasPvfCheckStartedEvent,
        }
    ),
}

export const calls = {
    add_trusted_validation_code: createCall(
        'Paras.add_trusted_validation_code',
        {
            v9160: v9160.ParasAddTrustedValidationCodeCall,
        }
    ),
    force_note_new_head: createCall(
        'Paras.force_note_new_head',
        {
            v9010: v9010.ParasForceNoteNewHeadCall,
            v9111: v9111.ParasForceNoteNewHeadCall,
        }
    ),
    force_queue_action: createCall(
        'Paras.force_queue_action',
        {
            v9010: v9010.ParasForceQueueActionCall,
        }
    ),
    force_schedule_code_upgrade: createCall(
        'Paras.force_schedule_code_upgrade',
        {
            v9010: v9010.ParasForceScheduleCodeUpgradeCall,
            v9090: v9090.ParasForceScheduleCodeUpgradeCall,
            v9111: v9111.ParasForceScheduleCodeUpgradeCall,
        }
    ),
    force_set_current_code: createCall(
        'Paras.force_set_current_code',
        {
            v9010: v9010.ParasForceSetCurrentCodeCall,
            v9111: v9111.ParasForceSetCurrentCodeCall,
        }
    ),
    force_set_current_head: createCall(
        'Paras.force_set_current_head',
        {
            v9010: v9010.ParasForceSetCurrentHeadCall,
            v9111: v9111.ParasForceSetCurrentHeadCall,
        }
    ),
    include_pvf_check_statement: createCall(
        'Paras.include_pvf_check_statement',
        {
            v9160: v9160.ParasIncludePvfCheckStatementCall,
        }
    ),
    poke_unused_validation_code: createCall(
        'Paras.poke_unused_validation_code',
        {
            v9160: v9160.ParasPokeUnusedValidationCodeCall,
        }
    ),
}

export const constants = {
    UnsignedPriority: createConstant(
        'Paras.UnsignedPriority',
        {
            v9160: v9160.ParasUnsignedPriorityConstant,
        }
    ),
}

export const storage = {
    ActionsQueue: createStorage(
        'Paras.ActionsQueue',
        {
            v9010: v9010.ParasActionsQueueStorage,
        }
    ),
    CodeByHash: createStorage(
        'Paras.CodeByHash',
        {
            v9010: v9010.ParasCodeByHashStorage,
        }
    ),
    CodeByHashRefs: createStorage(
        'Paras.CodeByHashRefs',
        {
            v9010: v9010.ParasCodeByHashRefsStorage,
        }
    ),
    CurrentCodeHash: createStorage(
        'Paras.CurrentCodeHash',
        {
            v9010: v9010.ParasCurrentCodeHashStorage,
        }
    ),
    FutureCodeHash: createStorage(
        'Paras.FutureCodeHash',
        {
            v9010: v9010.ParasFutureCodeHashStorage,
        }
    ),
    FutureCodeUpgrades: createStorage(
        'Paras.FutureCodeUpgrades',
        {
            v9010: v9010.ParasFutureCodeUpgradesStorage,
        }
    ),
    Heads: createStorage(
        'Paras.Heads',
        {
            v9010: v9010.ParasHeadsStorage,
        }
    ),
    ParaLifecycles: createStorage(
        'Paras.ParaLifecycles',
        {
            v9010: v9010.ParasParaLifecyclesStorage,
            v9111: v9111.ParasParaLifecyclesStorage,
        }
    ),
    Parachains: createStorage(
        'Paras.Parachains',
        {
            v9010: v9010.ParasParachainsStorage,
        }
    ),
    PastCodeHash: createStorage(
        'Paras.PastCodeHash',
        {
            v9010: v9010.ParasPastCodeHashStorage,
        }
    ),
    PastCodeMeta: createStorage(
        'Paras.PastCodeMeta',
        {
            v9010: v9010.ParasPastCodeMetaStorage,
        }
    ),
    PastCodePruning: createStorage(
        'Paras.PastCodePruning',
        {
            v9010: v9010.ParasPastCodePruningStorage,
        }
    ),
    PvfActiveVoteList: createStorage(
        'Paras.PvfActiveVoteList',
        {
            v9160: v9160.ParasPvfActiveVoteListStorage,
        }
    ),
    PvfActiveVoteMap: createStorage(
        'Paras.PvfActiveVoteMap',
        {
            v9160: v9160.ParasPvfActiveVoteMapStorage,
        }
    ),
    UpcomingParasGenesis: createStorage(
        'Paras.UpcomingParasGenesis',
        {
            v9010: v9010.ParasUpcomingParasGenesisStorage,
            v9340: v9340.ParasUpcomingParasGenesisStorage,
        }
    ),
    UpcomingUpgrades: createStorage(
        'Paras.UpcomingUpgrades',
        {
            v9090: v9090.ParasUpcomingUpgradesStorage,
        }
    ),
    UpgradeCooldowns: createStorage(
        'Paras.UpgradeCooldowns',
        {
            v9090: v9090.ParasUpgradeCooldownsStorage,
        }
    ),
    UpgradeGoAheadSignal: createStorage(
        'Paras.UpgradeGoAheadSignal',
        {
            v9090: v9090.ParasUpgradeGoAheadSignalStorage,
        }
    ),
    UpgradeRestrictionSignal: createStorage(
        'Paras.UpgradeRestrictionSignal',
        {
            v9090: v9090.ParasUpgradeRestrictionSignalStorage,
        }
    ),
}

export default {events, calls, constants}
