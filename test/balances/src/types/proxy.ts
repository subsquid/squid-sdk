import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const events = {
    Announced: createEvent(
        'Proxy.Announced',
        {
            v2023: ProxyAnnouncedEvent,
            v9130: ProxyAnnouncedEvent,
        }
    ),
    AnonymousCreated: createEvent(
        'Proxy.AnonymousCreated',
        {
            v2005: ProxyAnonymousCreatedEvent,
            v9130: ProxyAnonymousCreatedEvent,
            v9180: ProxyAnonymousCreatedEvent,
        }
    ),
    ProxyAdded: createEvent(
        'Proxy.ProxyAdded',
        {
            v9111: ProxyProxyAddedEvent,
            v9130: ProxyProxyAddedEvent,
            v9180: ProxyProxyAddedEvent,
            v9420: ProxyProxyAddedEvent,
        }
    ),
    ProxyExecuted: createEvent(
        'Proxy.ProxyExecuted',
        {
            v2005: ProxyProxyExecutedEvent,
            v9111: ProxyProxyExecutedEvent,
            v9130: ProxyProxyExecutedEvent,
            v9160: ProxyProxyExecutedEvent,
            v9170: ProxyProxyExecutedEvent,
            v9190: ProxyProxyExecutedEvent,
            v9320: ProxyProxyExecutedEvent,
            v9420: ProxyProxyExecutedEvent,
            v9430: ProxyProxyExecutedEvent,
        }
    ),
    ProxyRemoved: createEvent(
        'Proxy.ProxyRemoved',
        {
            v9190: ProxyProxyRemovedEvent,
            v9420: ProxyProxyRemovedEvent,
        }
    ),
    PureCreated: createEvent(
        'Proxy.PureCreated',
        {
            v9300: ProxyPureCreatedEvent,
            v9420: ProxyPureCreatedEvent,
        }
    ),
}

