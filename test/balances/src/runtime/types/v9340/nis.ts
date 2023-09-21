import {sts} from '../../pallet.support'
import {AccountId32, Perquintill} from './types'

/**
 * Reduce or remove an outstanding receipt, placing the according proportion of funds into
 * the account of the owner.
 * 
 * - `origin`: Must be Signed and the account must be the owner of the receipt `index` as
 *   well as any fungible counterpart.
 * - `index`: The index of the receipt.
 * - `portion`: If `Some`, then only the given portion of the receipt should be thawed. If
 *   `None`, then all of it should be.
 */
export type NisThawCall = {
    index: number,
    portion?: (bigint | undefined),
}

export const NisThawCall: sts.Type<NisThawCall> = sts.struct(() => {
    return  {
        index: sts.number(),
        portion: sts.option(() => sts.bigint()),
    }
})

/**
 * Retract a previously placed bid.
 * 
 * Origin must be Signed, and the account should have previously issued a still-active bid
 * of `amount` for `duration`.
 * 
 * - `amount`: The amount of the previous bid.
 * - `duration`: The duration of the previous bid.
 */
export type NisRetractBidCall = {
    amount: bigint,
    duration: number,
}

export const NisRetractBidCall: sts.Type<NisRetractBidCall> = sts.struct(() => {
    return  {
        amount: sts.bigint(),
        duration: sts.number(),
    }
})

/**
 * Place a bid.
 * 
 * Origin must be Signed, and account must have at least `amount` in free balance.
 * 
 * - `amount`: The amount of the bid; these funds will be reserved, and if/when
 *   consolidated, removed. Must be at least `MinBid`.
 * - `duration`: The number of periods before which the newly consolidated bid may be
 *   thawed. Must be greater than 1 and no more than `QueueCount`.
 * 
 * Complexities:
 * - `Queues[duration].len()` (just take max).
 */
export type NisPlaceBidCall = {
    amount: bigint,
    duration: number,
}

export const NisPlaceBidCall: sts.Type<NisPlaceBidCall> = sts.struct(() => {
    return  {
        amount: sts.bigint(),
        duration: sts.number(),
    }
})

/**
 * Ensure we have sufficient funding for all potential payouts.
 * 
 * - `origin`: Must be accepted by `FundOrigin`.
 */
export type NisFundDeficitCall = null

export const NisFundDeficitCall: sts.Type<NisFundDeficitCall> = sts.unit()

/**
 * A receipt was transfered.
 */
export type NisTransferredEvent = {
    from: AccountId32,
    to: AccountId32,
    index: number,
}

export const NisTransferredEvent: sts.Type<NisTransferredEvent> = sts.struct(() => {
    return  {
        from: AccountId32,
        to: AccountId32,
        index: sts.number(),
    }
})

/**
 * An receipt has been (at least partially) thawed.
 */
export type NisThawedEvent = {
    index: number,
    who: AccountId32,
    proportion: Perquintill,
    amount: bigint,
    dropped: boolean,
}

export const NisThawedEvent: sts.Type<NisThawedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        who: AccountId32,
        proportion: Perquintill,
        amount: sts.bigint(),
        dropped: sts.boolean(),
    }
})

/**
 * A bid was accepted. The balance may not be released until expiry.
 */
export type NisIssuedEvent = {
    index: number,
    expiry: number,
    who: AccountId32,
    proportion: Perquintill,
    amount: bigint,
}

export const NisIssuedEvent: sts.Type<NisIssuedEvent> = sts.struct(() => {
    return  {
        index: sts.number(),
        expiry: sts.number(),
        who: AccountId32,
        proportion: Perquintill,
        amount: sts.bigint(),
    }
})

/**
 * An automatic funding of the deficit was made.
 */
export type NisFundedEvent = {
    deficit: bigint,
}

export const NisFundedEvent: sts.Type<NisFundedEvent> = sts.struct(() => {
    return  {
        deficit: sts.bigint(),
    }
})

/**
 * A bid was successfully removed (before being accepted).
 */
export type NisBidRetractedEvent = {
    who: AccountId32,
    amount: bigint,
    duration: number,
}

export const NisBidRetractedEvent: sts.Type<NisBidRetractedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        amount: sts.bigint(),
        duration: sts.number(),
    }
})

/**
 * A bid was successfully placed.
 */
export type NisBidPlacedEvent = {
    who: AccountId32,
    amount: bigint,
    duration: number,
}

export const NisBidPlacedEvent: sts.Type<NisBidPlacedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        amount: sts.bigint(),
        duration: sts.number(),
    }
})

/**
 * A bid was dropped from a queue because of another, more substantial, bid was present.
 */
export type NisBidDroppedEvent = {
    who: AccountId32,
    amount: bigint,
    duration: number,
}

export const NisBidDroppedEvent: sts.Type<NisBidDroppedEvent> = sts.struct(() => {
    return  {
        who: AccountId32,
        amount: sts.bigint(),
        duration: sts.number(),
    }
})
