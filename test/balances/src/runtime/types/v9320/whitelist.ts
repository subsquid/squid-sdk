import {sts} from '../../pallet.support'
import {H256, Call, Weight, Type_444} from './types'

export type WhitelistWhitelistCallCall = {
    callHash: H256,
}

export const WhitelistWhitelistCallCall: sts.Type<WhitelistWhitelistCallCall> = sts.struct(() => {
    return  {
        callHash: H256,
    }
})

export type WhitelistRemoveWhitelistedCallCall = {
    callHash: H256,
}

export const WhitelistRemoveWhitelistedCallCall: sts.Type<WhitelistRemoveWhitelistedCallCall> = sts.struct(() => {
    return  {
        callHash: H256,
    }
})

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
    callWeightWitness: Weight,
}

export const WhitelistDispatchWhitelistedCallCall: sts.Type<WhitelistDispatchWhitelistedCallCall> = sts.struct(() => {
    return  {
        callHash: H256,
        callWeightWitness: Weight,
    }
})

export type WhitelistWhitelistedCallRemovedEvent = {
    callHash: H256,
}

export const WhitelistWhitelistedCallRemovedEvent: sts.Type<WhitelistWhitelistedCallRemovedEvent> = sts.struct(() => {
    return  {
        callHash: H256,
    }
})

export type WhitelistWhitelistedCallDispatchedEvent = {
    callHash: H256,
    result: Type_444,
}

export const WhitelistWhitelistedCallDispatchedEvent: sts.Type<WhitelistWhitelistedCallDispatchedEvent> = sts.struct(() => {
    return  {
        callHash: H256,
        result: Type_444,
    }
})

export type WhitelistCallWhitelistedEvent = {
    callHash: H256,
}

export const WhitelistCallWhitelistedEvent: sts.Type<WhitelistCallWhitelistedEvent> = sts.struct(() => {
    return  {
        callHash: H256,
    }
})
