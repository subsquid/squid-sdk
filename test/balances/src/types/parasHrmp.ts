import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    ChannelClosed: createEvent(
        'ParasHrmp.ChannelClosed',
        {
            v9010: ParasHrmpChannelClosedEvent,
        }
    ),
    OpenChannelAccepted: createEvent(
        'ParasHrmp.OpenChannelAccepted',
        {
            v9010: ParasHrmpOpenChannelAcceptedEvent,
        }
    ),
    OpenChannelRequested: createEvent(
        'ParasHrmp.OpenChannelRequested',
        {
            v9010: ParasHrmpOpenChannelRequestedEvent,
        }
    ),
}

export const calls = {
    force_clean_hrmp: createCall(
        'ParasHrmp.force_clean_hrmp',
        {
            v9010: ParasHrmpForceCleanHrmpCall,
        }
    ),
    force_process_hrmp_close: createCall(
        'ParasHrmp.force_process_hrmp_close',
        {
            v9010: ParasHrmpForceProcessHrmpCloseCall,
        }
    ),
    force_process_hrmp_open: createCall(
        'ParasHrmp.force_process_hrmp_open',
        {
            v9010: ParasHrmpForceProcessHrmpOpenCall,
        }
    ),
    hrmp_accept_open_channel: createCall(
        'ParasHrmp.hrmp_accept_open_channel',
        {
            v9010: ParasHrmpHrmpAcceptOpenChannelCall,
        }
    ),
    hrmp_close_channel: createCall(
        'ParasHrmp.hrmp_close_channel',
        {
            v9010: ParasHrmpHrmpCloseChannelCall,
        }
    ),
    hrmp_init_open_channel: createCall(
        'ParasHrmp.hrmp_init_open_channel',
        {
            v9010: ParasHrmpHrmpInitOpenChannelCall,
        }
    ),
}

export const storage = {
    HrmpAcceptedChannelRequestCount: createStorage(
        'ParasHrmp.HrmpAcceptedChannelRequestCount',
        {
            v9010: ParasHrmpHrmpAcceptedChannelRequestCountStorage,
        }
    ),
    HrmpChannelContents: createStorage(
        'ParasHrmp.HrmpChannelContents',
        {
            v9010: ParasHrmpHrmpChannelContentsStorage,
        }
    ),
    HrmpChannelDigests: createStorage(
        'ParasHrmp.HrmpChannelDigests',
        {
            v9010: ParasHrmpHrmpChannelDigestsStorage,
        }
    ),
    HrmpChannels: createStorage(
        'ParasHrmp.HrmpChannels',
        {
            v9010: ParasHrmpHrmpChannelsStorage,
        }
    ),
    HrmpCloseChannelRequests: createStorage(
        'ParasHrmp.HrmpCloseChannelRequests',
        {
            v9010: ParasHrmpHrmpCloseChannelRequestsStorage,
        }
    ),
    HrmpCloseChannelRequestsList: createStorage(
        'ParasHrmp.HrmpCloseChannelRequestsList',
        {
            v9010: ParasHrmpHrmpCloseChannelRequestsListStorage,
        }
    ),
    HrmpEgressChannelsIndex: createStorage(
        'ParasHrmp.HrmpEgressChannelsIndex',
        {
            v9010: ParasHrmpHrmpEgressChannelsIndexStorage,
        }
    ),
    HrmpIngressChannelsIndex: createStorage(
        'ParasHrmp.HrmpIngressChannelsIndex',
        {
            v9010: ParasHrmpHrmpIngressChannelsIndexStorage,
        }
    ),
    HrmpOpenChannelRequestCount: createStorage(
        'ParasHrmp.HrmpOpenChannelRequestCount',
        {
            v9010: ParasHrmpHrmpOpenChannelRequestCountStorage,
        }
    ),
    HrmpOpenChannelRequests: createStorage(
        'ParasHrmp.HrmpOpenChannelRequests',
        {
            v9010: ParasHrmpHrmpOpenChannelRequestsStorage,
        }
    ),
    HrmpOpenChannelRequestsList: createStorage(
        'ParasHrmp.HrmpOpenChannelRequestsList',
        {
            v9010: ParasHrmpHrmpOpenChannelRequestsListStorage,
        }
    ),
    HrmpWatermarks: createStorage(
        'ParasHrmp.HrmpWatermarks',
        {
            v9010: ParasHrmpHrmpWatermarksStorage,
        }
    ),
}

export default {events, calls}
