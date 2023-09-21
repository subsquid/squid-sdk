import {sts} from '../../pallet.support'
import {ParaId, LeasePeriod, Balance, AccountId, SlotRange, AuctionIndex, BlockNumber} from './types'

/**
 *  Create a new auction.
 * 
 *  This can only happen when there isn't already an auction in progress and may only be
 *  called by the root origin. Accepts the `duration` of this auction and the
 *  `lease_period_index` of the initial lease period of the four that are to be auctioned.
 */
export type AuctionsNewAuctionCall = {
    duration: number,
    lease_period_index: number,
}

export const AuctionsNewAuctionCall: sts.Type<AuctionsNewAuctionCall> = sts.struct(() => {
    return  {
        duration: sts.number(),
        lease_period_index: sts.number(),
    }
})

/**
 *  Cancel an in-progress auction.
 * 
 *  Can only be called by Root origin.
 */
export type AuctionsCancelAuctionCall = null

export const AuctionsCancelAuctionCall: sts.Type<AuctionsCancelAuctionCall> = sts.unit()

/**
 *  Make a new bid from an account (including a parachain account) for deploying a new
 *  parachain.
 * 
 *  Multiple simultaneous bids from the same bidder are allowed only as long as all active
 *  bids overlap each other (i.e. are mutually exclusive). Bids cannot be redacted.
 * 
 *  - `sub` is the sub-bidder ID, allowing for multiple competing bids to be made by (and
 *  funded by) the same account.
 *  - `auction_index` is the index of the auction to bid on. Should just be the present
 *  value of `AuctionCounter`.
 *  - `first_slot` is the first lease period index of the range to bid on. This is the
 *  absolute lease period index value, not an auction-specific offset.
 *  - `last_slot` is the last lease period index of the range to bid on. This is the
 *  absolute lease period index value, not an auction-specific offset.
 *  - `amount` is the amount to bid to be held as deposit for the parachain should the
 *  bid win. This amount is held throughout the range.
 */
export type AuctionsBidCall = {
    para: number,
    auction_index: number,
    first_slot: number,
    last_slot: number,
    amount: bigint,
}

export const AuctionsBidCall: sts.Type<AuctionsBidCall> = sts.struct(() => {
    return  {
        para: sts.number(),
        auction_index: sts.number(),
        first_slot: sts.number(),
        last_slot: sts.number(),
        amount: sts.bigint(),
    }
})

/**
 *  An existing parachain won the right to continue.
 *  First balance is the extra amount reseved. Second is the total amount reserved.
 *  [parachain_id, begin, count, total_amount]
 */
export type AuctionsWonRenewalEvent = [ParaId, LeasePeriod, LeasePeriod, Balance]

export const AuctionsWonRenewalEvent: sts.Type<AuctionsWonRenewalEvent> = sts.tuple(() => ParaId, LeasePeriod, LeasePeriod, Balance)

/**
 *  Someone won the right to deploy a parachain. Balance amount is deducted for deposit.
 *  [bidder, range, parachain_id, amount]
 */
export type AuctionsWonDeployEvent = [AccountId, SlotRange, ParaId, Balance]

export const AuctionsWonDeployEvent: sts.Type<AuctionsWonDeployEvent> = sts.tuple(() => AccountId, SlotRange, ParaId, Balance)

/**
 *  The winning offset was chosen for an auction. This will map into the `Winning` storage map.
 *  \[auction_index, block_number\]
 */
export type AuctionsWinningOffsetEvent = [AuctionIndex, BlockNumber]

export const AuctionsWinningOffsetEvent: sts.Type<AuctionsWinningOffsetEvent> = sts.tuple(() => AuctionIndex, BlockNumber)

/**
 *  Funds were unreserved since bidder is no longer active. [bidder, amount]
 */
export type AuctionsUnreservedEvent = [AccountId, Balance]

export const AuctionsUnreservedEvent: sts.Type<AuctionsUnreservedEvent> = sts.tuple(() => AccountId, Balance)

/**
 *  Funds were reserved for a winning bid. First balance is the extra amount reserved.
 *  Second is the total. [bidder, extra_reserved, total_amount]
 */
export type AuctionsReservedEvent = [AccountId, Balance, Balance]

export const AuctionsReservedEvent: sts.Type<AuctionsReservedEvent> = sts.tuple(() => AccountId, Balance, Balance)

/**
 *  Someone attempted to lease the same slot twice for a parachain. The amount is held in reserve
 *  but no parachain slot has been leased.
 *  \[parachain_id, leaser, amount\]
 */
export type AuctionsReserveConfiscatedEvent = [ParaId, AccountId, Balance]

export const AuctionsReserveConfiscatedEvent: sts.Type<AuctionsReserveConfiscatedEvent> = sts.tuple(() => ParaId, AccountId, Balance)

/**
 *  A new bid has been accepted as the current winner.
 *  \[who, para_id, amount, first_slot, last_slot\]
 */
export type AuctionsBidAcceptedEvent = [AccountId, ParaId, Balance, LeasePeriod, LeasePeriod]

export const AuctionsBidAcceptedEvent: sts.Type<AuctionsBidAcceptedEvent> = sts.tuple(() => AccountId, ParaId, Balance, LeasePeriod, LeasePeriod)

/**
 *  An auction started. Provides its index and the block number where it will begin to
 *  close and the first lease period of the quadruplet that is auctioned.
 *  [auction_index, lease_period, ending]
 */
export type AuctionsAuctionStartedEvent = [AuctionIndex, LeasePeriod, BlockNumber]

export const AuctionsAuctionStartedEvent: sts.Type<AuctionsAuctionStartedEvent> = sts.tuple(() => AuctionIndex, LeasePeriod, BlockNumber)

/**
 *  An auction ended. All funds become unreserved. [auction_index]
 */
export type AuctionsAuctionClosedEvent = [AuctionIndex]

export const AuctionsAuctionClosedEvent: sts.Type<AuctionsAuctionClosedEvent> = sts.tuple(() => AuctionIndex)
