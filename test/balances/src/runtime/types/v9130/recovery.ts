import {sts} from '../../pallet.support'
import {AccountId32, Call} from './types'

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

/**
 * A recovery process for lost account by rescuer account has been vouched for by sender.
 */
export type RecoveryRecoveryVouchedEvent = {
    lostAccount: AccountId32,
    rescuerAccount: AccountId32,
    sender: AccountId32,
}

export const RecoveryRecoveryVouchedEvent: sts.Type<RecoveryRecoveryVouchedEvent> = sts.struct(() => {
    return  {
        lostAccount: AccountId32,
        rescuerAccount: AccountId32,
        sender: AccountId32,
    }
})

/**
 * A recovery process has been removed for an account.
 */
export type RecoveryRecoveryRemovedEvent = {
    lostAccount: AccountId32,
}

export const RecoveryRecoveryRemovedEvent: sts.Type<RecoveryRecoveryRemovedEvent> = sts.struct(() => {
    return  {
        lostAccount: AccountId32,
    }
})

/**
 * A recovery process has been initiated for lost account by rescuer account.
 */
export type RecoveryRecoveryInitiatedEvent = {
    lostAccount: AccountId32,
    rescuerAccount: AccountId32,
}

export const RecoveryRecoveryInitiatedEvent: sts.Type<RecoveryRecoveryInitiatedEvent> = sts.struct(() => {
    return  {
        lostAccount: AccountId32,
        rescuerAccount: AccountId32,
    }
})

/**
 * A recovery process has been set up for an account.
 */
export type RecoveryRecoveryCreatedEvent = {
    account: AccountId32,
}

export const RecoveryRecoveryCreatedEvent: sts.Type<RecoveryRecoveryCreatedEvent> = sts.struct(() => {
    return  {
        account: AccountId32,
    }
})

/**
 * A recovery process for lost account by rescuer account has been closed.
 */
export type RecoveryRecoveryClosedEvent = {
    lostAccount: AccountId32,
    rescuerAccount: AccountId32,
}

export const RecoveryRecoveryClosedEvent: sts.Type<RecoveryRecoveryClosedEvent> = sts.struct(() => {
    return  {
        lostAccount: AccountId32,
        rescuerAccount: AccountId32,
    }
})

/**
 * Lost account has been successfully recovered by rescuer account.
 */
export type RecoveryAccountRecoveredEvent = {
    lostAccount: AccountId32,
    rescuerAccount: AccountId32,
}

export const RecoveryAccountRecoveredEvent: sts.Type<RecoveryAccountRecoveredEvent> = sts.struct(() => {
    return  {
        lostAccount: AccountId32,
        rescuerAccount: AccountId32,
    }
})
