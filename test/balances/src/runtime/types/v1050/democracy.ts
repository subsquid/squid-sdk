import {sts} from '../../pallet.support'
import {AccountId} from './types'

/**
 *  Unlock tokens that have an expired lock.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  - `target`: The account to remove the lock on.
 * 
 *  Emits `Unlocked`.
 * 
 *  # <weight>
 *  - `O(1)`.
 *  # </weight>
 */
export type DemocracyUnlockCall = {
    target: AccountId,
}

export const DemocracyUnlockCall: sts.Type<DemocracyUnlockCall> = sts.struct(() => {
    return  {
        target: AccountId,
    }
})

/**
 *  Become a proxy.
 * 
 *  This must be called prior to a later `activate_proxy`.
 * 
 *  Origin must be a Signed.
 * 
 *  - `target`: The account whose votes will later be proxied.
 * 
 *  `close_proxy` must be called before the account can be destroyed.
 * 
 *  # <weight>
 *  - One extra DB entry.
 *  # </weight>
 */
export type DemocracyOpenProxyCall = {
    target: AccountId,
}

export const DemocracyOpenProxyCall: sts.Type<DemocracyOpenProxyCall> = sts.struct(() => {
    return  {
        target: AccountId,
    }
})

/**
 *  Deactivate the proxy, but leave open to this account. Called by the stash.
 * 
 *  The proxy must already be active.
 * 
 *  NOTE: Used to be called `remove_proxy`.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  - `proxy`: The account that will be deactivated as proxy.
 * 
 *  # <weight>
 *  - One DB clear.
 *  # </weight>
 */
export type DemocracyDeactivateProxyCall = {
    proxy: AccountId,
}

export const DemocracyDeactivateProxyCall: sts.Type<DemocracyDeactivateProxyCall> = sts.struct(() => {
    return  {
        proxy: AccountId,
    }
})

/**
 *  Clear the proxy. Called by the proxy.
 * 
 *  NOTE: Used to be called `resign_proxy`.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  # <weight>
 *  - One DB clear.
 *  # </weight>
 */
export type DemocracyCloseProxyCall = null

export const DemocracyCloseProxyCall: sts.Type<DemocracyCloseProxyCall> = sts.unit()

/**
 *  Specify a proxy that is already open to us. Called by the stash.
 * 
 *  NOTE: Used to be called `set_proxy`.
 * 
 *  The dispatch origin of this call must be _Signed_.
 * 
 *  - `proxy`: The account that will be activated as proxy.
 * 
 *  # <weight>
 *  - One extra DB entry.
 *  # </weight>
 */
export type DemocracyActivateProxyCall = {
    proxy: AccountId,
}

export const DemocracyActivateProxyCall: sts.Type<DemocracyActivateProxyCall> = sts.struct(() => {
    return  {
        proxy: AccountId,
    }
})

/**
 *  An account has been unlocked successfully.
 */
export type DemocracyUnlockedEvent = [AccountId]

export const DemocracyUnlockedEvent: sts.Type<DemocracyUnlockedEvent> = sts.tuple(() => AccountId)
