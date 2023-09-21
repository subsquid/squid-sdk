import {sts} from '../../pallet.support'
import {MultiAddress} from './types'

/**
 * Declare that some `dislocated` account has, through rewards or penalties, sufficiently
 * changed its score that it should properly fall into a different bag than its current
 * one.
 * 
 * Anyone can call this function about any potentially dislocated account.
 * 
 * Will always update the stored score of `dislocated` to the correct score, based on
 * `ScoreProvider`.
 * 
 * If `dislocated` does not exists, it returns an error.
 */
export type VoterListRebagCall = {
    dislocated: MultiAddress,
}

export const VoterListRebagCall: sts.Type<VoterListRebagCall> = sts.struct(() => {
    return  {
        dislocated: MultiAddress,
    }
})

/**
 * Move the caller's Id directly in front of `lighter`.
 * 
 * The dispatch origin for this call must be _Signed_ and can only be called by the Id of
 * the account going in front of `lighter`.
 * 
 * Only works if
 * - both nodes are within the same bag,
 * - and `origin` has a greater `Score` than `lighter`.
 */
export type VoterListPutInFrontOfCall = {
    lighter: MultiAddress,
}

export const VoterListPutInFrontOfCall: sts.Type<VoterListPutInFrontOfCall> = sts.struct(() => {
    return  {
        lighter: MultiAddress,
    }
})
