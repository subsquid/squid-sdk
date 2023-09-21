import {sts} from '../../pallet.support'
import {AccountId, ProxyType, Type_139} from './types'

/**
 *  Dispatch the given `call` from an account that the sender is authorized for through
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
    call: Type_139,
}

export const ProxyProxyAnnouncedCall: sts.Type<ProxyProxyAnnouncedCall> = sts.struct(() => {
    return  {
        delegate: AccountId,
        real: AccountId,
        force_proxy_type: sts.option(() => ProxyType),
        call: Type_139,
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
    call: Type_139,
}

export const ProxyProxyCall: sts.Type<ProxyProxyCall> = sts.struct(() => {
    return  {
        real: AccountId,
        force_proxy_type: sts.option(() => ProxyType),
        call: Type_139,
    }
})
