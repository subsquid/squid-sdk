import {sts} from '../../pallet.support'
import {LookupSource, Hash, ParaId, SlotRange, Balance, NewBidder, AccountId, LeasePeriod, AuctionIndex, BlockNumber} from './types'

/**
 *  Set the off-boarding information for a parachain.
 * 
 *  The origin *must* be a parachain account.
 * 
 *  - `dest` is the destination account to receive the parachain's deposit.
 */
export type SlotsSetOffboardingCall = {
    dest: LookupSource,
}

export const SlotsSetOffboardingCall: sts.Type<SlotsSetOffboardingCall> = sts.struct(() => {
    return  {
        dest: LookupSource,
    }
})

/**
 *  Create a new auction.
 * 
 *  This can only happen when there isn't already an auction in progress and may only be
 *  called by the root origin. Accepts the `duration` of this auction and the
 *  `lease_period_index` of the initial lease period of the four that are to be auctioned.
 */
export type SlotsNewAuctionCall = {
    duration: number,
    lease_period_index: number,
}

export const SlotsNewAuctionCall: sts.Type<SlotsNewAuctionCall> = sts.struct(() => {
    return  {
        duration: sts.number(),
        lease_period_index: sts.number(),
    }
})

/**
 *  Set the deploy information for a successful bid to deploy a new parachain.
 * 
 *  - `origin` must be the successful bidder account.
 *  - `sub` is the sub-bidder ID of the bidder.
 *  - `para_id` is the parachain ID allotted to the winning bidder.
 *  - `code_hash` is the hash of the parachain's Wasm validation function.
 *  - `initial_head_data` is the parachain's initial head data.
 */
export type SlotsFixDeployDataCall = {
    sub: number,
    para_id: number,
    code_hash: Hash,
    initial_head_data: Bytes,
}

export const SlotsFixDeployDataCall: sts.Type<SlotsFixDeployDataCall> = sts.struct(() => {
    return  {
        sub: sts.number(),
        para_id: sts.number(),
        code_hash: Hash,
        initial_head_data: sts.bytes(),
    }
})

/**
 *  Note a new parachain's code.
 * 
 *  This must be called after `fix_deploy_data` and `code` must be the preimage of the
 *  `code_hash` passed there for the same `para_id`.
 * 
 *  This may be called before or after the beginning of the parachain's first lease period.
 *  If called before then the parachain will become active at the first block of its
 *  starting lease period. If after, then it will become active immediately after this call.
 * 
 *  - `_origin` is irrelevant.
 *  - `para_id` is the parachain ID whose code will be elaborated.
 *  - `code` is the preimage of the registered `code_hash` of `para_id`.
 */
export type SlotsElaborateDeployDataCall = {
    para_id: number,
    code: Bytes,
}

export const SlotsElaborateDeployDataCall: sts.Type<SlotsElaborateDeployDataCall> = sts.struct(() => {
    return  {
        para_id: sts.number(),
        code: sts.bytes(),
    }
})

/**
 *  Make a new bid from a parachain account for renewing that (pre-existing) parachain.
 * 
 *  The origin *must* be a parachain account.
 * 
 *  Multiple simultaneous bids from the same bidder are allowed only as long as all active
 *  bids overlap each other (i.e. are mutually exclusive). Bids cannot be redacted.
 * 
 *  - `auction_index` is the index of the auction to bid on. Should just be the present
 *  value of `AuctionCounter`.
 *  - `first_slot` is the first lease period index of the range to bid on. This is the
 *  absolute lease period index value, not an auction-specific offset.
 *  - `last_slot` is the last lease period index of the range to bid on. This is the
 *  absolute lease period index value, not an auction-specific offset.
 *  - `amount` is the amount to bid to be held as deposit for the parachain should the
 *  bid win. This amount is held throughout the range.
 */
export type SlotsBidRenewCall = {
    auction_index: number,
    first_slot: number,
    last_slot: number,
    amount: bigint,
}

export const SlotsBidRenewCall: sts.Type<SlotsBidRenewCall> = sts.struct(() => {
    return  {
        auction_index: sts.number(),
        first_slot: sts.number(),
        last_slot: sts.number(),
        amount: sts.bigint(),
    }
})

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
export type SlotsBidCall = {
    sub: number,
    auction_index: number,
    first_slot: number,
    last_slot: number,
    amount: bigint,
}

export const SlotsBidCall: sts.Type<SlotsBidCall> = sts.struct(() => {
    return  {
        sub: sts.number(),
        auction_index: sts.number(),
        first_slot: sts.number(),
        last_slot: sts.number(),
        amount: sts.bigint(),
    }
})

/**
 *  An existing parachain won the right to continue.
 *  First balance is the extra amount reseved. Second is the total amount reserved.
 */
export type SlotsWonRenewalEvent = [ParaId, SlotRange, Balance, Balance]

export const SlotsWonRenewalEvent: sts.Type<SlotsWonRenewalEvent> = sts.tuple(() => ParaId, SlotRange, Balance, Balance)

/**
 *  Someone won the right to deploy a parachain. Balance amount is deducted for deposit.
 */
export type SlotsWonDeployEvent = [NewBidder, SlotRange, ParaId, Balance]

export const SlotsWonDeployEvent: sts.Type<SlotsWonDeployEvent> = sts.tuple(() => NewBidder, SlotRange, ParaId, Balance)

/**
 *  Funds were unreserved since bidder is no longer active.
 */
export type SlotsUnreservedEvent = [AccountId, Balance]

export const SlotsUnreservedEvent: sts.Type<SlotsUnreservedEvent> = sts.tuple(() => AccountId, Balance)

/**
 *  Funds were reserved for a winning bid. First balance is the extra amount reserved.
 *  Second is the total.
 */
export type SlotsReservedEvent = [AccountId, Balance, Balance]

export const SlotsReservedEvent: sts.Type<SlotsReservedEvent> = sts.tuple(() => AccountId, Balance, Balance)

/**
 *  A new lease period is beginning.
 */
export type SlotsNewLeasePeriodEvent = [LeasePeriod]

export const SlotsNewLeasePeriodEvent: sts.Type<SlotsNewLeasePeriodEvent> = sts.tuple(() => LeasePeriod)

/**
 *  An auction started. Provides its index and the block number where it will begin to
 *  close and the first lease period of the quadruplet that is auctioned.
 */
export type SlotsAuctionStartedEvent = [AuctionIndex, LeasePeriod, BlockNumber]

export const SlotsAuctionStartedEvent: sts.Type<SlotsAuctionStartedEvent> = sts.tuple(() => AuctionIndex, LeasePeriod, BlockNumber)

/**
 *  An auction ended. All funds become unreserved.
 */
export type SlotsAuctionClosedEvent = [AuctionIndex]

export const SlotsAuctionClosedEvent: sts.Type<SlotsAuctionClosedEvent> = sts.tuple(() => AuctionIndex)
