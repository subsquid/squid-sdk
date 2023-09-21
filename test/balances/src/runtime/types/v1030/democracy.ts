import {sts} from '../../pallet.support'
import {ReferendumIndex} from './types'

/**
 *  Register the preimage for an upcoming proposal. This requires the proposal to be
 *  in the dispatch queue. No deposit is needed.
 */
export type DemocracyNoteImminentPreimageCall = {
    encoded_proposal: Bytes,
}

export const DemocracyNoteImminentPreimageCall: sts.Type<DemocracyNoteImminentPreimageCall> = sts.struct(() => {
    return  {
        encoded_proposal: sts.bytes(),
    }
})

/**
 *  Cancel a proposal queued for enactment.
 */
export type DemocracyCancelQueuedCall = {
    which: ReferendumIndex,
}

export const DemocracyCancelQueuedCall: sts.Type<DemocracyCancelQueuedCall> = sts.struct(() => {
    return  {
        which: ReferendumIndex,
    }
})
