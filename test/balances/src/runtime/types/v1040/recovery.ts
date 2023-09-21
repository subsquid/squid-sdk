import {sts} from '../../pallet.support'
import {AccountId, BlockNumber, Type_110} from './types'

/**
 *  Allow a "friend" of a recoverable account to vouch for an active recovery
 *  process for that account.
 * 
 *  The dispatch origin for this call must be _Signed_ and must be a "friend"
 *  for the recoverable account.
 * 
 *  Parameters:
 *  - `lost`: The lost account that you want to recover.
 *  - `rescuer`: The account trying to rescue the lost account that you
 *    want to vouch for.
 * 
 *  The combination of these two parameters must point to an active recovery
 *  process.
 * 
 *  # <weight>
 *  Key: F (len of friends in config), V (len of vouching friends)
 *  - One storage read to get the recovery configuration. O(1), Codec O(F)
 *  - One storage read to get the active recovery process. O(1), Codec O(V)
 *  - One binary search to confirm caller is a friend. O(logF)
 *  - One binary search to confirm caller has not already vouched. O(logV)
 *  - One storage write. O(1), Codec O(V).
 *  - One event.
 * 
 *  Total Complexity: O(F + logF + V + logV)
 *  # </weight>
 */
export type RecoveryVouchRecoveryCall = {
    lost: AccountId,
    rescuer: AccountId,
}

export const RecoveryVouchRecoveryCall: sts.Type<RecoveryVouchRecoveryCall> = sts.struct(() => {
    return  {
        lost: AccountId,
        rescuer: AccountId,
    }
})

/**
 *  Allow ROOT to bypass the recovery process and set an a rescuer account
 *  for a lost account directly.
 * 
 *  The dispatch origin for this call must be _ROOT_.
 * 
 *  Parameters:
 *  - `lost`: The "lost account" to be recovered.
 *  - `rescuer`: The "rescuer account" which can call as the lost account.
 * 
 *  # <weight>
 *  - One storage write O(1)
 *  - One event
 *  # </weight>
 */
export type RecoverySetRecoveredCall = {
    lost: AccountId,
    rescuer: AccountId,
}

export const RecoverySetRecoveredCall: sts.Type<RecoverySetRecoveredCall> = sts.struct(() => {
    return  {
        lost: AccountId,
        rescuer: AccountId,
    }
})

/**
 *  Remove the recovery process for your account.
 * 
 *  NOTE: The user must make sure to call `close_recovery` on all active
 *  recovery attempts before calling this function else it will fail.
 * 
 *  Payment: By calling this function the recoverable account will unreserve
 *  their recovery configuration deposit.
 *  (`ConfigDepositBase` + `FriendDepositFactor` * #_of_friends)
 * 
 *  The dispatch origin for this call must be _Signed_ and must be a
 *  recoverable account (i.e. has a recovery configuration).
 * 
 *  # <weight>
 *  Key: F (len of friends)
 *  - One storage read to get the prefix iterator for active recoveries. O(1)
 *  - One storage read/remove to get the recovery configuration. O(1), Codec O(F)
 *  - One balance call to unreserved. O(X)
 *  - One event.
 * 
 *  Total Complexity: O(F + X)
 *  # </weight>
 */
export type RecoveryRemoveRecoveryCall = null

export const RecoveryRemoveRecoveryCall: sts.Type<RecoveryRemoveRecoveryCall> = sts.unit()

/**
 *  Initiate the process for recovering a recoverable account.
 * 
 *  Payment: `RecoveryDeposit` balance will be reserved for initiating the
 *  recovery process. This deposit will always be repatriated to the account
 *  trying to be recovered. See `close_recovery`.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Parameters:
 *  - `account`: The lost account that you want to recover. This account
 *    needs to be recoverable (i.e. have a recovery configuration).
 * 
 *  # <weight>
 *  - One storage read to check that account is recoverable. O(F)
 *  - One storage read to check that this recovery process hasn't already started. O(1)
 *  - One currency reserve operation. O(X)
 *  - One storage read to get the current block number. O(1)
 *  - One storage write. O(1).
 *  - One event.
 * 
 *  Total Complexity: O(F + X)
 *  # </weight>
 */
export type RecoveryInitiateRecoveryCall = {
    account: AccountId,
}

export const RecoveryInitiateRecoveryCall: sts.Type<RecoveryInitiateRecoveryCall> = sts.struct(() => {
    return  {
        account: AccountId,
    }
})

/**
 *  Create a recovery configuration for your account. This makes your account recoverable.
 * 
 *  Payment: `ConfigDepositBase` + `FriendDepositFactor` * #_of_friends balance
 *  will be reserved for storing the recovery configuration. This deposit is returned
 *  in full when the user calls `remove_recovery`.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Parameters:
 *  - `friends`: A list of friends you trust to vouch for recovery attempts.
 *    Should be ordered and contain no duplicate values.
 *  - `threshold`: The number of friends that must vouch for a recovery attempt
 *    before the account can be recovered. Should be less than or equal to
 *    the length of the list of friends.
 *  - `delay_period`: The number of blocks after a recovery attempt is initialized
 *    that needs to pass before the account can be recovered.
 * 
 *  # <weight>
 *  - Key: F (len of friends)
 *  - One storage read to check that account is not already recoverable. O(1).
 *  - A check that the friends list is sorted and unique. O(F)
 *  - One currency reserve operation. O(X)
 *  - One storage write. O(1). Codec O(F).
 *  - One event.
 * 
 *  Total Complexity: O(F + X)
 *  # </weight>
 */
