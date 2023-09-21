import {sts} from '../../pallet.support'

/**
 * Create a new auction.
 * 
 * This can only happen when there isn't already an auction in progress and may only be
 * called by the root origin. Accepts the `duration` of this auction and the
 * `lease_period_index` of the initial lease period of the four that are to be auctioned.
 */
export type AuctionsNewAuctionCall = {
    duration: number,
    leasePeriodIndex: number,
}

export const AuctionsNewAuctionCall: sts.Type<AuctionsNewAuctionCall> = sts.struct(() => {
    return  {
        duration: sts.number(),
        leasePeriodIndex: sts.number(),
    }
})

/**
 * Make a new bid from an account (including a parachain account) for deploying a new
 * parachain.
 * 
 * Multiple simultaneous bids from the same bidder are allowed only as long as all active
 * bids overlap each other (i.e. are mutually exclusive). Bids cannot be redacted.
 * 
 * - `sub` is the sub-bidder ID, allowing for multiple competing bids to be made by (and
 * funded by) the same account.
 * - `auction_index` is the index of the auction to bid on. Should just be the present
 * value of `AuctionCounter`.
 * - `first_slot` is the first lease period index of the range to bid on. This is the
 * absolute lease period index value, not an auction-specific offset.
 * - `last_slot` is the last lease period index of the range to bid on. This is the
 * absolute lease period index value, not an auction-specific offset.
 * - `amount` is the amount to bid to be held as deposit for the parachain should the
 * bid win. This amount is held throughout the range.
 */
export type AuctionsBidCall = {
    para: number,
    auctionIndex: number,
    firstSlot: number,
    lastSlot: number,
    amount: bigint,
}

export const AuctionsBidCall: sts.Type<AuctionsBidCall> = sts.struct(() => {
    return  {
        para: sts.number(),
        auctionIndex: sts.number(),
        firstSlot: sts.number(),
        lastSlot: sts.number(),
        amount: sts.bigint(),
    }
})
