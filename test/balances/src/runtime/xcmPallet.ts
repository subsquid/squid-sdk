import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'
import * as v9430 from './types/v9430'
import * as v9420 from './types/v9420'
import * as v9381 from './types/v9381'
import * as v9370 from './types/v9370'
import * as v9320 from './types/v9320'
import * as v9291 from './types/v9291'
import * as v9160 from './types/v9160'
import * as v9122 from './types/v9122'
import * as v9111 from './types/v9111'
import * as v9100 from './types/v9100'
import * as v9030 from './types/v9030'
import * as v9010 from './types/v9010'

export const events = {
    AssetsClaimed: createEvent(
        'XcmPallet.AssetsClaimed',
        {
            v9320: v9320.XcmPalletAssetsClaimedEvent,
            v9370: v9370.XcmPalletAssetsClaimedEvent,
            v9381: v9381.XcmPalletAssetsClaimedEvent,
        }
    ),
    AssetsTrapped: createEvent(
        'XcmPallet.AssetsTrapped',
        {
            v9111: v9111.XcmPalletAssetsTrappedEvent,
            v9370: v9370.XcmPalletAssetsTrappedEvent,
            v9381: v9381.XcmPalletAssetsTrappedEvent,
        }
    ),
    Attempted: createEvent(
        'XcmPallet.Attempted',
        {
            v9010: v9010.XcmPalletAttemptedEvent,
            v9100: v9100.XcmPalletAttemptedEvent,
            v9111: v9111.XcmPalletAttemptedEvent,
            v9160: v9160.XcmPalletAttemptedEvent,
            v9381: v9381.XcmPalletAttemptedEvent,
        }
    ),
    FeesPaid: createEvent(
        'XcmPallet.FeesPaid',
        {
            v9381: v9381.XcmPalletFeesPaidEvent,
        }
    ),
    InvalidQuerier: createEvent(
        'XcmPallet.InvalidQuerier',
        {
            v9381: v9381.XcmPalletInvalidQuerierEvent,
        }
    ),
    InvalidQuerierVersion: createEvent(
        'XcmPallet.InvalidQuerierVersion',
        {
            v9381: v9381.XcmPalletInvalidQuerierVersionEvent,
        }
    ),
    InvalidResponder: createEvent(
        'XcmPallet.InvalidResponder',
        {
            v9111: v9111.XcmPalletInvalidResponderEvent,
            v9370: v9370.XcmPalletInvalidResponderEvent,
            v9381: v9381.XcmPalletInvalidResponderEvent,
        }
    ),
    InvalidResponderVersion: createEvent(
        'XcmPallet.InvalidResponderVersion',
        {
            v9111: v9111.XcmPalletInvalidResponderVersionEvent,
            v9370: v9370.XcmPalletInvalidResponderVersionEvent,
            v9381: v9381.XcmPalletInvalidResponderVersionEvent,
        }
    ),
    Notified: createEvent(
        'XcmPallet.Notified',
        {
            v9111: v9111.XcmPalletNotifiedEvent,
        }
    ),
    NotifyDecodeFailed: createEvent(
        'XcmPallet.NotifyDecodeFailed',
        {
            v9111: v9111.XcmPalletNotifyDecodeFailedEvent,
        }
    ),
    NotifyDispatchError: createEvent(
        'XcmPallet.NotifyDispatchError',
        {
            v9111: v9111.XcmPalletNotifyDispatchErrorEvent,
        }
    ),
    NotifyOverweight: createEvent(
        'XcmPallet.NotifyOverweight',
        {
            v9111: v9111.XcmPalletNotifyOverweightEvent,
            v9291: v9291.XcmPalletNotifyOverweightEvent,
            v9320: v9320.XcmPalletNotifyOverweightEvent,
        }
    ),
    NotifyTargetMigrationFail: createEvent(
        'XcmPallet.NotifyTargetMigrationFail',
        {
            v9111: v9111.XcmPalletNotifyTargetMigrationFailEvent,
            v9370: v9370.XcmPalletNotifyTargetMigrationFailEvent,
            v9381: v9381.XcmPalletNotifyTargetMigrationFailEvent,
        }
    ),
    NotifyTargetSendFail: createEvent(
        'XcmPallet.NotifyTargetSendFail',
        {
            v9111: v9111.XcmPalletNotifyTargetSendFailEvent,
            v9160: v9160.XcmPalletNotifyTargetSendFailEvent,
            v9370: v9370.XcmPalletNotifyTargetSendFailEvent,
            v9381: v9381.XcmPalletNotifyTargetSendFailEvent,
        }
    ),
    ResponseReady: createEvent(
        'XcmPallet.ResponseReady',
        {
            v9111: v9111.XcmPalletResponseReadyEvent,
            v9160: v9160.XcmPalletResponseReadyEvent,
            v9370: v9370.XcmPalletResponseReadyEvent,
            v9381: v9381.XcmPalletResponseReadyEvent,
        }
    ),
    ResponseTaken: createEvent(
        'XcmPallet.ResponseTaken',
        {
            v9111: v9111.XcmPalletResponseTakenEvent,
        }
    ),
    Sent: createEvent(
        'XcmPallet.Sent',
        {
            v9010: v9010.XcmPalletSentEvent,
            v9100: v9100.XcmPalletSentEvent,
            v9111: v9111.XcmPalletSentEvent,
            v9160: v9160.XcmPalletSentEvent,
            v9370: v9370.XcmPalletSentEvent,
            v9381: v9381.XcmPalletSentEvent,
        }
    ),
    SupportedVersionChanged: createEvent(
        'XcmPallet.SupportedVersionChanged',
        {
            v9111: v9111.XcmPalletSupportedVersionChangedEvent,
            v9370: v9370.XcmPalletSupportedVersionChangedEvent,
            v9381: v9381.XcmPalletSupportedVersionChangedEvent,
        }
    ),
    UnexpectedResponse: createEvent(
        'XcmPallet.UnexpectedResponse',
        {
            v9111: v9111.XcmPalletUnexpectedResponseEvent,
            v9370: v9370.XcmPalletUnexpectedResponseEvent,
            v9381: v9381.XcmPalletUnexpectedResponseEvent,
        }
    ),
    VersionChangeNotified: createEvent(
        'XcmPallet.VersionChangeNotified',
        {
            v9111: v9111.XcmPalletVersionChangeNotifiedEvent,
            v9370: v9370.XcmPalletVersionChangeNotifiedEvent,
            v9381: v9381.XcmPalletVersionChangeNotifiedEvent,
        }
    ),
    VersionNotifyRequested: createEvent(
        'XcmPallet.VersionNotifyRequested',
        {
            v9381: v9381.XcmPalletVersionNotifyRequestedEvent,
        }
    ),
    VersionNotifyStarted: createEvent(
        'XcmPallet.VersionNotifyStarted',
        {
            v9381: v9381.XcmPalletVersionNotifyStartedEvent,
        }
    ),
    VersionNotifyUnrequested: createEvent(
        'XcmPallet.VersionNotifyUnrequested',
        {
            v9381: v9381.XcmPalletVersionNotifyUnrequestedEvent,
        }
    ),
}

