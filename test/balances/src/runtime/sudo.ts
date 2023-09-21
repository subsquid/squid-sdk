import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v1024 from './types/v1024'
import * as v1022 from './types/v1022'
import * as v1020 from './types/v1020'

export const events = {
    KeyChanged: createEvent(
        'Sudo.KeyChanged',
        {
            v1020: v1020.SudoKeyChangedEvent,
        }
    ),
    Sudid: createEvent(
        'Sudo.Sudid',
        {
            v1020: v1020.SudoSudidEvent,
        }
    ),
    SudoAsDone: createEvent(
        'Sudo.SudoAsDone',
        {
            v1020: v1020.SudoSudoAsDoneEvent,
        }
    ),
}

export const calls = {
    set_key: createCall(
        'Sudo.set_key',
        {
            v1020: v1020.SudoSetKeyCall,
        }
    ),
    sudo: createCall(
        'Sudo.sudo',
        {
            v1020: v1020.SudoSudoCall,
            v1022: v1022.SudoSudoCall,
            v1024: v1024.SudoSudoCall,
        }
    ),
    sudo_as: createCall(
        'Sudo.sudo_as',
        {
            v1020: v1020.SudoSudoAsCall,
            v1022: v1022.SudoSudoAsCall,
            v1024: v1024.SudoSudoAsCall,
        }
    ),
}

export const storage = {
    Key: createStorage(
        'Sudo.Key',
        {
            v1020: v1020.SudoKeyStorage,
        }
    ),
}

export default {events, calls}
