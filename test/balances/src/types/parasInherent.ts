import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const calls = {
    enter: createCall(
        'ParasInherent.enter',
        {
            v9010: ParasInherentEnterCall,
        }
    ),
}

export const storage = {
    Included: createStorage(
        'ParasInherent.Included',
        {
            v9010: ParasInherentIncludedStorage,
        }
    ),
}

export default {calls}
