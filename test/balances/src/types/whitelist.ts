import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    CallWhitelisted: createEvent(
        'Whitelist.CallWhitelisted',
        {
            v9320: WhitelistCallWhitelistedEvent,
        }
    ),
    WhitelistedCallDispatched: createEvent(
        'Whitelist.WhitelistedCallDispatched',
        {
            v9320: WhitelistWhitelistedCallDispatchedEvent,
            v9420: WhitelistWhitelistedCallDispatchedEvent,
            v9430: WhitelistWhitelistedCallDispatchedEvent,
        }
    ),
    WhitelistedCallRemoved: createEvent(
        'Whitelist.WhitelistedCallRemoved',
        {
            v9320: WhitelistWhitelistedCallRemovedEvent,
        }
    ),
}

export const calls = {
    dispatch_whitelisted_call: createCall(
        'Whitelist.dispatch_whitelisted_call',
        {
            v9320: WhitelistDispatchWhitelistedCallCall,
            v9350: WhitelistDispatchWhitelistedCallCall,
        }
    ),
    dispatch_whitelisted_call_with_preimage: createCall(
        'Whitelist.dispatch_whitelisted_call_with_preimage',
        {
            v9320: WhitelistDispatchWhitelistedCallWithPreimageCall,
            v9340: WhitelistDispatchWhitelistedCallWithPreimageCall,
            v9350: WhitelistDispatchWhitelistedCallWithPreimageCall,
            v9370: WhitelistDispatchWhitelistedCallWithPreimageCall,
            v9381: WhitelistDispatchWhitelistedCallWithPreimageCall,
            v9420: WhitelistDispatchWhitelistedCallWithPreimageCall,
            v9430: WhitelistDispatchWhitelistedCallWithPreimageCall,
        }
    ),
    remove_whitelisted_call: createCall(
        'Whitelist.remove_whitelisted_call',
        {
            v9320: WhitelistRemoveWhitelistedCallCall,
        }
    ),
    whitelist_call: createCall(
        'Whitelist.whitelist_call',
        {
            v9320: WhitelistWhitelistCallCall,
        }
    ),
}

export const storage = {
    WhitelistedCall: createStorage(
        'Whitelist.WhitelistedCall',
        {
            v9320: WhitelistWhitelistedCallStorage,
        }
    ),
}

export default {events, calls}
