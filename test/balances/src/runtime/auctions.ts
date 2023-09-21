import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9230 from './types/v9230'
import * as v9111 from './types/v9111'
import * as v9010 from './types/v9010'

export const events = {
    AuctionClosed: createEvent(
        'Auctions.AuctionClosed',
        {
            v9010: v9010.AuctionsAuctionClosedEvent,
            v9230: v9230.AuctionsAuctionClosedEvent,
        }
    ),
    AuctionStarted: createEvent(
        'Auctions.AuctionStarted',
        {
            v9010: v9010.AuctionsAuctionStartedEvent,
            v9230: v9230.AuctionsAuctionStartedEvent,
        }
    ),
    BidAccepted: createEvent(
        'Auctions.BidAccepted',
        {
            v9010: v9010.AuctionsBidAcceptedEvent,
            v9230: v9230.AuctionsBidAcceptedEvent,
        }
    ),
    ReserveConfiscated: createEvent(
        'Auctions.ReserveConfiscated',
        {
            v9010: v9010.AuctionsReserveConfiscatedEvent,
            v9230: v9230.AuctionsReserveConfiscatedEvent,
        }
    ),
    Reserved: createEvent(
        'Auctions.Reserved',
        {
            v9010: v9010.AuctionsReservedEvent,
            v9230: v9230.AuctionsReservedEvent,
        }
    ),
    Unreserved: createEvent(
        'Auctions.Unreserved',
        {
            v9010: v9010.AuctionsUnreservedEvent,
            v9230: v9230.AuctionsUnreservedEvent,
        }
    ),
    WinningOffset: createEvent(
        'Auctions.WinningOffset',
        {
            v9010: v9010.AuctionsWinningOffsetEvent,
            v9230: v9230.AuctionsWinningOffsetEvent,
        }
    ),
    WonDeploy: createEvent(
        'Auctions.WonDeploy',
        {
            v9010: v9010.AuctionsWonDeployEvent,
        }
    ),
    WonRenewal: createEvent(
        'Auctions.WonRenewal',
        {
            v9010: v9010.AuctionsWonRenewalEvent,
        }
    ),
}

export const calls = {
    bid: createCall(
        'Auctions.bid',
        {
            v9010: v9010.AuctionsBidCall,
            v9111: v9111.AuctionsBidCall,
        }
    ),
    cancel_auction: createCall(
        'Auctions.cancel_auction',
        {
            v9010: v9010.AuctionsCancelAuctionCall,
        }
    ),
    new_auction: createCall(
        'Auctions.new_auction',
        {
            v9010: v9010.AuctionsNewAuctionCall,
            v9111: v9111.AuctionsNewAuctionCall,
        }
    ),
}

export const constants = {
    EndingPeriod: createConstant(
        'Auctions.EndingPeriod',
        {
            v9010: v9010.AuctionsEndingPeriodConstant,
        }
    ),
    LeasePeriodsPerSlot: createConstant(
        'Auctions.LeasePeriodsPerSlot',
        {
            v9010: v9010.AuctionsLeasePeriodsPerSlotConstant,
        }
    ),
    SampleLength: createConstant(
        'Auctions.SampleLength',
        {
            v9010: v9010.AuctionsSampleLengthConstant,
        }
    ),
    SlotRangeCount: createConstant(
        'Auctions.SlotRangeCount',
        {
            v9010: v9010.AuctionsSlotRangeCountConstant,
        }
    ),
}

export const storage = {
    AuctionCounter: createStorage(
        'Auctions.AuctionCounter',
        {
            v9010: v9010.AuctionsAuctionCounterStorage,
        }
    ),
    AuctionInfo: createStorage(
        'Auctions.AuctionInfo',
        {
            v9010: v9010.AuctionsAuctionInfoStorage,
        }
    ),
    ReservedAmounts: createStorage(
        'Auctions.ReservedAmounts',
        {
            v9010: v9010.AuctionsReservedAmountsStorage,
        }
    ),
    Winning: createStorage(
        'Auctions.Winning',
        {
            v9010: v9010.AuctionsWinningStorage,
        }
    ),
}

export default {events, calls, constants}
