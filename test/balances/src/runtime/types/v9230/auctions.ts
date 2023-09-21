import {sts} from '../../pallet.support'
import {AccountId32, Id} from './types'

/**
 * The winning offset was chosen for an auction. This will map into the `Winning` storage map.
 */
export type AuctionsWinningOffsetEvent = {
    auctionIndex: number,
    blockNumber: number,
}

export const AuctionsWinningOffsetEvent: sts.Type<AuctionsWinningOffsetEvent> = sts.struct(() => {
    return  {
        auctionIndex: sts.number(),
        blockNumber: sts.number(),
    }
})

/**
 * Funds were unreserved since bidder is no longer active. `[bidder, amount]`
 */
export type AuctionsUnreservedEvent = {
    bidder: AccountId32,
    amount: bigint,
}

export const AuctionsUnreservedEvent: sts.Type<AuctionsUnreservedEvent> = sts.struct(() => {
    return  {
        bidder: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * Funds were reserved for a winning bid. First balance is the extra amount reserved.
 * Second is the total.
 */
export type AuctionsReservedEvent = {
    bidder: AccountId32,
    extraReserved: bigint,
    totalAmount: bigint,
}

export const AuctionsReservedEvent: sts.Type<AuctionsReservedEvent> = sts.struct(() => {
    return  {
        bidder: AccountId32,
        extraReserved: sts.bigint(),
        totalAmount: sts.bigint(),
    }
})

/**
 * Someone attempted to lease the same slot twice for a parachain. The amount is held in reserve
 * but no parachain slot has been leased.
 */
export type AuctionsReserveConfiscatedEvent = {
    paraId: Id,
    leaser: AccountId32,
    amount: bigint,
}

export const AuctionsReserveConfiscatedEvent: sts.Type<AuctionsReserveConfiscatedEvent> = sts.struct(() => {
    return  {
        paraId: Id,
        leaser: AccountId32,
        amount: sts.bigint(),
    }
})

/**
 * A new bid has been accepted as the current winner.
 */
export type AuctionsBidAcceptedEvent = {
    bidder: AccountId32,
    paraId: Id,
    amount: bigint,
    firstSlot: number,
    lastSlot: number,
}

export const AuctionsBidAcceptedEvent: sts.Type<AuctionsBidAcceptedEvent> = sts.struct(() => {
    return  {
        bidder: AccountId32,
        paraId: Id,
        amount: sts.bigint(),
        firstSlot: sts.number(),
        lastSlot: sts.number(),
    }
})

/**
 * An auction started. Provides its index and the block number where it will begin to
 * close and the first lease period of the quadruplet that is auctioned.
 */
export type AuctionsAuctionStartedEvent = {
    auctionIndex: number,
    leasePeriod: number,
    ending: number,
}

export const AuctionsAuctionStartedEvent: sts.Type<AuctionsAuctionStartedEvent> = sts.struct(() => {
    return  {
        auctionIndex: sts.number(),
        leasePeriod: sts.number(),
        ending: sts.number(),
    }
})

/**
 * An auction ended. All funds become unreserved.
 */
export type AuctionsAuctionClosedEvent = {
    auctionIndex: number,
}

export const AuctionsAuctionClosedEvent: sts.Type<AuctionsAuctionClosedEvent> = sts.struct(() => {
    return  {
        auctionIndex: sts.number(),
    }
})
