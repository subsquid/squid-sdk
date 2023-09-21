import {sts} from '../../pallet.support'
import {AccountId, ProxyType, Type_190} from './types'

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
    call: Type_190,
}

export const ProxyProxyCall: sts.Type<ProxyProxyCall> = sts.struct(() => {
    return  {
        real: AccountId,
        force_proxy_type: sts.option(() => ProxyType),
        call: Type_190,
    }
})
