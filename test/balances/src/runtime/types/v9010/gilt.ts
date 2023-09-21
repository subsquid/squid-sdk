import {sts} from '../../pallet.support'
import {ActiveIndex, AccountId, BalanceOf, BlockNumber} from './types'

/**
 *  Remove an active but expired gilt. Reserved funds under gilt are freed and balance is
 *  adjusted to ensure that the funds grow or shrink to maintain the equivalent proportion
 *  of effective total issued funds.
 * 
 *  Origin must be Signed and the account must be the owner of the gilt of the given index.
 * 
 *  - `index`: The index of the gilt to be thawed.
 */
export type GiltThawCall = {
    index: number,
}

export const GiltThawCall: sts.Type<GiltThawCall> = sts.struct(() => {
    return  {
        index: sts.number(),
    }
})

/**
 *  Set target proportion of gilt-funds.
 * 
 *  Origin must be `AdminOrigin`.
 * 
 *  - `target`: The target proportion of effective issued funds that should be under gilts
 *  at any one time.
 */
export type GiltSetTargetCall = {
    target: bigint,
}

export const GiltSetTargetCall: sts.Type<GiltSetTargetCall> = sts.struct(() => {
    return  {
        target: sts.bigint(),
    }
})

/**
 *  Retract a previously placed bid.
 * 
 *  Origin must be Signed, and the account should have previously issued a still-active bid
 *  of `amount` for `duration`.
 * 
 *  - `amount`: The amount of the previous bid.
 *  - `duration`: The duration of the previous bid.
 */
export type GiltRetractBidCall = {
    amount: bigint,
    duration: number,
}

export const GiltRetractBidCall: sts.Type<GiltRetractBidCall> = sts.struct(() => {
    return  {
        amount: sts.bigint(),
        duration: sts.number(),
    }
})

/**
 *  Place a bid for a gilt to be issued.
 * 
 *  Origin must be Signed, and account must have at least `amount` in free balance.
 * 
 *  - `amount`: The amount of the bid; these funds will be reserved. If the bid is
 *  successfully elevated into an issued gilt, then these funds will continue to be
 *  reserved until the gilt expires. Must be at least `MinFreeze`.
 *  - `duration`: The number of periods for which the funds will be locked if the gilt is
 *  issued. It will expire only after this period has elapsed after the point of issuance.
 *  Must be greater than 1 and no more than `QueueCount`.
 * 
 *  Complexities:
 *  - `Queues[duration].len()` (just take max).
 */
export type GiltPlaceBidCall = {
    amount: bigint,
    duration: number,
}

export const GiltPlaceBidCall: sts.Type<GiltPlaceBidCall> = sts.struct(() => {
    return  {
        amount: sts.bigint(),
        duration: sts.number(),
    }
})

/**
 *  An expired gilt has been thawed.
 *  \[ index, who, original_amount, additional_amount \]
 */
export type GiltGiltThawedEvent = [ActiveIndex, AccountId, BalanceOf, BalanceOf]

export const GiltGiltThawedEvent: sts.Type<GiltGiltThawedEvent> = sts.tuple(() => ActiveIndex, AccountId, BalanceOf, BalanceOf)

/**
 *  A bid was accepted as a gilt. The balance may not be released until expiry.
 *  \[ index, expiry, who, amount \]
 */
export type GiltGiltIssuedEvent = [ActiveIndex, BlockNumber, AccountId, BalanceOf]

export const GiltGiltIssuedEvent: sts.Type<GiltGiltIssuedEvent> = sts.tuple(() => ActiveIndex, BlockNumber, AccountId, BalanceOf)

/**
 *  A bid was successfully removed (before being accepted as a gilt).
 *  \[ who, amount, duration \]
 */
export type GiltBidRetractedEvent = [AccountId, BalanceOf, number]

export const GiltBidRetractedEvent: sts.Type<GiltBidRetractedEvent> = sts.tuple(() => AccountId, BalanceOf, sts.number())

/**
 *  A bid was successfully placed.
 *  \[ who, amount, duration \]
 */
export type GiltBidPlacedEvent = [AccountId, BalanceOf, number]

export const GiltBidPlacedEvent: sts.Type<GiltBidPlacedEvent> = sts.tuple(() => AccountId, BalanceOf, sts.number())
