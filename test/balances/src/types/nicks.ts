import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    NameChanged: createEvent(
        'Nicks.NameChanged',
        {
            v1020: NicksNameChangedEvent,
        }
    ),
    NameCleared: createEvent(
        'Nicks.NameCleared',
        {
            v1020: NicksNameClearedEvent,
        }
    ),
    NameForced: createEvent(
        'Nicks.NameForced',
        {
            v1020: NicksNameForcedEvent,
        }
    ),
    NameKilled: createEvent(
        'Nicks.NameKilled',
        {
            v1020: NicksNameKilledEvent,
        }
    ),
    NameSet: createEvent(
        'Nicks.NameSet',
        {
            v1020: NicksNameSetEvent,
        }
    ),
}

export const calls = {
    clear_name: createCall(
        'Nicks.clear_name',
        {
            v1020: NicksClearNameCall,
        }
    ),
    force_name: createCall(
        'Nicks.force_name',
        {
            v1020: NicksForceNameCall,
        }
    ),
    kill_name: createCall(
        'Nicks.kill_name',
        {
            v1020: NicksKillNameCall,
        }
    ),
    set_name: createCall(
        'Nicks.set_name',
        {
            v1020: NicksSetNameCall,
        }
    ),
}

export const constants = {
    MaxLength: createConstant(
        'Nicks.MaxLength',
        {
            v1020: NicksMaxLengthConstant,
        }
    ),
    MinLength: createConstant(
        'Nicks.MinLength',
        {
            v1020: NicksMinLengthConstant,
        }
    ),
    ReservationFee: createConstant(
        'Nicks.ReservationFee',
        {
            v1020: NicksReservationFeeConstant,
        }
    ),
}

export const storage = {
    NameOf: createStorage(
        'Nicks.NameOf',
        {
            v1020: NicksNameOfStorage,
        }
    ),
}

export default {events, calls, constants}
