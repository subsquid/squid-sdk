import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9130 from './types/v9130'
import * as v9090 from './types/v9090'
import * as v9010 from './types/v9010'

export const events = {
    BidPlaced: createEvent(
        'Gilt.BidPlaced',
        {
            v9010: v9010.GiltBidPlacedEvent,
            v9130: v9130.GiltBidPlacedEvent,
        }
    ),
    BidRetracted: createEvent(
        'Gilt.BidRetracted',
        {
            v9010: v9010.GiltBidRetractedEvent,
            v9130: v9130.GiltBidRetractedEvent,
        }
    ),
    GiltIssued: createEvent(
        'Gilt.GiltIssued',
        {
            v9010: v9010.GiltGiltIssuedEvent,
            v9130: v9130.GiltGiltIssuedEvent,
        }
    ),
    GiltThawed: createEvent(
        'Gilt.GiltThawed',
        {
            v9010: v9010.GiltGiltThawedEvent,
            v9130: v9130.GiltGiltThawedEvent,
        }
    ),
}

export const calls = {
    place_bid: createCall(
        'Gilt.place_bid',
        {
            v9010: v9010.GiltPlaceBidCall,
        }
    ),
    retract_bid: createCall(
        'Gilt.retract_bid',
        {
            v9010: v9010.GiltRetractBidCall,
        }
    ),
    set_target: createCall(
        'Gilt.set_target',
        {
            v9010: v9010.GiltSetTargetCall,
        }
    ),
    thaw: createCall(
        'Gilt.thaw',
        {
            v9010: v9010.GiltThawCall,
        }
    ),
}

export const constants = {
    FifoQueueLen: createConstant(
        'Gilt.FifoQueueLen',
        {
            v9010: v9010.GiltFifoQueueLenConstant,
        }
    ),
    IgnoredIssuance: createConstant(
        'Gilt.IgnoredIssuance',
        {
            v9090: v9090.GiltIgnoredIssuanceConstant,
        }
    ),
    IntakePeriod: createConstant(
        'Gilt.IntakePeriod',
        {
            v9010: v9010.GiltIntakePeriodConstant,
        }
    ),
    MaxIntakeBids: createConstant(
        'Gilt.MaxIntakeBids',
        {
            v9010: v9010.GiltMaxIntakeBidsConstant,
        }
    ),
    MaxQueueLen: createConstant(
        'Gilt.MaxQueueLen',
        {
            v9010: v9010.GiltMaxQueueLenConstant,
        }
    ),
    MinFreeze: createConstant(
        'Gilt.MinFreeze',
        {
            v9010: v9010.GiltMinFreezeConstant,
        }
    ),
    Period: createConstant(
        'Gilt.Period',
        {
            v9010: v9010.GiltPeriodConstant,
        }
    ),
    QueueCount: createConstant(
        'Gilt.QueueCount',
        {
            v9010: v9010.GiltQueueCountConstant,
        }
    ),
}

export const storage = {
    Active: createStorage(
        'Gilt.Active',
        {
            v9010: v9010.GiltActiveStorage,
        }
    ),
    ActiveTotal: createStorage(
        'Gilt.ActiveTotal',
        {
            v9010: v9010.GiltActiveTotalStorage,
        }
    ),
    QueueTotals: createStorage(
        'Gilt.QueueTotals',
        {
            v9010: v9010.GiltQueueTotalsStorage,
        }
    ),
    Queues: createStorage(
        'Gilt.Queues',
        {
            v9010: v9010.GiltQueuesStorage,
        }
    ),
}

export default {events, calls, constants}
