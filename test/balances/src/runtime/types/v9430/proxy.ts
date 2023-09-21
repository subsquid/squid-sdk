import {sts} from '../../pallet.support'
import {MultiAddress, ProxyType, Call, Type_462} from './types'

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
 * A proxy was executed correctly, with the given.
 */
export type ProxyProxyExecutedEvent = {
    result: Type_462,
}

export const ProxyProxyExecutedEvent: sts.Type<ProxyProxyExecutedEvent> = sts.struct(() => {
    return  {
        result: Type_462,
    }
})
