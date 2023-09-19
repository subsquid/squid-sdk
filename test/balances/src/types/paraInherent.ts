import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const calls = {
    enter: createCall(
        'ParaInherent.enter',
        {
            v9090: ParaInherentEnterCall,
            v9111: ParaInherentEnterCall,
            v9130: ParaInherentEnterCall,
        }
    ),
}

export const storage = {
    Included: createStorage(
        'ParaInherent.Included',
        {
            v9090: ParaInherentIncludedStorage,
        }
    ),
    OnChainVotes: createStorage(
        'ParaInherent.OnChainVotes',
        {
            v9122: ParaInherentOnChainVotesStorage,
        }
    ),
}

export default {calls}
