import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    VestingCompleted: createEvent(
        'Vesting.VestingCompleted',
        {
            v1050: VestingVestingCompletedEvent,
            v9130: VestingVestingCompletedEvent,
        }
    ),
    VestingUpdated: createEvent(
        'Vesting.VestingUpdated',
        {
            v1050: VestingVestingUpdatedEvent,
            v9130: VestingVestingUpdatedEvent,
        }
    ),
}

export const calls = {
    force_vested_transfer: createCall(
        'Vesting.force_vested_transfer',
        {
            v2011: VestingForceVestedTransferCall,
            v2028: VestingForceVestedTransferCall,
            v9111: VestingForceVestedTransferCall,
        }
    ),
    merge_schedules: createCall(
        'Vesting.merge_schedules',
        {
            v9111: VestingMergeSchedulesCall,
        }
    ),
    vest: createCall(
        'Vesting.vest',
        {
            v1050: VestingVestCall,
        }
    ),
    vest_other: createCall(
        'Vesting.vest_other',
        {
            v1050: VestingVestOtherCall,
            v2028: VestingVestOtherCall,
            v9111: VestingVestOtherCall,
        }
    ),
    vested_transfer: createCall(
        'Vesting.vested_transfer',
        {
            v1050: VestingVestedTransferCall,
            v2028: VestingVestedTransferCall,
            v9111: VestingVestedTransferCall,
        }
    ),
}

export const constants = {
    MaxVestingSchedules: createConstant(
        'Vesting.MaxVestingSchedules',
        {
            v9111: VestingMaxVestingSchedulesConstant,
        }
    ),
    MinVestedTransfer: createConstant(
        'Vesting.MinVestedTransfer',
        {
            v1050: VestingMinVestedTransferConstant,
        }
    ),
}

export const storage = {
    StorageVersion: createStorage(
        'Vesting.StorageVersion',
        {
            v9111: VestingStorageVersionStorage,
        }
    ),
    Vesting: createStorage(
        'Vesting.Vesting',
        {
            v1050: VestingVestingStorage,
            v9111: VestingVestingStorage,
        }
    ),
}

export default {events, calls, constants}
