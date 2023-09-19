import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const calls = {
    more_attestations: createCall(
        'Attestations.more_attestations',
        {
            v1020: AttestationsMoreAttestationsCall,
        }
    ),
}

export const storage = {
    DidUpdate: createStorage(
        'Attestations.DidUpdate',
        {
            v1020: AttestationsDidUpdateStorage,
        }
    ),
    ParaBlockAttestations: createStorage(
        'Attestations.ParaBlockAttestations',
        {
            v1020: AttestationsParaBlockAttestationsStorage,
        }
    ),
    RecentParaBlocks: createStorage(
        'Attestations.RecentParaBlocks',
        {
            v1020: AttestationsRecentParaBlocksStorage,
        }
    ),
}

export default {calls}
