import {sts} from '../../pallet.support'
import {AccountId32, ProxyType, Call, Type_49, H256} from './types'

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
 * 
 * # <weight>
 * Weight is a function of:
 * - A: the number of announcements made.
 * - P: the number of proxies the user has.
 * # </weight>
 */
export type ProxyProxyAnnouncedCall = {
    delegate: AccountId32,
    real: AccountId32,
    forceProxyType?: (ProxyType | undefined),
    call: Call,
}

export const ProxyProxyAnnouncedCall: sts.Type<ProxyProxyAnnouncedCall> = sts.struct(() => {
    return  {
        delegate: AccountId32,
        real: AccountId32,
        forceProxyType: sts.option(() => ProxyType),
        call: Call,
    }
})

/**
 * Dispatch the given `call` from an account that the sender is authorised for through
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
 * 
 * # <weight>
 * Weight is a function of the number of proxies the user has (P).
 * # </weight>
 */
export type ProxyProxyCall = {
    real: AccountId32,
    forceProxyType?: (ProxyType | undefined),
    call: Call,
}

export const ProxyProxyCall: sts.Type<ProxyProxyCall> = sts.struct(() => {
    return  {
        real: AccountId32,
        forceProxyType: sts.option(() => ProxyType),
        call: Call,
    }
})

/**
 * A proxy was executed correctly, with the given.
 */
export type ProxyProxyExecutedEvent = {
    result: Type_49,
}

export const ProxyProxyExecutedEvent: sts.Type<ProxyProxyExecutedEvent> = sts.struct(() => {
    return  {
        result: Type_49,
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

/**
 * Anonymous account has been created by new proxy with given
 * disambiguation index and proxy type.
 */
export type ProxyAnonymousCreatedEvent = {
    anonymous: AccountId32,
    who: AccountId32,
    proxyType: ProxyType,
    disambiguationIndex: number,
}

export const ProxyAnonymousCreatedEvent: sts.Type<ProxyAnonymousCreatedEvent> = sts.struct(() => {
    return  {
        anonymous: AccountId32,
        who: AccountId32,
        proxyType: ProxyType,
        disambiguationIndex: sts.number(),
    }
})

/**
 * An announcement was placed to make a call in the future.
 */
export type ProxyAnnouncedEvent = {
    real: AccountId32,
    proxy: AccountId32,
    callHash: H256,
}

export const ProxyAnnouncedEvent: sts.Type<ProxyAnnouncedEvent> = sts.struct(() => {
    return  {
        real: AccountId32,
        proxy: AccountId32,
        callHash: H256,
    }
})
