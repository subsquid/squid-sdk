import {sts} from '../../pallet.support'
import {Call} from './types'

export type WhitelistDispatchWhitelistedCallWithPreimageCall = {
    call: Call,
}

export const WhitelistDispatchWhitelistedCallWithPreimageCall: sts.Type<WhitelistDispatchWhitelistedCallWithPreimageCall> = sts.struct(() => {
    return  {
        call: Call,
    }
})
