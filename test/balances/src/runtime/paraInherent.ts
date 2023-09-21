import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9130 from './types/v9130'
import * as v9122 from './types/v9122'
import * as v9111 from './types/v9111'
import * as v9090 from './types/v9090'

export const calls = {
    enter: createCall(
        'ParaInherent.enter',
        {
            v9090: v9090.ParaInherentEnterCall,
            v9111: v9111.ParaInherentEnterCall,
            v9130: v9130.ParaInherentEnterCall,
        }
    ),
}

export const storage = {
    Included: createStorage(
        'ParaInherent.Included',
        {
            v9090: v9090.ParaInherentIncludedStorage,
        }
    ),
    OnChainVotes: createStorage(
        'ParaInherent.OnChainVotes',
        {
            v9122: v9122.ParaInherentOnChainVotesStorage,
        }
    ),
}

export default {calls}
