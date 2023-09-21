import {sts} from '../../pallet.support'
import {MultiAddress, ProxyType, Call, AccountId32, Type_460} from './types'

/**
 * Unregister a proxy account for the sender.
 * 
 * The dispatch origin for this call must be _Signed_.
 * 
 * Parameters:
 * - `proxy`: The account that the `caller` would like to remove as a proxy.
 * - `proxy_type`: The permissions currently enabled for the removed proxy account.
 */
export type ProxyRemoveProxyCall = {
    delegate: MultiAddress,
    proxyType: ProxyType,
    delay: number,
}

export const ProxyRemoveProxyCall: sts.Type<ProxyRemoveProxyCall> = sts.struct(() => {
    return  {
        delegate: MultiAddress,
        proxyType: ProxyType,
        delay: sts.number(),
    }
})

/**
 * Dispatch the given `call` from an account that the sender is authorized for through
 * `add_proxy`.
 * 
 * Removes any corresponding announcement(s).
 * 
 * The dispatch origin for this call must be _Signed_.
 * 
 * Parameters:
 * - `real`: The account that the proxy will make a call on behalf of.
 * - `force_proxy_type`: Specify the exact proxy type to be used and checked for this call.
 * - `call`: The call to be made by the `real` account.
 */
export type ProxyProxyAnnouncedCall = {
    delegate: MultiAddress,
    real: MultiAddress,
    forceProxyType?: (ProxyType | undefined),
    call: Call,
}

export const ProxyProxyAnnouncedCall: sts.Type<ProxyProxyAnnouncedCall> = sts.struct(() => {
    return  {
        delegate: MultiAddress,
        real: MultiAddress,
        forceProxyType: sts.option(() => ProxyType),
        call: Call,
    }
})

/**
 * Dispatch the given `call` from an account that the sender is authorised for through
 * `add_proxy`.
 * 
 * The dispatch origin for this call must be _Signed_.
 * 
 * Parameters:
 * - `real`: The account that the proxy will make a call on behalf of.
 * - `force_proxy_type`: Specify the exact proxy type to be used and checked for this call.
 * - `call`: The call to be made by the `real` account.
 */
export type ProxyProxyCall = {
    real: MultiAddress,
    forceProxyType?: (ProxyType | undefined),
    call: Call,
}

export const ProxyProxyCall: sts.Type<ProxyProxyCall> = sts.struct(() => {
    return  {
        real: MultiAddress,
        forceProxyType: sts.option(() => ProxyType),
        call: Call,
    }
})

/**
 * Removes a previously spawned pure proxy.
 * 
 * WARNING: **All access to this account will be lost.** Any funds held in it will be
 * inaccessible.
 * 
 * Requires a `Signed` origin, and the sender account must have been created by a call to
 * `pure` with corresponding parameters.
 * 
 * - `spawner`: The account that originally called `pure` to create this account.
 * - `index`: The disambiguation index originally passed to `pure`. Probably `0`.
 * - `proxy_type`: The proxy type originally passed to `pure`.
 * - `height`: The height of the chain when the call to `pure` was processed.
 * - `ext_index`: The extrinsic index in which the call to `pure` was processed.
 * 
 * Fails with `NoPermission` in case the caller is not a previously created pure
 * account whose `pure` call has corresponding parameters.
 */
export type ProxyKillPureCall = {
    spawner: MultiAddress,
    proxyType: ProxyType,
    index: number,
    height: number,
    extIndex: number,
}

export const ProxyKillPureCall: sts.Type<ProxyKillPureCall> = sts.struct(() => {
    return  {
        spawner: MultiAddress,
        proxyType: ProxyType,
        index: sts.number(),
        height: sts.number(),
        extIndex: sts.number(),
    }
})

/**
 * Spawn a fresh new account that is guaranteed to be otherwise inaccessible, and
 * initialize it with a proxy of `proxy_type` for `origin` sender.
 * 
 * Requires a `Signed` origin.
 * 
 * - `proxy_type`: The type of the proxy that the sender will be registered as over the
 * new account. This will almost always be the most permissive `ProxyType` possible to
 * allow for maximum flexibility.
 * - `index`: A disambiguation index, in case this is called multiple times in the same
 * transaction (e.g. with `utility::batch`). Unless you're using `batch` you probably just
 * want to use `0`.
 * - `delay`: The announcement period required of the initial proxy. Will generally be
 * zero.
 * 
 * Fails with `Duplicate` if this has already been called in this transaction, from the
 * same sender, with the same parameters.
 * 
 * Fails if there are insufficient funds to pay for deposit.
 */
export type ProxyCreatePureCall = {
    proxyType: ProxyType,
    delay: number,
    index: number,
}

export const ProxyCreatePureCall: sts.Type<ProxyCreatePureCall> = sts.struct(() => {
    return  {
        proxyType: ProxyType,
        delay: sts.number(),
        index: sts.number(),
    }
})

/**
 * Register a proxy account for the sender that is able to make calls on its behalf.
 * 
 * The dispatch origin for this call must be _Signed_.
 * 
 * Parameters:
 * - `proxy`: The account that the `caller` would like to make a proxy.
 * - `proxy_type`: The permissions allowed for this proxy account.
 * - `delay`: The announcement period required of the initial proxy. Will generally be
 * zero.
 */
export type ProxyAddProxyCall = {
    delegate: MultiAddress,
    proxyType: ProxyType,
    delay: number,
}

export const ProxyAddProxyCall: sts.Type<ProxyAddProxyCall> = sts.struct(() => {
    return  {
        delegate: MultiAddress,
        proxyType: ProxyType,
        delay: sts.number(),
    }
})

/**
 * A pure account has been created by new proxy with given
 * disambiguation index and proxy type.
 */
export type ProxyPureCreatedEvent = {
    pure: AccountId32,
    who: AccountId32,
    proxyType: ProxyType,
    disambiguationIndex: number,
}

export const ProxyPureCreatedEvent: sts.Type<ProxyPureCreatedEvent> = sts.struct(() => {
    return  {
        pure: AccountId32,
        who: AccountId32,
        proxyType: ProxyType,
        disambiguationIndex: sts.number(),
    }
})

/**
 * A proxy was removed.
 */
export type ProxyProxyRemovedEvent = {
    delegator: AccountId32,
    delegatee: AccountId32,
    proxyType: ProxyType,
    delay: number,
}

export const ProxyProxyRemovedEvent: sts.Type<ProxyProxyRemovedEvent> = sts.struct(() => {
    return  {
        delegator: AccountId32,
        delegatee: AccountId32,
        proxyType: ProxyType,
        delay: sts.number(),
    }
})

/**
 * A proxy was executed correctly, with the given.
 */
export type ProxyProxyExecutedEvent = {
    result: Type_460,
}

export const ProxyProxyExecutedEvent: sts.Type<ProxyProxyExecutedEvent> = sts.struct(() => {
    return  {
        result: Type_460,
    }
})

/**
 * A proxy was added.
 */
export type ProxyProxyAddedEvent = {
    delegator: AccountId32,
    delegatee: AccountId32,
    proxyType: ProxyType,
    delay: number,
}

export const ProxyProxyAddedEvent: sts.Type<ProxyProxyAddedEvent> = sts.struct(() => {
    return  {
        delegator: AccountId32,
        delegatee: AccountId32,
        proxyType: ProxyType,
        delay: sts.number(),
    }
})
