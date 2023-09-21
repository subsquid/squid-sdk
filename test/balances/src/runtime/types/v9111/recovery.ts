import {sts} from '../../pallet.support'
import {AccountId32, Call} from './types'

/**
 * Create a recovery configuration for your account. This makes your account recoverable.
 * 
 * Payment: `ConfigDepositBase` + `FriendDepositFactor` * #_of_friends balance
 * will be reserved for storing the recovery configuration. This deposit is returned
 * in full when the user calls `remove_recovery`.
 * 
 * The dispatch origin for this call must be _Signed_.
 * 
 * Parameters:
 * - `friends`: A list of friends you trust to vouch for recovery attempts. Should be
 *   ordered and contain no duplicate values.
 * - `threshold`: The number of friends that must vouch for a recovery attempt before the
 *   account can be recovered. Should be less than or equal to the length of the list of
 *   friends.
 * - `delay_period`: The number of blocks after a recovery attempt is initialized that
 *   needs to pass before the account can be recovered.
 * 
 * # <weight>
 * - Key: F (len of friends)
 * - One storage read to check that account is not already recoverable. O(1).
 * - A check that the friends list is sorted and unique. O(F)
 * - One currency reserve operation. O(X)
 * - One storage write. O(1). Codec O(F).
 * - One event.
 * 
 * Total Complexity: O(F + X)
 * # </weight>
 */
export type RecoveryCreateRecoveryCall = {
    friends: AccountId32[],
    threshold: number,
    delayPeriod: number,
}

export const RecoveryCreateRecoveryCall: sts.Type<RecoveryCreateRecoveryCall> = sts.struct(() => {
    return  {
        friends: sts.array(() => AccountId32),
        threshold: sts.number(),
        delayPeriod: sts.number(),
    }
})

/**
 * Send a call through a recovered account.
 * 
 * The dispatch origin for this call must be _Signed_ and registered to
 * be able to make calls on behalf of the recovered account.
 * 
 * Parameters:
 * - `account`: The recovered account you want to make a call on-behalf-of.
 * - `call`: The call you want to make with the recovered account.
 * 
 * # <weight>
 * - The weight of the `call` + 10,000.
 * - One storage lookup to check account is recovered by `who`. O(1)
 * # </weight>
 */
export type RecoveryAsRecoveredCall = {
    account: AccountId32,
    call: Call,
}

export const RecoveryAsRecoveredCall: sts.Type<RecoveryAsRecoveredCall> = sts.struct(() => {
    return  {
        account: AccountId32,
        call: Call,
    }
})
