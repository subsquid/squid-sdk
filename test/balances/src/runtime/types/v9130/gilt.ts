import {sts} from '../../pallet.support'
import {AccountId32} from './types'

/**
 * An expired gilt has been thawed.
 */
export type GiltGiltThawedEvent = {
    index: number,
    who: AccountId32,
    originalAmount: bigint,
    additionalAmount: bigint,
}

export const GiltGiltThawedEvent: sts.Type<GiltGiltThawedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        who: AccountId32,
        originalAmount: sts.bigint(),
        additionalAmount: sts.bigint(),
    }
})

/**
 * A bid was accepted as a gilt. The balance may not be released until expiry.
 */
export type GiltGiltIssuedEvent = {
    index: number,
    expiry: number,
    who: AccountId32,
    amount: bigint,
}

export const GiltGiltIssuedEvent: sts.Type<GiltGiltIssuedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        expiry: sts.number(),
        who: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * A bid was successfully removed (before being accepted as a gilt).
 */
export type GiltBidRetractedEvent = {
    who: AccountId32,
    amount: bigint,
    duration: number,
}

export const GiltBidRetractedEvent: sts.Type<GiltBidRetractedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        amount: sts.bigint(),
        duration: sts.number(),
    }
})

/**
 * A bid was successfully placed.
 */
export type GiltBidPlacedEvent = {
    who: AccountId32,
    amount: bigint,
    duration: number,
}

export const GiltBidPlacedEvent: sts.Type<GiltBidPlacedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        amount: sts.bigint(),
        duration: sts.number(),
    }
})
