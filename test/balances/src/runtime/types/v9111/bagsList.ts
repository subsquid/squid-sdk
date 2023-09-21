import {sts} from '../../pallet.support'
import {AccountId32} from './types'

/**
 * Declare that some `dislocated` account has, through rewards or penalties, sufficiently
 * changed its weight that it should properly fall into a different bag than its current
 * one.
 * 
 * Anyone can call this function about any potentially dislocated account.
 * 
 * Will never return an error; if `dislocated` does not exist or doesn't need a rebag, then
 * it is a noop and fees are still collected from `origin`.
 */
export type BagsListRebagCall = {
    dislocated: AccountId32,
}

export const BagsListRebagCall: sts.Type<BagsListRebagCall> = sts.struct(() => {
    return  {
        dislocated: AccountId32,
    }
})

/**
 * Moved an account from one bag to another. \[who, from, to\].
 */
export type BagsListRebaggedEvent = [AccountId32, bigint, bigint]

export const BagsListRebaggedEvent: sts.Type<BagsListRebaggedEvent> = sts.tuple(() => AccountId32, sts.bigint(), sts.bigint())
