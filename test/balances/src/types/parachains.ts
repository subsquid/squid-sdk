import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'

export const calls = {
    report_double_vote: createCall(
        'Parachains.report_double_vote',
        {
            v1058: ParachainsReportDoubleVoteCall,
        }
    ),
    send_xcmp_message: createCall(
        'Parachains.send_xcmp_message',
        {
            v2013: ParachainsSendXcmpMessageCall,
        }
    ),
    set_heads: createCall(
        'Parachains.set_heads',
        {
            v1020: ParachainsSetHeadsCall,
        }
    ),
    transfer_to_parachain: createCall(
        'Parachains.transfer_to_parachain',
        {
            v2013: ParachainsTransferToParachainCall,
        }
    ),
}

export const storage = {
    Authorities: createStorage(
        'Parachains.Authorities',
        {
            v1020: ParachainsAuthoritiesStorage,
        }
    ),
    Code: createStorage(
        'Parachains.Code',
        {
            v1020: ParachainsCodeStorage,
        }
    ),
    DidUpdate: createStorage(
        'Parachains.DidUpdate',
        {
            v1020: ParachainsDidUpdateStorage,
        }
    ),
    DownwardMessageQueue: createStorage(
        'Parachains.DownwardMessageQueue',
        {
            v2013: ParachainsDownwardMessageQueueStorage,
        }
    ),
    FutureCode: createStorage(
        'Parachains.FutureCode',
        {
            v1058: ParachainsFutureCodeStorage,
        }
    ),
    FutureCodeUpgrades: createStorage(
        'Parachains.FutureCodeUpgrades',
        {
            v1058: ParachainsFutureCodeUpgradesStorage,
        }
    ),
    Heads: createStorage(
        'Parachains.Heads',
        {
            v1020: ParachainsHeadsStorage,
        }
    ),
    NeedsDispatch: createStorage(
        'Parachains.NeedsDispatch',
        {
            v1020: ParachainsNeedsDispatchStorage,
        }
    ),
    PastCode: createStorage(
        'Parachains.PastCode',
        {
            v1058: ParachainsPastCodeStorage,
        }
    ),
    PastCodeMeta: createStorage(
        'Parachains.PastCodeMeta',
        {
            v1058: ParachainsPastCodeMetaStorage,
        }
    ),
    PastCodePruning: createStorage(
        'Parachains.PastCodePruning',
        {
            v1058: ParachainsPastCodePruningStorage,
        }
    ),
    RelayDispatchQueue: createStorage(
        'Parachains.RelayDispatchQueue',
        {
            v1020: ParachainsRelayDispatchQueueStorage,
        }
    ),
    RelayDispatchQueueSize: createStorage(
        'Parachains.RelayDispatchQueueSize',
        {
            v1020: ParachainsRelayDispatchQueueSizeStorage,
        }
    ),
    UnroutedIngress: createStorage(
        'Parachains.UnroutedIngress',
        {
            v1020: ParachainsUnroutedIngressStorage,
        }
    ),
    Watermarks: createStorage(
        'Parachains.Watermarks',
        {
            v1020: ParachainsWatermarksStorage,
        }
    ),
}

export default {calls}
