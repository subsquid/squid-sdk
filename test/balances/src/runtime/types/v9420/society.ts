import {sts} from '../../pallet.support'
import {AccountId32} from './types'

/**
 * A group of members has been choosen as Skeptics
 */
export type SocietySkepticsChosenEvent = {
    skeptics: AccountId32[],
}

export const SocietySkepticsChosenEvent: sts.Type<SocietySkepticsChosenEvent> = sts.struct(() => {
    return  {
        skeptics: sts.array(() => AccountId32),
    }
})
