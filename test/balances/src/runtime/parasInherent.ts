import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9010 from './types/v9010'

export const calls = {
    enter: createCall(
        'ParasInherent.enter',
        {
            v9010: v9010.ParasInherentEnterCall,
        }
    ),
}

export const storage = {
    Included: createStorage(
        'ParasInherent.Included',
        {
            v9010: v9010.ParasInherentIncludedStorage,
        }
    ),
}

export default {calls}
