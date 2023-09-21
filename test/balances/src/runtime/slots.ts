import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9230 from './types/v9230'
import * as v9111 from './types/v9111'
import * as v9010 from './types/v9010'
import * as v1050 from './types/v1050'
import * as v1020 from './types/v1020'

export const events = {
    AuctionClosed: createEvent(
        'Slots.AuctionClosed',
        {
            v1020: v1020.SlotsAuctionClosedEvent,
        }
    ),
    AuctionStarted: createEvent(
        'Slots.AuctionStarted',
        {
            v1020: v1020.SlotsAuctionStartedEvent,
        }
    ),
    Leased: createEvent(
        'Slots.Leased',
        {
            v9010: v9010.SlotsLeasedEvent,
            v9230: v9230.SlotsLeasedEvent,
        }
    ),
    NewLeasePeriod: createEvent(
        'Slots.NewLeasePeriod',
        {
            v1020: v1020.SlotsNewLeasePeriodEvent,
            v9230: v9230.SlotsNewLeasePeriodEvent,
        }
    ),
    Reserved: createEvent(
        'Slots.Reserved',
        {
            v1020: v1020.SlotsReservedEvent,
        }
    ),
    Unreserved: createEvent(
        'Slots.Unreserved',
        {
            v1020: v1020.SlotsUnreservedEvent,
        }
    ),
    WonDeploy: createEvent(
        'Slots.WonDeploy',
        {
            v1020: v1020.SlotsWonDeployEvent,
        }
    ),
    WonRenewal: createEvent(
        'Slots.WonRenewal',
        {
            v1020: v1020.SlotsWonRenewalEvent,
        }
    ),
}

export const calls = {
    bid: createCall(
        'Slots.bid',
        {
            v1020: v1020.SlotsBidCall,
        }
    ),
    bid_renew: createCall(
        'Slots.bid_renew',
        {
            v1020: v1020.SlotsBidRenewCall,
        }
    ),
    clear_all_leases: createCall(
        'Slots.clear_all_leases',
        {
            v9010: v9010.SlotsClearAllLeasesCall,
        }
    ),
    elaborate_deploy_data: createCall(
        'Slots.elaborate_deploy_data',
        {
            v1020: v1020.SlotsElaborateDeployDataCall,
        }
    ),
    fix_deploy_data: createCall(
        'Slots.fix_deploy_data',
        {
            v1020: v1020.SlotsFixDeployDataCall,
            v1050: v1050.SlotsFixDeployDataCall,
        }
    ),
    force_lease: createCall(
        'Slots.force_lease',
        {
            v9010: v9010.SlotsForceLeaseCall,
            v9111: v9111.SlotsForceLeaseCall,
        }
    ),
    new_auction: createCall(
        'Slots.new_auction',
        {
            v1020: v1020.SlotsNewAuctionCall,
        }
    ),
    set_offboarding: createCall(
        'Slots.set_offboarding',
        {
            v1020: v1020.SlotsSetOffboardingCall,
            v1050: v1050.SlotsSetOffboardingCall,
        }
    ),
    trigger_onboard: createCall(
        'Slots.trigger_onboard',
        {
            v9010: v9010.SlotsTriggerOnboardCall,
        }
    ),
}

export const constants = {
    LeaseOffset: createConstant(
        'Slots.LeaseOffset',
        {
            v9111: v9111.SlotsLeaseOffsetConstant,
        }
    ),
    LeasePeriod: createConstant(
        'Slots.LeasePeriod',
        {
            v9010: v9010.SlotsLeasePeriodConstant,
        }
    ),
}

export const storage = {
    AuctionCounter: createStorage(
        'Slots.AuctionCounter',
        {
            v1020: v1020.SlotsAuctionCounterStorage,
        }
    ),
    AuctionInfo: createStorage(
        'Slots.AuctionInfo',
        {
            v1020: v1020.SlotsAuctionInfoStorage,
        }
    ),
    Deposits: createStorage(
        'Slots.Deposits',
        {
            v1020: v1020.SlotsDepositsStorage,
        }
    ),
    Leases: createStorage(
        'Slots.Leases',
        {
            v9010: v9010.SlotsLeasesStorage,
        }
    ),
    ManagedIds: createStorage(
        'Slots.ManagedIds',
        {
            v1020: v1020.SlotsManagedIdsStorage,
        }
    ),
    Offboarding: createStorage(
        'Slots.Offboarding',
        {
            v1020: v1020.SlotsOffboardingStorage,
        }
    ),
    OnboardQueue: createStorage(
        'Slots.OnboardQueue',
        {
            v1020: v1020.SlotsOnboardQueueStorage,
        }
    ),
    Onboarding: createStorage(
        'Slots.Onboarding',
        {
            v1020: v1020.SlotsOnboardingStorage,
        }
    ),
    ReservedAmounts: createStorage(
        'Slots.ReservedAmounts',
        {
            v1020: v1020.SlotsReservedAmountsStorage,
        }
    ),
    Winning: createStorage(
        'Slots.Winning',
        {
            v1020: v1020.SlotsWinningStorage,
        }
    ),
}

export default {events, calls, constants}
