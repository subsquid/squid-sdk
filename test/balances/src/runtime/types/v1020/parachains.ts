import {sts} from '../../pallet.support'
import {AttestedCandidate} from './types'

/**
 *  Provide candidate receipts for parachains, in ascending order by id.
 */
export type ParachainsSetHeadsCall = {
    heads: AttestedCandidate[],
}

export const ParachainsSetHeadsCall: sts.Type<ParachainsSetHeadsCall> = sts.struct(() => {
    return  {
        heads: sts.array(() => AttestedCandidate),
    }
})
