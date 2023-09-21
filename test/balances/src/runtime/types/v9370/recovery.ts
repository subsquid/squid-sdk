import {sts} from '../../pallet.support'
import {MultiAddress, Call} from './types'

/**
 * Send a call through a recovered account.
 * 
 * The dispatch origin for this call must be _Signed_ and registered to
 * be able to make calls on behalf of the recovered account.
 * 
 * Parameters:
 * - `account`: The recovered account you want to make a call on-behalf-of.
 * - `call`: The call you want to make with the recovered account.
 */
export type RecoveryAsRecoveredCall = {
    account: MultiAddress,
    call: Call,
}

export const RecoveryAsRecoveredCall: sts.Type<RecoveryAsRecoveredCall> = sts.struct(() => {
    return  {
        account: MultiAddress,
        call: Call,
    }
})
