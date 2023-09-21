import {sts} from '../../pallet.support'
import {AccountId32} from './types'

/**
 * Move the caller's Id directly in front of `lighter`.
 * 
 * The dispatch origin for this call must be _Signed_ and can only be called by the Id of
 * the account going in front of `lighter`.
 * 
 * Only works if
 * - both nodes are within the same bag,
 * - and `origin` has a greater `VoteWeight` than `lighter`.
 */
export type BagsListPutInFrontOfCall = {
    lighter: AccountId32,
}

export const BagsListPutInFrontOfCall: sts.Type<BagsListPutInFrontOfCall> = sts.struct(() => {
    return  {
        lighter: AccountId32,
    }
})
