import {sts} from '../../pallet.support'
import {AccountId32} from './types'

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
    dislocated: AccountId32,
}

export const VoterListRebagCall: sts.Type<VoterListRebagCall> = sts.struct(() => {
    return  {
        dislocated: AccountId32,
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
    lighter: AccountId32,
}

export const VoterListPutInFrontOfCall: sts.Type<VoterListPutInFrontOfCall> = sts.struct(() => {
    return  {
        lighter: AccountId32,
    }
})

/**
 * Updated the score of some account to the given amount.
 */
export type VoterListScoreUpdatedEvent = {
    who: AccountId32,
    newScore: bigint,
}

export const VoterListScoreUpdatedEvent: sts.Type<VoterListScoreUpdatedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        newScore: sts.bigint(),
    }
})

/**
 * Moved an account from one bag to another.
 */
export type VoterListRebaggedEvent = {
    who: AccountId32,
    from: bigint,
    to: bigint,
}

export const VoterListRebaggedEvent: sts.Type<VoterListRebaggedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        from: sts.bigint(),
        to: sts.bigint(),
    }
})
