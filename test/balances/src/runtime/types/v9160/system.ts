import {sts} from '../../pallet.support'
import {AccountId32, H256, DispatchInfo, DispatchError} from './types'

/**
 * On on-chain remark happened.
 */
export type SystemRemarkedEvent = {
    sender: AccountId32,
    hash: H256,
}

export const SystemRemarkedEvent: sts.Type<SystemRemarkedEvent> = sts.struct(() => {
    return  {
        sender: AccountId32,
        hash: H256,
    }
})

/**
 * A new account was created.
 */
export type SystemNewAccountEvent = {
    account: AccountId32,
}

export const SystemNewAccountEvent: sts.Type<SystemNewAccountEvent> = sts.struct(() => {
    return  {
        account: AccountId32,
    }
})

/**
 * An account was reaped.
 */
export type SystemKilledAccountEvent = {
    account: AccountId32,
}

export const SystemKilledAccountEvent: sts.Type<SystemKilledAccountEvent> = sts.struct(() => {
    return  {
        account: AccountId32,
    }
})

/**
 * An extrinsic completed successfully.
 */
export type SystemExtrinsicSuccessEvent = {
    dispatchInfo: DispatchInfo,
}

export const SystemExtrinsicSuccessEvent: sts.Type<SystemExtrinsicSuccessEvent> = sts.struct(() => {
    return  {
        dispatchInfo: DispatchInfo,
    }
})

/**
 * An extrinsic failed.
 */
export type SystemExtrinsicFailedEvent = {
    dispatchError: DispatchError,
    dispatchInfo: DispatchInfo,
}

export const SystemExtrinsicFailedEvent: sts.Type<SystemExtrinsicFailedEvent> = sts.struct(() => {
    return  {
        dispatchError: DispatchError,
        dispatchInfo: DispatchInfo,
    }
})
