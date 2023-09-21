import {sts} from '../../pallet.support'
import {AccountId, Type_113} from './types'

/**
 *  Cancel the ability to use `as_recovered` for `account`.
 * 
 *  The dispatch origin for this call must be _Signed_ and registered to
 *  be able to make calls on behalf of the recovered account.
 * 
 *  Parameters:
 *  - `account`: The recovered account you are able to call on-behalf-of.
 * 
 *  # <weight>
 *  - One storage mutation to check account is recovered by `who`. O(1)
 *  # </weight>
 */
export type RecoveryCancelRecoveredCall = {
    account: AccountId,
}

export const RecoveryCancelRecoveredCall: sts.Type<RecoveryCancelRecoveredCall> = sts.struct(() => {
    return  {
        account: AccountId,
    }
})

/**
 *  Send a call through a recovered account.
 * 
 *  The dispatch origin for this call must be _Signed_ and registered to
 *  be able to make calls on behalf of the recovered account.
 * 
 *  Parameters:
 *  - `account`: The recovered account you want to make a call on-behalf-of.
 *  - `call`: The call you want to make with the recovered account.
 * 
 *  # <weight>
 *  - The weight of the `call` + 10,000.
 *  - One storage lookup to check account is recovered by `who`. O(1)
 *  # </weight>
 */
export type RecoveryAsRecoveredCall = {
    account: AccountId,
    call: Type_113,
}

export const RecoveryAsRecoveredCall: sts.Type<RecoveryAsRecoveredCall> = sts.struct(() => {
    return  {
        account: AccountId,
        call: Type_113,
    }
})
