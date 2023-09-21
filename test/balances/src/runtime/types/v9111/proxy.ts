import {sts} from '../../pallet.support'
import {AccountId32, ProxyType, H256, Call, Type_52} from './types'

/**
 * Unregister a proxy account for the sender.
 * 
 * The dispatch origin for this call must be _Signed_.
 * 
 * Parameters:
 * - `proxy`: The account that the `caller` would like to remove as a proxy.
 * - `proxy_type`: The permissions currently enabled for the removed proxy account.
 * 
 * # <weight>
 * Weight is a function of the number of proxies the user has (P).
 * # </weight>
 */
export type ProxyRemoveProxyCall = {
    delegate: AccountId32,
    proxyType: ProxyType,
    delay: number,
}

export const ProxyRemoveProxyCall: sts.Type<ProxyRemoveProxyCall> = sts.struct(() => {
    return  {
        delegate: AccountId32,
        proxyType: ProxyType,
        delay: sts.number(),
    }
})

/**
 * Remove a given announcement.
 * 
 * May be called by a proxy account to remove a call they previously announced and return
 * the deposit.
 * 
 * The dispatch origin for this call must be _Signed_.
 * 
 * Parameters:
 * - `real`: The account that the proxy will make a call on behalf of.
 * - `call_hash`: The hash of the call to be made by the `real` account.
 * 
 * # <weight>
 * Weight is a function of:
 * - A: the number of announcements made.
 * - P: the number of proxies the user has.
 * # </weight>
 */
export type ProxyRemoveAnnouncementCall = {
    real: AccountId32,
    callHash: H256,
}

export const ProxyRemoveAnnouncementCall: sts.Type<ProxyRemoveAnnouncementCall> = sts.struct(() => {
    return  {
        real: AccountId32,
        callHash: H256,
    }
})

/**
 * Remove the given announcement of a delegate.
 * 
 * May be called by a target (proxied) account to remove a call that one of their delegates
 * (`delegate`) has announced they want to execute. The deposit is returned.
 * 
 * The dispatch origin for this call must be _Signed_.
 * 
 * Parameters:
 * - `delegate`: The account that previously announced the call.
 * - `call_hash`: The hash of the call to be made.
 * 
 * # <weight>
 * Weight is a function of:
 * - A: the number of announcements made.
 * - P: the number of proxies the user has.
 * # </weight>
 */
export type ProxyRejectAnnouncementCall = {
    delegate: AccountId32,
    callHash: H256,
}

export const ProxyRejectAnnouncementCall: sts.Type<ProxyRejectAnnouncementCall> = sts.struct(() => {
    return  {
        delegate: AccountId32,
        callHash: H256,
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
 * Removes a previously spawned anonymous proxy.
 * 
 * WARNING: **All access to this account will be lost.** Any funds held in it will be
 * inaccessible.
 * 
 * Requires a `Signed` origin, and the sender account must have been created by a call to
 * `anonymous` with corresponding parameters.
 * 
 * - `spawner`: The account that originally called `anonymous` to create this account.
 * - `index`: The disambiguation index originally passed to `anonymous`. Probably `0`.
 * - `proxy_type`: The proxy type originally passed to `anonymous`.
 * - `height`: The height of the chain when the call to `anonymous` was processed.
 * - `ext_index`: The extrinsic index in which the call to `anonymous` was processed.
 * 
 * Fails with `NoPermission` in case the caller is not a previously created anonymous
 * account whose `anonymous` call has corresponding parameters.
 * 
 * # <weight>
 * Weight is a function of the number of proxies the user has (P).
 * # </weight>
 */
export type ProxyKillAnonymousCall = {
    spawner: AccountId32,
    proxyType: ProxyType,
    index: number,
    height: number,
    extIndex: number,
}

export const ProxyKillAnonymousCall: sts.Type<ProxyKillAnonymousCall> = sts.struct(() => {
    return  {
        spawner: AccountId32,
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
 * 
 * # <weight>
 * Weight is a function of the number of proxies the user has (P).
 * # </weight>
 * TODO: Might be over counting 1 read
 */
export type ProxyAnonymousCall = {
    proxyType: ProxyType,
    delay: number,
    index: number,
}

export const ProxyAnonymousCall: sts.Type<ProxyAnonymousCall> = sts.struct(() => {
    return  {
        proxyType: ProxyType,
        delay: sts.number(),
        index: sts.number(),
    }
})

/**
 * Publish the hash of a proxy-call that will be made in the future.
 * 
 * This must be called some number of blocks before the corresponding `proxy` is attempted
 * if the delay associated with the proxy relationship is greater than zero.
 * 
 * No more than `MaxPending` announcements may be made at any one time.
 * 
 * This will take a deposit of `AnnouncementDepositFactor` as well as
 * `AnnouncementDepositBase` if there are no other pending announcements.
 * 
 * The dispatch origin for this call must be _Signed_ and a proxy of `real`.
 * 
 * Parameters:
 * - `real`: The account that the proxy will make a call on behalf of.
 * - `call_hash`: The hash of the call to be made by the `real` account.
 * 
 * # <weight>
 * Weight is a function of:
 * - A: the number of announcements made.
 * - P: the number of proxies the user has.
 * # </weight>
 */
export type ProxyAnnounceCall = {
    real: AccountId32,
    callHash: H256,
}

export const ProxyAnnounceCall: sts.Type<ProxyAnnounceCall> = sts.struct(() => {
    return  {
        real: AccountId32,
        callHash: H256,
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
 * 
 * # <weight>
 * Weight is a function of the number of proxies the user has (P).
 * # </weight>
 */
export type ProxyAddProxyCall = {
    delegate: AccountId32,
    proxyType: ProxyType,
    delay: number,
}

export const ProxyAddProxyCall: sts.Type<ProxyAddProxyCall> = sts.struct(() => {
    return  {
        delegate: AccountId32,
        proxyType: ProxyType,
        delay: sts.number(),
    }
})

/**
 * A proxy was executed correctly, with the given \[result\].
 */
export type ProxyProxyExecutedEvent = [Type_52]

export const ProxyProxyExecutedEvent: sts.Type<ProxyProxyExecutedEvent> = sts.tuple(() => Type_52)

/**
 * A proxy was added. \[delegator, delegatee, proxy_type, delay\]
 */
export type ProxyProxyAddedEvent = [AccountId32, AccountId32, ProxyType, number]

export const ProxyProxyAddedEvent: sts.Type<ProxyProxyAddedEvent> = sts.tuple(() => AccountId32, AccountId32, ProxyType, sts.number())
