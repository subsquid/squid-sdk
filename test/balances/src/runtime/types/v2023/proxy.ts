import {sts} from '../../pallet.support'
import {AccountId, ProxyType, BlockNumber, CallHashOf, Type_194, Hash} from './types'

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
 *  Weight is a function of the number of proxies the user has (P).
 *  # </weight>
 */
export type ProxyRemoveProxyCall = {
    delegate: AccountId,
    proxy_type: ProxyType,
    delay: BlockNumber,
}

export const ProxyRemoveProxyCall: sts.Type<ProxyRemoveProxyCall> = sts.struct(() => {
    return  {
        delegate: AccountId,
        proxy_type: ProxyType,
        delay: BlockNumber,
    }
})

/**
 *  Remove a given announcement.
 * 
 *  May be called by a proxy account to remove a call they previously announced and return
 *  the deposit.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Parameters:
 *  - `real`: The account that the proxy will make a call on behalf of.
 *  - `call_hash`: The hash of the call to be made by the `real` account.
 * 
 *  # <weight>
 *  Weight is a function of:
 *  - A: the number of announcements made.
 *  - P: the number of proxies the user has.
 *  # </weight>
 */
export type ProxyRemoveAnnouncementCall = {
    real: AccountId,
    call_hash: CallHashOf,
}

export const ProxyRemoveAnnouncementCall: sts.Type<ProxyRemoveAnnouncementCall> = sts.struct(() => {
    return  {
        real: AccountId,
        call_hash: CallHashOf,
    }
})

/**
 *  Remove the given announcement of a delegate.
 * 
 *  May be called by a target (proxied) account to remove a call that one of their delegates
 *  (`delegate`) has announced they want to execute. The deposit is returned.
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Parameters:
 *  - `delegate`: The account that previously announced the call.
 *  - `call_hash`: The hash of the call to be made.
 * 
 *  # <weight>
 *  Weight is a function of:
 *  - A: the number of announcements made.
 *  - P: the number of proxies the user has.
 *  # </weight>
 */
export type ProxyRejectAnnouncementCall = {
    delegate: AccountId,
    call_hash: CallHashOf,
}

export const ProxyRejectAnnouncementCall: sts.Type<ProxyRejectAnnouncementCall> = sts.struct(() => {
    return  {
        delegate: AccountId,
        call_hash: CallHashOf,
    }
})

/**
 *  Dispatch the given `call` from an account that the sender is authorised for through
 *  `add_proxy`.
 * 
 *  Removes any corresponding announcement(s).
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Parameters:
 *  - `real`: The account that the proxy will make a call on behalf of.
 *  - `force_proxy_type`: Specify the exact proxy type to be used and checked for this call.
 *  - `call`: The call to be made by the `real` account.
 * 
 *  # <weight>
 *  Weight is a function of:
 *  - A: the number of announcements made.
 *  - P: the number of proxies the user has.
 *  # </weight>
 */
export type ProxyProxyAnnouncedCall = {
    delegate: AccountId,
    real: AccountId,
    force_proxy_type?: (ProxyType | undefined),
    call: Type_194,
}

export const ProxyProxyAnnouncedCall: sts.Type<ProxyProxyAnnouncedCall> = sts.struct(() => {
    return  {
        delegate: AccountId,
        real: AccountId,
        force_proxy_type: sts.option(() => ProxyType),
        call: Type_194,
    }
})

/**
 *  Dispatch the given `call` from an account that the sender is authorised for through
 *  `add_proxy`.
 * 
 *  Removes any corresponding announcement(s).
 * 
 *  The dispatch origin for this call must be _Signed_.
 * 
 *  Parameters:
 *  - `real`: The account that the proxy will make a call on behalf of.
 *  - `force_proxy_type`: Specify the exact proxy type to be used and checked for this call.
 *  - `call`: The call to be made by the `real` account.
 * 
 *  # <weight>
 *  Weight is a function of the number of proxies the user has (P).
 *  # </weight>
 */
export type ProxyProxyCall = {
    real: AccountId,
    force_proxy_type?: (ProxyType | undefined),
    call: Type_194,
}

export const ProxyProxyCall: sts.Type<ProxyProxyCall> = sts.struct(() => {
    return  {
        real: AccountId,
        force_proxy_type: sts.option(() => ProxyType),
        call: Type_194,
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
 *  - `delay`: The announcement period required of the initial proxy. Will generally be
 *  zero.
 * 
 *  Fails with `Duplicate` if this has already been called in this transaction, from the
 *  same sender, with the same parameters.
 * 
 *  Fails if there are insufficient funds to pay for deposit.
 * 
 *  # <weight>
 *  Weight is a function of the number of proxies the user has (P).
 *  # </weight>
 *  TODO: Might be over counting 1 read
 */
export type ProxyAnonymousCall = {
    proxy_type: ProxyType,
    delay: BlockNumber,
    index: number,
}

export const ProxyAnonymousCall: sts.Type<ProxyAnonymousCall> = sts.struct(() => {
    return  {
        proxy_type: ProxyType,
        delay: BlockNumber,
        index: sts.number(),
    }
})

/**
 *  Publish the hash of a proxy-call that will be made in the future.
 * 
 *  This must be called some number of blocks before the corresponding `proxy` is attempted
 *  if the delay associated with the proxy relationship is greater than zero.
 * 
 *  No more than `MaxPending` announcements may be made at any one time.
 * 
 *  This will take a deposit of `AnnouncementDepositFactor` as well as
 *  `AnnouncementDepositBase` if there are no other pending announcements.
 * 
 *  The dispatch origin for this call must be _Signed_ and a proxy of `real`.
 * 
 *  Parameters:
 *  - `real`: The account that the proxy will make a call on behalf of.
 *  - `call_hash`: The hash of the call to be made by the `real` account.
 * 
 *  # <weight>
 *  Weight is a function of:
 *  - A: the number of announcements made.
 *  - P: the number of proxies the user has.
 *  # </weight>
 */
export type ProxyAnnounceCall = {
    real: AccountId,
    call_hash: CallHashOf,
}

export const ProxyAnnounceCall: sts.Type<ProxyAnnounceCall> = sts.struct(() => {
    return  {
        real: AccountId,
        call_hash: CallHashOf,
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
 *  Weight is a function of the number of proxies the user has (P).
 *  # </weight>
 */
export type ProxyAddProxyCall = {
    delegate: AccountId,
    proxy_type: ProxyType,
    delay: BlockNumber,
}

export const ProxyAddProxyCall: sts.Type<ProxyAddProxyCall> = sts.struct(() => {
    return  {
        delegate: AccountId,
        proxy_type: ProxyType,
        delay: BlockNumber,
    }
})

/**
 *  An announcement was placed to make a call in the future. [real, proxy, call_hash]
 */
export type ProxyAnnouncedEvent = [AccountId, AccountId, Hash]

export const ProxyAnnouncedEvent: sts.Type<ProxyAnnouncedEvent> = sts.tuple(() => AccountId, AccountId, Hash)
