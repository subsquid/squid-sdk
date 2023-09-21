import {sts} from '../../pallet.support'
import {MultiAddress, Call} from './types'

/**
 * Allow a "friend" of a recoverable account to vouch for an active recovery
 * process for that account.
 * 
 * The dispatch origin for this call must be _Signed_ and must be a "friend"
 * for the recoverable account.
 * 
 * Parameters:
 * - `lost`: The lost account that you want to recover.
 * - `rescuer`: The account trying to rescue the lost account that you want to vouch for.
 * 
 * The combination of these two parameters must point to an active recovery
 * process.
 */
export type RecoveryVouchRecoveryCall = {
    lost: MultiAddress,
    rescuer: MultiAddress,
}

export const RecoveryVouchRecoveryCall: sts.Type<RecoveryVouchRecoveryCall> = sts.struct(() => {
    return  {
        lost: MultiAddress,
        rescuer: MultiAddress,
    }
})

/**
 * Allow ROOT to bypass the recovery process and set an a rescuer account
 * for a lost account directly.
 * 
 * The dispatch origin for this call must be _ROOT_.
 * 
 * Parameters:
 * - `lost`: The "lost account" to be recovered.
 * - `rescuer`: The "rescuer account" which can call as the lost account.
 */
export type RecoverySetRecoveredCall = {
    lost: MultiAddress,
    rescuer: MultiAddress,
}

export const RecoverySetRecoveredCall: sts.Type<RecoverySetRecoveredCall> = sts.struct(() => {
    return  {
        lost: MultiAddress,
        rescuer: MultiAddress,
    }
})

/**
 * Initiate the process for recovering a recoverable account.
 * 
 * Payment: `RecoveryDeposit` balance will be reserved for initiating the
 * recovery process. This deposit will always be repatriated to the account
 * trying to be recovered. See `close_recovery`.
 * 
 * The dispatch origin for this call must be _Signed_.
 * 
 * Parameters:
 * - `account`: The lost account that you want to recover. This account needs to be
 *   recoverable (i.e. have a recovery configuration).
 */
export type RecoveryInitiateRecoveryCall = {
    account: MultiAddress,
}

export const RecoveryInitiateRecoveryCall: sts.Type<RecoveryInitiateRecoveryCall> = sts.struct(() => {
    return  {
        account: MultiAddress,
    }
})

/**
 * As the controller of a recoverable account, close an active recovery
 * process for your account.
 * 
 * Payment: By calling this function, the recoverable account will receive
 * the recovery deposit `RecoveryDeposit` placed by the rescuer.
 * 
 * The dispatch origin for this call must be _Signed_ and must be a
 * recoverable account with an active recovery process for it.
 * 
 * Parameters:
 * - `rescuer`: The account trying to rescue this recoverable account.
 */
export type RecoveryCloseRecoveryCall = {
    rescuer: MultiAddress,
}

export const RecoveryCloseRecoveryCall: sts.Type<RecoveryCloseRecoveryCall> = sts.struct(() => {
    return  {
        rescuer: MultiAddress,
    }
})

/**
 * Allow a successful rescuer to claim their recovered account.
 * 
 * The dispatch origin for this call must be _Signed_ and must be a "rescuer"
 * who has successfully completed the account recovery process: collected
 * `threshold` or more vouches, waited `delay_period` blocks since initiation.
 * 
 * Parameters:
 * - `account`: The lost account that you want to claim has been successfully recovered by
 *   you.
 */
export type RecoveryClaimRecoveryCall = {
    account: MultiAddress,
}

export const RecoveryClaimRecoveryCall: sts.Type<RecoveryClaimRecoveryCall> = sts.struct(() => {
    return  {
        account: MultiAddress,
    }
})

/**
 * Cancel the ability to use `as_recovered` for `account`.
 * 
 * The dispatch origin for this call must be _Signed_ and registered to
 * be able to make calls on behalf of the recovered account.
 * 
 * Parameters:
 * - `account`: The recovered account you are able to call on-behalf-of.
 */
export type RecoveryCancelRecoveredCall = {
    account: MultiAddress,
}

export const RecoveryCancelRecoveredCall: sts.Type<RecoveryCancelRecoveredCall> = sts.struct(() => {
    return  {
        account: MultiAddress,
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
