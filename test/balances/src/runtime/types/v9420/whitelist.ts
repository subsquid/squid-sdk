import {sts} from '../../pallet.support'
import {Call, H256, Type_454} from './types'

export type WhitelistDispatchWhitelistedCallWithPreimageCall = {
    call: Call,
}

export const WhitelistDispatchWhitelistedCallWithPreimageCall: sts.Type<WhitelistDispatchWhitelistedCallWithPreimageCall> = sts.struct(() => {
    return  {
        call: Call,
    }
})

export type WhitelistWhitelistedCallDispatchedEvent = {
    callHash: H256,
    result: Type_454,
}

export const WhitelistWhitelistedCallDispatchedEvent: sts.Type<WhitelistWhitelistedCallDispatchedEvent> = sts.struct(() => {
    return  {
        callHash: H256,
        result: Type_454,
    }
})
