import {sts} from '../../pallet.support'
import {AccountId32} from './types'

/**
 * The amount vested has been updated. This could indicate a change in funds available.
 * The balance given is the amount which is left unvested (and thus locked).
 */
export type VestingVestingUpdatedEvent = {
    account: AccountId32,
    unvested: bigint,
}

export const VestingVestingUpdatedEvent: sts.Type<VestingVestingUpdatedEvent> = sts.struct(() => {
    return  {
        account: AccountId32,
        unvested: sts.bigint(),
    }
})

/**
 * An \[account\] has become fully vested.
 */
export type VestingVestingCompletedEvent = {
    account: AccountId32,
}

export const VestingVestingCompletedEvent: sts.Type<VestingVestingCompletedEvent> = sts.struct(() => {
    return  {
        account: AccountId32,
    }
})
