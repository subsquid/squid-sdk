import {sts} from '../../pallet.support'
import {AccountId, ProxyType, Type_188, DispatchResult} from './types'

/**
 *  Unregister a proxy account for the sender.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Parameters:
 *  - `proxy`: The account that the `caller` would like to remove as a proxy.
 *  - `proxy_type`: The permissions currently enabled for the removed proxy account.
 * 
 *  # <weight>
 *  P is the number of proxies the user has
 *  - Base weight: 14.37 + .164 * P µs
 *  - DB weight: 1 storage read and write.
 *  # </weight>
 */
export type ProxyRemoveProxyCall = {
    proxy: AccountId,
    proxy_type: ProxyType,
}

export const ProxyRemoveProxyCall: sts.Type<ProxyRemoveProxyCall> = sts.struct(() => {
    return  {
        proxy: AccountId,
        proxy_type: ProxyType,
    }
})

/**
 *  Unregister all proxy accounts for the sender.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  WARNING: This may be called on accounts created by `anonymous`, however if done, then
 *  the unreserved fees will be inaccessible. **All access to this account will be lost.**
 * 
 *  # <weight>
 *  P is the number of proxies the user has
 *  - Base weight: 13.73 + .129 * P µs
 *  - DB weight: 1 storage read and write.
 *  # </weight>
 */
export type ProxyRemoveProxiesCall = null

export const ProxyRemoveProxiesCall: sts.Type<ProxyRemoveProxiesCall> = sts.unit()

/**
 *  Dispatch the given `call` from an account that the sender is authorised for through
 *  `add_proxy`.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Parameters:
 *  - `real`: The account that the proxy will make a call on behalf of.
 *  - `force_proxy_type`: Specify the exact proxy type to be used and checked for this call.
 *  - `call`: The call to be made by the `real` account.
 * 
 *  # <weight>
 *  P is the number of proxies the user has
 *  - Base weight: 19.87 + .141 * P µs
 *  - DB weight: 1 storage read.
 *  - Plus the weight of the `call`
 *  # </weight>
 */
export type ProxyProxyCall = {
    real: AccountId,
    force_proxy_type?: (ProxyType | undefined),
    call: Type_188,
}

export const ProxyProxyCall: sts.Type<ProxyProxyCall> = sts.struct(() => {
    return  {
        real: AccountId,
        force_proxy_type: sts.option(() => ProxyType),
        call: Type_188,
    }
})

/**
 *  Removes a previously spawned anonymous proxy.
 * 
 *  WARNING: **All access to this account will be lost.** Any funds held in it will be
 *  inaccessible.
 * 
 *  Requires a `Signed` origin, and the sender account must have been created by a call to
 *  `anonymous` with corresponding parameters.
 * 
 *  - `spawner`: The account that originally called `anonymous` to create this account.
 *  - `index`: The disambiguation index originally passed to `anonymous`. Probably `0`.
 *  - `proxy_type`: The proxy type originally passed to `anonymous`.
 *  - `height`: The height of the chain when the call to `anonymous` was processed.
 *  - `ext_index`: The extrinsic index in which the call to `anonymous` was processed.
 * 
 *  Fails with `NoPermission` in case the caller is not a previously created anonymous
 *  account whose `anonymous` call has corresponding parameters.
 * 
 *  # <weight>
 *  P is the number of proxies the user has
 *  - Base weight: 15.65 + .137 * P µs
 *  - DB weight: 1 storage read and write.
 *  # </weight>
 */
export type ProxyKillAnonymousCall = {
    spawner: AccountId,
    proxy_type: ProxyType,
    index: number,
    height: number,
    ext_index: number,
}

export const ProxyKillAnonymousCall: sts.Type<ProxyKillAnonymousCall> = sts.struct(() => {
    return  {
        spawner: AccountId,
        proxy_type: ProxyType,
        index: sts.number(),
        height: sts.number(),
        ext_index: sts.number(),
    }
})

/**
 *  Spawn a fresh new account that is guaranteed to be otherwise inaccessible, and
 *  initialize it with a proxy of `proxy_type` for `origin` sender.
 * 
 *  Requires a `Signed` origin.
 * 
 *  - `proxy_type`: The type of the proxy that the sender will be registered as over the
 *  new account. This will almost always be the most permissive `ProxyType` possible to
 *  allow for maximum flexibility.
 *  - `index`: A disambiguation index, in case this is called multiple times in the same
 *  transaction (e.g. with `utility::batch`). Unless you're using `batch` you probably just
 *  want to use `0`.
 * 
 *  Fails with `Duplicate` if this has already been called in this transaction, from the
 *  same sender, with the same parameters.
 * 
 *  Fails if there are insufficient funds to pay for deposit.
 * 
 *  # <weight>
 *  P is the number of proxies the user has
 *  - Base weight: 36.48 + .039 * P µs
 *  - DB weight: 1 storage read and write.
 *  # </weight>
 */
export type ProxyAnonymousCall = {
    proxy_type: ProxyType,
    index: number,
}

export const ProxyAnonymousCall: sts.Type<ProxyAnonymousCall> = sts.struct(() => {
    return  {
        proxy_type: ProxyType,
        index: sts.number(),
    }
})

/**
 *  Register a proxy account for the sender that is able to make calls on its behalf.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Parameters:
 *  - `proxy`: The account that the `caller` would like to make a proxy.
 *  - `proxy_type`: The permissions allowed for this proxy account.
 * 
 *  # <weight>
 *  P is the number of proxies the user has
 *  - Base weight: 17.48 + .176 * P µs
 *  - DB weight: 1 storage read and write.
 *  # </weight>
 */
export type ProxyAddProxyCall = {
    proxy: AccountId,
    proxy_type: ProxyType,
}

export const ProxyAddProxyCall: sts.Type<ProxyAddProxyCall> = sts.struct(() => {
    return  {
        proxy: AccountId,
        proxy_type: ProxyType,
    }
})

/**
 *  A proxy was executed correctly, with the given result.
 */
export type ProxyProxyExecutedEvent = [DispatchResult]

export const ProxyProxyExecutedEvent: sts.Type<ProxyProxyExecutedEvent> = sts.tuple(() => DispatchResult)

/**
 *  Anonymous account (first parameter) has been created by new proxy (second) with given
 *  disambiguation index and proxy type.
 */
export type ProxyAnonymousCreatedEvent = [AccountId, AccountId, ProxyType, number]

export const ProxyAnonymousCreatedEvent: sts.Type<ProxyAnonymousCreatedEvent> = sts.tuple(() => AccountId, AccountId, ProxyType, sts.number())
