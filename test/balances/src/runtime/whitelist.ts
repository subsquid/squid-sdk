import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9430 from './types/v9430'
import * as v9420 from './types/v9420'
import * as v9381 from './types/v9381'
import * as v9370 from './types/v9370'
import * as v9350 from './types/v9350'
import * as v9340 from './types/v9340'
import * as v9320 from './types/v9320'

export const events = {
    CallWhitelisted: createEvent(
        'Whitelist.CallWhitelisted',
        {
            v9320: v9320.WhitelistCallWhitelistedEvent,
        }
    ),
    WhitelistedCallDispatched: createEvent(
        'Whitelist.WhitelistedCallDispatched',
        {
            v9320: v9320.WhitelistWhitelistedCallDispatchedEvent,
            v9420: v9420.WhitelistWhitelistedCallDispatchedEvent,
            v9430: v9430.WhitelistWhitelistedCallDispatchedEvent,
        }
    ),
    WhitelistedCallRemoved: createEvent(
        'Whitelist.WhitelistedCallRemoved',
        {
            v9320: v9320.WhitelistWhitelistedCallRemovedEvent,
        }
    ),
}

export const calls = {
    dispatch_whitelisted_call: createCall(
        'Whitelist.dispatch_whitelisted_call',
        {
            v9320: v9320.WhitelistDispatchWhitelistedCallCall,
            v9350: v9350.WhitelistDispatchWhitelistedCallCall,
        }
    ),
    dispatch_whitelisted_call_with_preimage: createCall(
        'Whitelist.dispatch_whitelisted_call_with_preimage',
        {
            v9320: v9320.WhitelistDispatchWhitelistedCallWithPreimageCall,
            v9340: v9340.WhitelistDispatchWhitelistedCallWithPreimageCall,
            v9350: v9350.WhitelistDispatchWhitelistedCallWithPreimageCall,
            v9370: v9370.WhitelistDispatchWhitelistedCallWithPreimageCall,
            v9381: v9381.WhitelistDispatchWhitelistedCallWithPreimageCall,
            v9420: v9420.WhitelistDispatchWhitelistedCallWithPreimageCall,
            v9430: v9430.WhitelistDispatchWhitelistedCallWithPreimageCall,
        }
    ),
    remove_whitelisted_call: createCall(
        'Whitelist.remove_whitelisted_call',
        {
            v9320: v9320.WhitelistRemoveWhitelistedCallCall,
        }
    ),
    whitelist_call: createCall(
        'Whitelist.whitelist_call',
        {
            v9320: v9320.WhitelistWhitelistCallCall,
        }
    ),
}

export const storage = {
    WhitelistedCall: createStorage(
        'Whitelist.WhitelistedCall',
        {
            v9320: v9320.WhitelistWhitelistedCallStorage,
        }
    ),
}

export default {events, calls}
