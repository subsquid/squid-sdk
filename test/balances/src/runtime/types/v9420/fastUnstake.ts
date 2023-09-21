import {sts} from '../../pallet.support'
import {AccountId32, Type_460} from './types'

/**
 * A staker was unstaked.
 */
export type FastUnstakeUnstakedEvent = {
    stash: AccountId32,
    result: Type_460,
}

export const FastUnstakeUnstakedEvent: sts.Type<FastUnstakeUnstakedEvent> = sts.struct(() => {
    return  {
        stash: AccountId32,
        result: Type_460,
    }
})
