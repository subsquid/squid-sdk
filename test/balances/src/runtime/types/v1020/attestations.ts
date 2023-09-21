import {sts} from '../../pallet.support'
import {MoreAttestations} from './types'

/**
 *  Provide candidate receipts for parachains, in ascending order by id.
 */
export type AttestationsMoreAttestationsCall = {
    _more: MoreAttestations,
}

export const AttestationsMoreAttestationsCall: sts.Type<AttestationsMoreAttestationsCall> = sts.struct(() => {
    return  {
        _more: MoreAttestations,
    }
})
