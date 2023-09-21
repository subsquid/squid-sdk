import {sts} from '../../pallet.support'
import {Hash, ReferendumIndex} from './types'

/**
 *  Enact a proposal from a referendum. For now we just make the weight be the maximum.
 */
export type DemocracyEnactProposalCall = {
    proposal_hash: Hash,
    index: ReferendumIndex,
}

export const DemocracyEnactProposalCall: sts.Type<DemocracyEnactProposalCall> = sts.struct(() => {
    return  {
        proposal_hash: Hash,
        index: ReferendumIndex,
    }
})