export const calls = {
    execute: createCall(
        'XcmPallet.execute',
        {
            v9010: v9010.XcmPalletExecuteCall,
            v9100: v9100.XcmPalletExecuteCall,
            v9111: v9111.XcmPalletExecuteCall,
            v9160: v9160.XcmPalletExecuteCall,
            v9291: v9291.XcmPalletExecuteCall,
            v9320: v9320.XcmPalletExecuteCall,
            v9370: v9370.XcmPalletExecuteCall,
            v9381: v9381.XcmPalletExecuteCall,
        }
    ),
    force_default_xcm_version: createCall(
        'XcmPallet.force_default_xcm_version',
        {
            v9111: v9111.XcmPalletForceDefaultXcmVersionCall,
        }
    ),
    force_subscribe_version_notify: createCall(
        'XcmPallet.force_subscribe_version_notify',
        {
            v9111: v9111.XcmPalletForceSubscribeVersionNotifyCall,
            v9370: v9370.XcmPalletForceSubscribeVersionNotifyCall,
            v9381: v9381.XcmPalletForceSubscribeVersionNotifyCall,
        }
    ),
    force_suspension: createCall(
        'XcmPallet.force_suspension',
        {
            v9420: v9420.XcmPalletForceSuspensionCall,
        }
    ),
    force_unsubscribe_version_notify: createCall(
        'XcmPallet.force_unsubscribe_version_notify',
        {
            v9111: v9111.XcmPalletForceUnsubscribeVersionNotifyCall,
            v9370: v9370.XcmPalletForceUnsubscribeVersionNotifyCall,
            v9381: v9381.XcmPalletForceUnsubscribeVersionNotifyCall,
        }
    ),
    force_xcm_version: createCall(
        'XcmPallet.force_xcm_version',
        {
            v9111: v9111.XcmPalletForceXcmVersionCall,
            v9370: v9370.XcmPalletForceXcmVersionCall,
            v9381: v9381.XcmPalletForceXcmVersionCall,
        }
    ),
    limited_reserve_transfer_assets: createCall(
        'XcmPallet.limited_reserve_transfer_assets',
        {
            v9122: v9122.XcmPalletLimitedReserveTransferAssetsCall,
            v9370: v9370.XcmPalletLimitedReserveTransferAssetsCall,
            v9381: v9381.XcmPalletLimitedReserveTransferAssetsCall,
        }
    ),
    limited_teleport_assets: createCall(
        'XcmPallet.limited_teleport_assets',
        {
            v9122: v9122.XcmPalletLimitedTeleportAssetsCall,
            v9370: v9370.XcmPalletLimitedTeleportAssetsCall,
            v9381: v9381.XcmPalletLimitedTeleportAssetsCall,
        }
    ),
    reserve_transfer_assets: createCall(
        'XcmPallet.reserve_transfer_assets',
        {
            v9030: v9030.XcmPalletReserveTransferAssetsCall,
            v9100: v9100.XcmPalletReserveTransferAssetsCall,
            v9111: v9111.XcmPalletReserveTransferAssetsCall,
            v9370: v9370.XcmPalletReserveTransferAssetsCall,
            v9381: v9381.XcmPalletReserveTransferAssetsCall,
        }
    ),
    send: createCall(
        'XcmPallet.send',
        {
            v9010: v9010.XcmPalletSendCall,
            v9100: v9100.XcmPalletSendCall,
            v9111: v9111.XcmPalletSendCall,
            v9160: v9160.XcmPalletSendCall,
            v9370: v9370.XcmPalletSendCall,
            v9381: v9381.XcmPalletSendCall,
        }
    ),
    teleport_assets: createCall(
        'XcmPallet.teleport_assets',
        {
            v9010: v9010.XcmPalletTeleportAssetsCall,
            v9100: v9100.XcmPalletTeleportAssetsCall,
            v9111: v9111.XcmPalletTeleportAssetsCall,
            v9370: v9370.XcmPalletTeleportAssetsCall,
            v9381: v9381.XcmPalletTeleportAssetsCall,
        }
    ),
}

