import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    ChannelClosed: createEvent(
        'Hrmp.ChannelClosed',
        {
            v9090: HrmpChannelClosedEvent,
            v9111: HrmpChannelClosedEvent,
        }
    ),
    HrmpChannelForceOpened: createEvent(
        'Hrmp.HrmpChannelForceOpened',
        {
            v9320: HrmpHrmpChannelForceOpenedEvent,
        }
    ),
    OpenChannelAccepted: createEvent(
        'Hrmp.OpenChannelAccepted',
        {
            v9090: HrmpOpenChannelAcceptedEvent,
        }
    ),
    OpenChannelCanceled: createEvent(
        'Hrmp.OpenChannelCanceled',
        {
            v9100: HrmpOpenChannelCanceledEvent,
            v9111: HrmpOpenChannelCanceledEvent,
        }
    ),
    OpenChannelRequested: createEvent(
        'Hrmp.OpenChannelRequested',
        {
            v9090: HrmpOpenChannelRequestedEvent,
        }
    ),
}

export const calls = {
    force_clean_hrmp: createCall(
        'Hrmp.force_clean_hrmp',
        {
            v9090: HrmpForceCleanHrmpCall,
            v9170: HrmpForceCleanHrmpCall,
        }
    ),
    force_open_hrmp_channel: createCall(
        'Hrmp.force_open_hrmp_channel',
        {
            v9320: HrmpForceOpenHrmpChannelCall,
        }
    ),
    force_process_hrmp_close: createCall(
        'Hrmp.force_process_hrmp_close',
        {
            v9090: HrmpForceProcessHrmpCloseCall,
            v9170: HrmpForceProcessHrmpCloseCall,
        }
    ),
    force_process_hrmp_open: createCall(
        'Hrmp.force_process_hrmp_open',
        {
            v9090: HrmpForceProcessHrmpOpenCall,
            v9170: HrmpForceProcessHrmpOpenCall,
        }
    ),
    hrmp_accept_open_channel: createCall(
        'Hrmp.hrmp_accept_open_channel',
        {
            v9090: HrmpHrmpAcceptOpenChannelCall,
        }
    ),
    hrmp_cancel_open_request: createCall(
        'Hrmp.hrmp_cancel_open_request',
        {
            v9100: HrmpHrmpCancelOpenRequestCall,
            v9111: HrmpHrmpCancelOpenRequestCall,
            v9170: HrmpHrmpCancelOpenRequestCall,
        }
    ),
    hrmp_close_channel: createCall(
        'Hrmp.hrmp_close_channel',
        {
            v9090: HrmpHrmpCloseChannelCall,
            v9111: HrmpHrmpCloseChannelCall,
        }
    ),
    hrmp_init_open_channel: createCall(
        'Hrmp.hrmp_init_open_channel',
        {
            v9090: HrmpHrmpInitOpenChannelCall,
            v9111: HrmpHrmpInitOpenChannelCall,
        }
    ),
}

export const storage = {
    HrmpAcceptedChannelRequestCount: createStorage(
        'Hrmp.HrmpAcceptedChannelRequestCount',
        {
            v9090: HrmpHrmpAcceptedChannelRequestCountStorage,
        }
    ),
    HrmpChannelContents: createStorage(
        'Hrmp.HrmpChannelContents',
        {
            v9090: HrmpHrmpChannelContentsStorage,
            v9111: HrmpHrmpChannelContentsStorage,
        }
    ),
    HrmpChannelDigests: createStorage(
        'Hrmp.HrmpChannelDigests',
        {
            v9090: HrmpHrmpChannelDigestsStorage,
        }
    ),
    HrmpChannels: createStorage(
        'Hrmp.HrmpChannels',
        {
            v9090: HrmpHrmpChannelsStorage,
            v9111: HrmpHrmpChannelsStorage,
        }
    ),
    HrmpCloseChannelRequests: createStorage(
        'Hrmp.HrmpCloseChannelRequests',
        {
            v9090: HrmpHrmpCloseChannelRequestsStorage,
            v9111: HrmpHrmpCloseChannelRequestsStorage,
        }
    ),
    HrmpCloseChannelRequestsList: createStorage(
        'Hrmp.HrmpCloseChannelRequestsList',
        {
            v9090: HrmpHrmpCloseChannelRequestsListStorage,
            v9111: HrmpHrmpCloseChannelRequestsListStorage,
        }
    ),
    HrmpEgressChannelsIndex: createStorage(
        'Hrmp.HrmpEgressChannelsIndex',
        {
            v9090: HrmpHrmpEgressChannelsIndexStorage,
        }
    ),
    HrmpIngressChannelsIndex: createStorage(
        'Hrmp.HrmpIngressChannelsIndex',
        {
            v9090: HrmpHrmpIngressChannelsIndexStorage,
        }
    ),
    HrmpOpenChannelRequestCount: createStorage(
        'Hrmp.HrmpOpenChannelRequestCount',
        {
            v9090: HrmpHrmpOpenChannelRequestCountStorage,
        }
    ),
    HrmpOpenChannelRequests: createStorage(
        'Hrmp.HrmpOpenChannelRequests',
        {
            v9090: HrmpHrmpOpenChannelRequestsStorage,
            v9111: HrmpHrmpOpenChannelRequestsStorage,
        }
    ),
    HrmpOpenChannelRequestsList: createStorage(
        'Hrmp.HrmpOpenChannelRequestsList',
        {
            v9090: HrmpHrmpOpenChannelRequestsListStorage,
            v9111: HrmpHrmpOpenChannelRequestsListStorage,
        }
    ),
    HrmpWatermarks: createStorage(
        'Hrmp.HrmpWatermarks',
        {
            v9090: HrmpHrmpWatermarksStorage,
        }
    ),
}

export default {events, calls}