export type RecoveryCreateRecoveryCall = {
    friends: AccountId[],
    threshold: number,
    delay_period: BlockNumber,
}

export const RecoveryCreateRecoveryCall: sts.Type<RecoveryCreateRecoveryCall> = sts.struct(() => {
    return  {
        friends: sts.array(() => AccountId),
        threshold: sts.number(),
        delay_period: BlockNumber,
    }
})

/**
 *  As the controller of a recoverable account, close an active recovery
 *  process for your account.
 * 
 *  Payment: By calling this function, the recoverable account will receive
 *  the recovery deposit `RecoveryDeposit` placed by the rescuer.
 * 
 *  The dispatch origin for this call must be _Signed_ and must be a
 *  recoverable account with an active recovery process for it.
 * 
 *  Parameters:
 *  - `rescuer`: The account trying to rescue this recoverable account.
 * 
 *  # <weight>
 *  Key: V (len of vouching friends)
 *  - One storage read/remove to get the active recovery process. O(1), Codec O(V)
 *  - One balance call to repatriate reserved. O(X)
 *  - One event.
 * 
 *  Total Complexity: O(V + X)
 *  # </weight>
 */
export type RecoveryCloseRecoveryCall = {
    rescuer: AccountId,
}

export const RecoveryCloseRecoveryCall: sts.Type<RecoveryCloseRecoveryCall> = sts.struct(() => {
    return  {
        rescuer: AccountId,
    }
})

/**
 *  Allow a successful rescuer to claim their recovered account.
 * 
 *  The dispatch origin for this call must be _Signed_ and must be a "rescuer"
 *  who has successfully completed the account recovery process: collected
 *  `threshold` or more vouches, waited `delay_period` blocks since initiation.
 * 
 *  Parameters:
 *  - `account`: The lost account that you want to claim has been successfully
 *    recovered by you.
 * 
 *  # <weight>
 *  Key: F (len of friends in config), V (len of vouching friends)
 *  - One storage read to get the recovery configuration. O(1), Codec O(F)
 *  - One storage read to get the active recovery process. O(1), Codec O(V)
 *  - One storage read to get the current block number. O(1)
 *  - One storage write. O(1), Codec O(V).
 *  - One event.
 * 
 *  Total Complexity: O(F + V)
 *  # </weight>
 */
export type RecoveryClaimRecoveryCall = {
    account: AccountId,
}

export const RecoveryClaimRecoveryCall: sts.Type<RecoveryClaimRecoveryCall> = sts.struct(() => {
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
 *  - The weight of the `call`.
 *  - One storage lookup to check account is recovered by `who`. O(1)
 *  # </weight>
 */
export type RecoveryAsRecoveredCall = {
    account: AccountId,
    call: Type_110,
}

export const RecoveryAsRecoveredCall: sts.Type<RecoveryAsRecoveredCall> = sts.struct(() => {
    return  {
        account: AccountId,
        call: Type_110,
    }
})

/**
 *  A recovery process for account_1 by account_2 has been vouched for by account_3
 */
export type RecoveryRecoveryVouchedEvent = [AccountId, AccountId, AccountId]

export const RecoveryRecoveryVouchedEvent: sts.Type<RecoveryRecoveryVouchedEvent> = sts.tuple(() => AccountId, AccountId, AccountId)

/**
 *  A recovery process has been removed for an account
 */
export type RecoveryRecoveryRemovedEvent = [AccountId]

export const RecoveryRecoveryRemovedEvent: sts.Type<RecoveryRecoveryRemovedEvent> = sts.tuple(() => AccountId)

/**
 *  A recovery process has been initiated for account_1 by account_2
 */
export type RecoveryRecoveryInitiatedEvent = [AccountId, AccountId]

export const RecoveryRecoveryInitiatedEvent: sts.Type<RecoveryRecoveryInitiatedEvent> = sts.tuple(() => AccountId, AccountId)

/**
 *  A recovery process has been set up for an account
 */
export type RecoveryRecoveryCreatedEvent = [AccountId]

export const RecoveryRecoveryCreatedEvent: sts.Type<RecoveryRecoveryCreatedEvent> = sts.tuple(() => AccountId)

/**
 *  A recovery process for account_1 by account_2 has been closed
 */
export type RecoveryRecoveryClosedEvent = [AccountId, AccountId]

export const RecoveryRecoveryClosedEvent: sts.Type<RecoveryRecoveryClosedEvent> = sts.tuple(() => AccountId, AccountId)

/**
 *  Account_1 has been successfully recovered by account_2
 */
export type RecoveryAccountRecoveredEvent = [AccountId, AccountId]

export const RecoveryAccountRecoveredEvent: sts.Type<RecoveryAccountRecoveredEvent> = sts.tuple(() => AccountId, AccountId)