export const calls = {
    add_proxy: createCall(
        'Proxy.add_proxy',
        {
            v2005: ProxyAddProxyCall,
            v2023: ProxyAddProxyCall,
            v9111: ProxyAddProxyCall,
            v9180: ProxyAddProxyCall,
            v9291: ProxyAddProxyCall,
            v9420: ProxyAddProxyCall,
        }
    ),
    announce: createCall(
        'Proxy.announce',
        {
            v2023: ProxyAnnounceCall,
            v9111: ProxyAnnounceCall,
            v9291: ProxyAnnounceCall,
        }
    ),
    anonymous: createCall(
        'Proxy.anonymous',
        {
            v2005: ProxyAnonymousCall,
            v2023: ProxyAnonymousCall,
            v9111: ProxyAnonymousCall,
            v9180: ProxyAnonymousCall,
        }
    ),
    create_pure: createCall(
        'Proxy.create_pure',
        {
            v9300: ProxyCreatePureCall,
            v9420: ProxyCreatePureCall,
        }
    ),
    kill_anonymous: createCall(
        'Proxy.kill_anonymous',
        {
            v2005: ProxyKillAnonymousCall,
            v9111: ProxyKillAnonymousCall,
            v9180: ProxyKillAnonymousCall,
            v9291: ProxyKillAnonymousCall,
        }
    ),
    kill_pure: createCall(
        'Proxy.kill_pure',
        {
            v9300: ProxyKillPureCall,
            v9420: ProxyKillPureCall,
        }
    ),
    proxy: createCall(
        'Proxy.proxy',
        {
            v2005: ProxyProxyCall,
            v2007: ProxyProxyCall,
            v2011: ProxyProxyCall,
            v2013: ProxyProxyCall,
            v2015: ProxyProxyCall,
            v2022: ProxyProxyCall,
            v2023: ProxyProxyCall,
            v2024: ProxyProxyCall,
            v2025: ProxyProxyCall,
            v2026: ProxyProxyCall,
            v2028: ProxyProxyCall,
            v2029: ProxyProxyCall,
            v2030: ProxyProxyCall,
            v9010: ProxyProxyCall,
            v9030: ProxyProxyCall,
            v9040: ProxyProxyCall,
            v9050: ProxyProxyCall,
            v9080: ProxyProxyCall,
            v9090: ProxyProxyCall,
            v9100: ProxyProxyCall,
            v9111: ProxyProxyCall,
            v9122: ProxyProxyCall,
            v9130: ProxyProxyCall,
            v9160: ProxyProxyCall,
            v9170: ProxyProxyCall,
            v9180: ProxyProxyCall,
            v9190: ProxyProxyCall,
            v9220: ProxyProxyCall,
            v9230: ProxyProxyCall,
            v9250: ProxyProxyCall,
            v9271: ProxyProxyCall,
            v9291: ProxyProxyCall,
            v9300: ProxyProxyCall,
            v9320: ProxyProxyCall,
            v9340: ProxyProxyCall,
            v9350: ProxyProxyCall,
            v9370: ProxyProxyCall,
            v9381: ProxyProxyCall,
            v9420: ProxyProxyCall,
            v9430: ProxyProxyCall,
        }
    ),
    proxy_announced: createCall(
        'Proxy.proxy_announced',
        {
            v2023: ProxyProxyAnnouncedCall,
            v2024: ProxyProxyAnnouncedCall,
            v2025: ProxyProxyAnnouncedCall,
            v2026: ProxyProxyAnnouncedCall,
            v2028: ProxyProxyAnnouncedCall,
            v2029: ProxyProxyAnnouncedCall,
            v2030: ProxyProxyAnnouncedCall,
            v9010: ProxyProxyAnnouncedCall,
            v9030: ProxyProxyAnnouncedCall,
            v9040: ProxyProxyAnnouncedCall,
            v9050: ProxyProxyAnnouncedCall,
            v9080: ProxyProxyAnnouncedCall,
            v9090: ProxyProxyAnnouncedCall,
            v9100: ProxyProxyAnnouncedCall,
            v9111: ProxyProxyAnnouncedCall,
            v9122: ProxyProxyAnnouncedCall,
            v9130: ProxyProxyAnnouncedCall,
            v9160: ProxyProxyAnnouncedCall,
            v9170: ProxyProxyAnnouncedCall,
            v9180: ProxyProxyAnnouncedCall,
            v9190: ProxyProxyAnnouncedCall,
            v9220: ProxyProxyAnnouncedCall,
            v9230: ProxyProxyAnnouncedCall,
            v9250: ProxyProxyAnnouncedCall,
            v9271: ProxyProxyAnnouncedCall,
            v9291: ProxyProxyAnnouncedCall,
            v9300: ProxyProxyAnnouncedCall,
            v9320: ProxyProxyAnnouncedCall,
            v9340: ProxyProxyAnnouncedCall,
            v9350: ProxyProxyAnnouncedCall,
            v9370: ProxyProxyAnnouncedCall,
            v9381: ProxyProxyAnnouncedCall,
            v9420: ProxyProxyAnnouncedCall,
            v9430: ProxyProxyAnnouncedCall,
        }
    ),
    reject_announcement: createCall(
        'Proxy.reject_announcement',
        {
            v2023: ProxyRejectAnnouncementCall,
            v9111: ProxyRejectAnnouncementCall,
            v9291: ProxyRejectAnnouncementCall,
        }
    ),
    remove_announcement: createCall(
        'Proxy.remove_announcement',
        {
            v2023: ProxyRemoveAnnouncementCall,
            v9111: ProxyRemoveAnnouncementCall,
            v9291: ProxyRemoveAnnouncementCall,
        }
    ),
    remove_proxies: createCall(
        'Proxy.remove_proxies',
        {
            v2005: ProxyRemoveProxiesCall,
        }
    ),
    remove_proxy: createCall(
        'Proxy.remove_proxy',
        {
            v2005: ProxyRemoveProxyCall,
            v2023: ProxyRemoveProxyCall,
            v9111: ProxyRemoveProxyCall,
            v9180: ProxyRemoveProxyCall,
            v9291: ProxyRemoveProxyCall,
            v9420: ProxyRemoveProxyCall,
        }
    ),
}

export const constants = {
    AnnouncementDepositBase: createConstant(
        'Proxy.AnnouncementDepositBase',
        {
            v2023: ProxyAnnouncementDepositBaseConstant,
        }
    ),
    AnnouncementDepositFactor: createConstant(
        'Proxy.AnnouncementDepositFactor',
        {
            v2023: ProxyAnnouncementDepositFactorConstant,
        }
    ),
    MaxPending: createConstant(
        'Proxy.MaxPending',
        {
            v2023: ProxyMaxPendingConstant,
        }
    ),
    MaxProxies: createConstant(
        'Proxy.MaxProxies',
        {
            v2011: ProxyMaxProxiesConstant,
        }
    ),
    ProxyDepositBase: createConstant(
        'Proxy.ProxyDepositBase',
        {
            v2011: ProxyProxyDepositBaseConstant,
        }
    ),
    ProxyDepositFactor: createConstant(
        'Proxy.ProxyDepositFactor',
        {
            v2011: ProxyProxyDepositFactorConstant,
        }
    ),
}

export const storage = {
    Announcements: createStorage(
        'Proxy.Announcements',
        {
            v2023: ProxyAnnouncementsStorage,
        }
    ),
    Proxies: createStorage(
        'Proxy.Proxies',
        {
            v2005: ProxyProxiesStorage,
            v2023: ProxyProxiesStorage,
            v9180: ProxyProxiesStorage,
            v9420: ProxyProxiesStorage,
        }
    ),
}

export default {events, calls, constants}
