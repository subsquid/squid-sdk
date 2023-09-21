import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9130 from './types/v9130'
import * as v9111 from './types/v9111'
import * as v9090 from './types/v9090'
import * as v1062 from './types/v1062'
import * as v1045 from './types/v1045'
import * as v1020 from './types/v1020'

export const events = {
    AllGood: createEvent(
        'ImOnline.AllGood',
        {
            v1020: v1020.ImOnlineAllGoodEvent,
        }
    ),
    HeartbeatReceived: createEvent(
        'ImOnline.HeartbeatReceived',
        {
            v1020: v1020.ImOnlineHeartbeatReceivedEvent,
            v9130: v9130.ImOnlineHeartbeatReceivedEvent,
        }
    ),
    SomeOffline: createEvent(
        'ImOnline.SomeOffline',
        {
            v1020: v1020.ImOnlineSomeOfflineEvent,
            v9130: v9130.ImOnlineSomeOfflineEvent,
        }
    ),
}

export const calls = {
    heartbeat: createCall(
        'ImOnline.heartbeat',
        {
            v1020: v1020.ImOnlineHeartbeatCall,
            v1062: v1062.ImOnlineHeartbeatCall,
            v9111: v9111.ImOnlineHeartbeatCall,
        }
    ),
}

export const constants = {
    UnsignedPriority: createConstant(
        'ImOnline.UnsignedPriority',
        {
            v9090: v9090.ImOnlineUnsignedPriorityConstant,
        }
    ),
}

export const storage = {
    AuthoredBlocks: createStorage(
        'ImOnline.AuthoredBlocks',
        {
            v1020: v1020.ImOnlineAuthoredBlocksStorage,
        }
    ),
    GossipAt: createStorage(
        'ImOnline.GossipAt',
        {
            v1020: v1020.ImOnlineGossipAtStorage,
        }
    ),
    HeartbeatAfter: createStorage(
        'ImOnline.HeartbeatAfter',
        {
            v1045: v1045.ImOnlineHeartbeatAfterStorage,
        }
    ),
    Keys: createStorage(
        'ImOnline.Keys',
        {
            v1020: v1020.ImOnlineKeysStorage,
        }
    ),
    ReceivedHeartbeats: createStorage(
        'ImOnline.ReceivedHeartbeats',
        {
            v1020: v1020.ImOnlineReceivedHeartbeatsStorage,
            v9111: v9111.ImOnlineReceivedHeartbeatsStorage,
        }
    ),
}

export default {events, calls, constants}
