import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    BatchChecked: createEvent(
        'FastUnstake.BatchChecked',
        {
            v9340: FastUnstakeBatchCheckedEvent,
        }
    ),
    BatchFinished: createEvent(
        'FastUnstake.BatchFinished',
        {
            v9340: FastUnstakeBatchFinishedEvent,
            v9381: FastUnstakeBatchFinishedEvent,
        }
    ),
    Checking: createEvent(
        'FastUnstake.Checking',
        {
            v9300: FastUnstakeCheckingEvent,
        }
    ),
    Errored: createEvent(
        'FastUnstake.Errored',
        {
            v9300: FastUnstakeErroredEvent,
        }
    ),
    InternalError: createEvent(
        'FastUnstake.InternalError',
        {
            v9300: FastUnstakeInternalErrorEvent,
        }
    ),
    Slashed: createEvent(
        'FastUnstake.Slashed',
        {
            v9300: FastUnstakeSlashedEvent,
        }
    ),
    Unstaked: createEvent(
        'FastUnstake.Unstaked',
        {
            v9300: FastUnstakeUnstakedEvent,
            v9320: FastUnstakeUnstakedEvent,
            v9420: FastUnstakeUnstakedEvent,
            v9430: FastUnstakeUnstakedEvent,
        }
    ),
}

export const calls = {
    control: createCall(
        'FastUnstake.control',
        {
            v9300: FastUnstakeControlCall,
            v9381: FastUnstakeControlCall,
        }
    ),
    deregister: createCall(
        'FastUnstake.deregister',
        {
            v9300: FastUnstakeDeregisterCall,
        }
    ),
    register_fast_unstake: createCall(
        'FastUnstake.register_fast_unstake',
        {
            v9300: FastUnstakeRegisterFastUnstakeCall,
        }
    ),
}

export const constants = {
    Deposit: createConstant(
        'FastUnstake.Deposit',
        {
            v9340: FastUnstakeDepositConstant,
        }
    ),
}

export const storage = {
    CounterForQueue: createStorage(
        'FastUnstake.CounterForQueue',
        {
            v9300: FastUnstakeCounterForQueueStorage,
        }
    ),
    ErasToCheckPerBlock: createStorage(
        'FastUnstake.ErasToCheckPerBlock',
        {
            v9300: FastUnstakeErasToCheckPerBlockStorage,
        }
    ),
    Head: createStorage(
        'FastUnstake.Head',
        {
            v9300: FastUnstakeHeadStorage,
            v9340: FastUnstakeHeadStorage,
        }
    ),
    Queue: createStorage(
        'FastUnstake.Queue',
        {
            v9300: FastUnstakeQueueStorage,
        }
    ),
}

export default {events, calls, constants}
