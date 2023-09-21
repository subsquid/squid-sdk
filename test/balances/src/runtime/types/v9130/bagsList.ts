import {sts} from '../../pallet.support'
import {AccountId32} from './types'

/**
 * Moved an account from one bag to another.
 */
export type BagsListRebaggedEvent = {
    who: AccountId32,
    from: bigint,
    to: bigint,
}

export const BagsListRebaggedEvent: sts.Type<BagsListRebaggedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        from: sts.bigint(),
        to: sts.bigint(),
    }
})
