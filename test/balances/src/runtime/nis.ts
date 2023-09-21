import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9420 from './types/v9420'
import * as v9381 from './types/v9381'
import * as v9340 from './types/v9340'

export const events = {
    BidDropped: createEvent(
        'Nis.BidDropped',
        {
            v9340: v9340.NisBidDroppedEvent,
        }
    ),
    BidPlaced: createEvent(
        'Nis.BidPlaced',
        {
            v9340: v9340.NisBidPlacedEvent,
        }
    ),
    BidRetracted: createEvent(
        'Nis.BidRetracted',
        {
            v9340: v9340.NisBidRetractedEvent,
        }
    ),
    Funded: createEvent(
        'Nis.Funded',
        {
            v9340: v9340.NisFundedEvent,
        }
    ),
    Issued: createEvent(
        'Nis.Issued',
        {
            v9340: v9340.NisIssuedEvent,
        }
    ),
    Thawed: createEvent(
        'Nis.Thawed',
        {
            v9340: v9340.NisThawedEvent,
        }
    ),
    Transferred: createEvent(
        'Nis.Transferred',
        {
            v9340: v9340.NisTransferredEvent,
        }
    ),
}

export const calls = {
    communify: createCall(
        'Nis.communify',
        {
            v9381: v9381.NisCommunifyCall,
        }
    ),
    fund_deficit: createCall(
        'Nis.fund_deficit',
        {
            v9340: v9340.NisFundDeficitCall,
        }
    ),
    place_bid: createCall(
        'Nis.place_bid',
        {
            v9340: v9340.NisPlaceBidCall,
        }
    ),
    privatize: createCall(
        'Nis.privatize',
        {
            v9381: v9381.NisPrivatizeCall,
        }
    ),
    retract_bid: createCall(
        'Nis.retract_bid',
        {
            v9340: v9340.NisRetractBidCall,
        }
    ),
    thaw: createCall(
        'Nis.thaw',
        {
            v9340: v9340.NisThawCall,
        }
    ),
    thaw_communal: createCall(
        'Nis.thaw_communal',
        {
            v9381: v9381.NisThawCommunalCall,
        }
    ),
    thaw_private: createCall(
        'Nis.thaw_private',
        {
            v9381: v9381.NisThawPrivateCall,
        }
    ),
}

export const constants = {
    BasePeriod: createConstant(
        'Nis.BasePeriod',
        {
            v9340: v9340.NisBasePeriodConstant,
        }
    ),
    FifoQueueLen: createConstant(
        'Nis.FifoQueueLen',
        {
            v9340: v9340.NisFifoQueueLenConstant,
        }
    ),
    HoldReason: createConstant(
        'Nis.HoldReason',
        {
            v9420: v9420.NisHoldReasonConstant,
        }
    ),
    IntakePeriod: createConstant(
        'Nis.IntakePeriod',
        {
            v9340: v9340.NisIntakePeriodConstant,
        }
    ),
    MaxIntakeWeight: createConstant(
        'Nis.MaxIntakeWeight',
        {
            v9340: v9340.NisMaxIntakeWeightConstant,
        }
    ),
    MaxQueueLen: createConstant(
        'Nis.MaxQueueLen',
        {
            v9340: v9340.NisMaxQueueLenConstant,
        }
    ),
    MinBid: createConstant(
        'Nis.MinBid',
        {
            v9340: v9340.NisMinBidConstant,
        }
    ),
    MinReceipt: createConstant(
        'Nis.MinReceipt',
        {
            v9340: v9340.NisMinReceiptConstant,
        }
    ),
    PalletId: createConstant(
        'Nis.PalletId',
        {
            v9340: v9340.NisPalletIdConstant,
        }
    ),
    QueueCount: createConstant(
        'Nis.QueueCount',
        {
            v9340: v9340.NisQueueCountConstant,
        }
    ),
    ReserveId: createConstant(
        'Nis.ReserveId',
        {
            v9381: v9381.NisReserveIdConstant,
        }
    ),
    ThawThrottle: createConstant(
        'Nis.ThawThrottle',
        {
            v9340: v9340.NisThawThrottleConstant,
        }
    ),
}

export const storage = {
    QueueTotals: createStorage(
        'Nis.QueueTotals',
        {
            v9340: v9340.NisQueueTotalsStorage,
        }
    ),
    Queues: createStorage(
        'Nis.Queues',
        {
            v9340: v9340.NisQueuesStorage,
        }
    ),
    Receipts: createStorage(
        'Nis.Receipts',
        {
            v9340: v9340.NisReceiptsStorage,
            v9381: v9381.NisReceiptsStorage,
        }
    ),
    Summary: createStorage(
        'Nis.Summary',
        {
            v9340: v9340.NisSummaryStorage,
            v9381: v9381.NisSummaryStorage,
        }
    ),
}

export default {events, calls, constants}
