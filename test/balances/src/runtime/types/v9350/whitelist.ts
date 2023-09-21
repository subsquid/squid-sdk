import {sts} from '../../pallet.support'
import {Call, H256, Weight} from './types'

export type WhitelistDispatchWhitelistedCallWithPreimageCall = {
    call: Call,
}

export const WhitelistDispatchWhitelistedCallWithPreimageCall: sts.Type<WhitelistDispatchWhitelistedCallWithPreimageCall> = sts.struct(() => {
    return  {
        call: Call,
    }
})

export type WhitelistDispatchWhitelistedCallCall = {
    callHash: H256,
    callEncodedLen: number,
    callWeightWitness: Weight,
}

export const WhitelistDispatchWhitelistedCallCall: sts.Type<WhitelistDispatchWhitelistedCallCall> = sts.struct(() => {
    return  {
        callHash: H256,
        callEncodedLen: sts.number(),
        callWeightWitness: Weight,
    }
})
