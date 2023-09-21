import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9430 from './types/v9430'
import * as v9320 from './types/v9320'
import * as v9230 from './types/v9230'
import * as v9111 from './types/v9111'
import * as v9010 from './types/v9010'
import * as v1020 from './types/v1020'

export const events = {
    Deregistered: createEvent(
        'Registrar.Deregistered',
        {
            v9010: v9010.RegistrarDeregisteredEvent,
            v9230: v9230.RegistrarDeregisteredEvent,
        }
    ),
    ParathreadDeregistered: createEvent(
        'Registrar.ParathreadDeregistered',
        {
            v1020: v1020.RegistrarParathreadDeregisteredEvent,
        }
    ),
    ParathreadRegistered: createEvent(
        'Registrar.ParathreadRegistered',
        {
            v1020: v1020.RegistrarParathreadRegisteredEvent,
        }
    ),
    Registered: createEvent(
        'Registrar.Registered',
        {
            v9010: v9010.RegistrarRegisteredEvent,
            v9230: v9230.RegistrarRegisteredEvent,
        }
    ),
    Reserved: createEvent(
        'Registrar.Reserved',
        {
            v9010: v9010.RegistrarReservedEvent,
            v9230: v9230.RegistrarReservedEvent,
        }
    ),
    Swapped: createEvent(
        'Registrar.Swapped',
        {
            v9430: v9430.RegistrarSwappedEvent,
        }
    ),
}

export const calls = {
    add_lock: createCall(
        'Registrar.add_lock',
        {
            v9320: v9320.RegistrarAddLockCall,
        }
    ),
    deregister: createCall(
        'Registrar.deregister',
        {
            v9010: v9010.RegistrarDeregisterCall,
        }
    ),
    deregister_para: createCall(
        'Registrar.deregister_para',
        {
            v1020: v1020.RegistrarDeregisterParaCall,
        }
    ),
    deregister_parathread: createCall(
        'Registrar.deregister_parathread',
        {
            v1020: v1020.RegistrarDeregisterParathreadCall,
        }
    ),
    force_register: createCall(
        'Registrar.force_register',
        {
            v9010: v9010.RegistrarForceRegisterCall,
            v9111: v9111.RegistrarForceRegisterCall,
        }
    ),
    force_remove_lock: createCall(
        'Registrar.force_remove_lock',
        {
            v9010: v9010.RegistrarForceRemoveLockCall,
        }
    ),
    register: createCall(
        'Registrar.register',
        {
            v9010: v9010.RegistrarRegisterCall,
            v9111: v9111.RegistrarRegisterCall,
        }
    ),
    register_para: createCall(
        'Registrar.register_para',
        {
            v1020: v1020.RegistrarRegisterParaCall,
        }
    ),
    register_parathread: createCall(
        'Registrar.register_parathread',
        {
            v1020: v1020.RegistrarRegisterParathreadCall,
        }
    ),
    remove_lock: createCall(
        'Registrar.remove_lock',
        {
            v9320: v9320.RegistrarRemoveLockCall,
        }
    ),
    reserve: createCall(
        'Registrar.reserve',
        {
            v9010: v9010.RegistrarReserveCall,
        }
    ),
    schedule_code_upgrade: createCall(
        'Registrar.schedule_code_upgrade',
        {
            v9320: v9320.RegistrarScheduleCodeUpgradeCall,
        }
    ),
    select_parathread: createCall(
        'Registrar.select_parathread',
        {
            v1020: v1020.RegistrarSelectParathreadCall,
        }
    ),
    set_current_head: createCall(
        'Registrar.set_current_head',
        {
            v9320: v9320.RegistrarSetCurrentHeadCall,
        }
    ),
    set_thread_count: createCall(
        'Registrar.set_thread_count',
        {
            v1020: v1020.RegistrarSetThreadCountCall,
        }
    ),
    swap: createCall(
        'Registrar.swap',
        {
            v1020: v1020.RegistrarSwapCall,
            v9010: v9010.RegistrarSwapCall,
        }
    ),
}

export const constants = {
    DataDepositPerByte: createConstant(
        'Registrar.DataDepositPerByte',
        {
            v9010: v9010.RegistrarDataDepositPerByteConstant,
        }
    ),
    MaxCodeSize: createConstant(
        'Registrar.MaxCodeSize',
        {
            v9010: v9010.RegistrarMaxCodeSizeConstant,
        }
    ),
    MaxHeadSize: createConstant(
        'Registrar.MaxHeadSize',
        {
            v9010: v9010.RegistrarMaxHeadSizeConstant,
        }
    ),
    ParaDeposit: createConstant(
        'Registrar.ParaDeposit',
        {
            v9010: v9010.RegistrarParaDepositConstant,
        }
    ),
}

export const storage = {
    Active: createStorage(
        'Registrar.Active',
        {
            v1020: v1020.RegistrarActiveStorage,
        }
    ),
    Debtors: createStorage(
        'Registrar.Debtors',
        {
            v1020: v1020.RegistrarDebtorsStorage,
        }
    ),
    NextFreeId: createStorage(
        'Registrar.NextFreeId',
        {
            v1020: v1020.RegistrarNextFreeIdStorage,
        }
    ),
    NextFreeParaId: createStorage(
        'Registrar.NextFreeParaId',
        {
            v9010: v9010.RegistrarNextFreeParaIdStorage,
        }
    ),
    Parachains: createStorage(
        'Registrar.Parachains',
        {
            v1020: v1020.RegistrarParachainsStorage,
        }
    ),
    Paras: createStorage(
        'Registrar.Paras',
        {
            v1020: v1020.RegistrarParasStorage,
        }
    ),
    PendingSwap: createStorage(
        'Registrar.PendingSwap',
        {
            v1020: v1020.RegistrarPendingSwapStorage,
        }
    ),
    RetryQueue: createStorage(
        'Registrar.RetryQueue',
        {
            v1020: v1020.RegistrarRetryQueueStorage,
        }
    ),
    SelectedThreads: createStorage(
        'Registrar.SelectedThreads',
        {
            v1020: v1020.RegistrarSelectedThreadsStorage,
        }
    ),
    ThreadCount: createStorage(
        'Registrar.ThreadCount',
        {
            v1020: v1020.RegistrarThreadCountStorage,
        }
    ),
}

export default {events, calls, constants}