export const storage = {
    AssetTraps: createStorage(
        'XcmPallet.AssetTraps',
        {
            v9111: v9111.XcmPalletAssetTrapsStorage,
        }
    ),
    CurrentMigration: createStorage(
        'XcmPallet.CurrentMigration',
        {
            v9111: v9111.XcmPalletCurrentMigrationStorage,
        }
    ),
    LockedFungibles: createStorage(
        'XcmPallet.LockedFungibles',
        {
            v9381: v9381.XcmPalletLockedFungiblesStorage,
        }
    ),
    Queries: createStorage(
        'XcmPallet.Queries',
        {
            v9111: v9111.XcmPalletQueriesStorage,
            v9160: v9160.XcmPalletQueriesStorage,
            v9370: v9370.XcmPalletQueriesStorage,
            v9381: v9381.XcmPalletQueriesStorage,
        }
    ),
    QueryCounter: createStorage(
        'XcmPallet.QueryCounter',
        {
            v9111: v9111.XcmPalletQueryCounterStorage,
        }
    ),
    RemoteLockedFungibles: createStorage(
        'XcmPallet.RemoteLockedFungibles',
        {
            v9381: v9381.XcmPalletRemoteLockedFungiblesStorage,
            v9430: v9430.XcmPalletRemoteLockedFungiblesStorage,
        }
    ),
    SafeXcmVersion: createStorage(
        'XcmPallet.SafeXcmVersion',
        {
            v9111: v9111.XcmPalletSafeXcmVersionStorage,
        }
    ),
    SupportedVersion: createStorage(
        'XcmPallet.SupportedVersion',
        {
            v9111: v9111.XcmPalletSupportedVersionStorage,
            v9370: v9370.XcmPalletSupportedVersionStorage,
            v9381: v9381.XcmPalletSupportedVersionStorage,
        }
    ),
    VersionDiscoveryQueue: createStorage(
        'XcmPallet.VersionDiscoveryQueue',
        {
            v9111: v9111.XcmPalletVersionDiscoveryQueueStorage,
            v9370: v9370.XcmPalletVersionDiscoveryQueueStorage,
            v9381: v9381.XcmPalletVersionDiscoveryQueueStorage,
        }
    ),
    VersionNotifiers: createStorage(
        'XcmPallet.VersionNotifiers',
        {
            v9111: v9111.XcmPalletVersionNotifiersStorage,
            v9370: v9370.XcmPalletVersionNotifiersStorage,
            v9381: v9381.XcmPalletVersionNotifiersStorage,
        }
    ),
    VersionNotifyTargets: createStorage(
        'XcmPallet.VersionNotifyTargets',
        {
            v9100: v9100.XcmPalletVersionNotifyTargetsStorage,
            v9111: v9111.XcmPalletVersionNotifyTargetsStorage,
            v9370: v9370.XcmPalletVersionNotifyTargetsStorage,
            v9381: v9381.XcmPalletVersionNotifyTargetsStorage,
        }
    ),
    XcmExecutionSuspended: createStorage(
        'XcmPallet.XcmExecutionSuspended',
        {
            v9420: v9420.XcmPalletXcmExecutionSuspendedStorage,
        }
    ),
}

export default {events, calls}
