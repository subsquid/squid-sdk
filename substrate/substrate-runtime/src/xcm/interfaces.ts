import {Bytes} from '../metadata'
import * as sts from '../sts'

export type VersionedMultiAssets = VersionedMultiAssets_V0 | VersionedMultiAssets_V1

export type VersionedMultiAssets_V0 = {
    __kind: 'V0'
    value: MultiAssetV0[]
}

export type VersionedMultiAssets_V1 = {
    __kind: 'V1'
    value: MultiAssetsV1
}

export const VersionedMultiAssets: sts.Type<VersionedMultiAssets> = sts.closedEnum(() => {
    return {
        V0: sts.array(() => MultiAssetV0),
        V1: MultiAssetsV1,
    }
})

export type VersionedMultiAsset = VersionedMultiAsset_V0 | VersionedMultiAsset_V1

export type VersionedMultiAsset_V0 = {
    __kind: 'V0'
    value: MultiAssetV0
}

export type VersionedMultiAsset_V1 = {
    __kind: 'V1'
    value: MultiAssetV1
}

export const VersionedMultiAsset: sts.Type<VersionedMultiAsset> = sts.closedEnum(() => {
    return {
        V0: MultiAssetV0,
        V1: MultiAssetV1,
    }
})

export type VersionedResponse = VersionedResponse_V0 | VersionedResponse_V1 | VersionedResponse_V2

export type VersionedResponse_V0 = {
    __kind: 'V0'
    value: XcmResponseV0
}

export type VersionedResponse_V1 = {
    __kind: 'V1'
    value: XcmResponseV1
}

export type VersionedResponse_V2 = {
    __kind: 'V2'
    value: XcmResponseV2
}

export const VersionedResponse: sts.Type<VersionedResponse> = sts.closedEnum(() => {
    return {
        V0: XcmResponseV0,
        V1: XcmResponseV1,
        V2: XcmResponseV2,
    }
})

export type VersionedMultiLocation = VersionedMultiLocation_V0 | VersionedMultiLocation_V1

export type VersionedMultiLocation_V0 = {
    __kind: 'V0'
    value: MultiLocationV0
}

export type VersionedMultiLocation_V1 = {
    __kind: 'V1'
    value: MultiLocationV1
}

export const VersionedMultiLocation: sts.Type<VersionedMultiLocation> = sts.closedEnum(() => {
    return {
        V0: MultiLocationV0,
        V1: MultiLocationV1,
    }
})

export type XcmVersion = number

export const XcmVersion: sts.Type<XcmVersion> = sts.number()

export type VersionedXcm = VersionedXcm_V0 | VersionedXcm_V1 | VersionedXcm_V2

export type VersionedXcm_V0 = {
    __kind: 'V0'
    value: XcmV0
}

export type VersionedXcm_V1 = {
    __kind: 'V1'
    value: XcmV1
}

export type VersionedXcm_V2 = {
    __kind: 'V2'
    value: XcmV2
}

export const VersionedXcm: sts.Type<VersionedXcm> = sts.closedEnum(() => {
    return {
        V0: XcmV0,
        V1: XcmV1,
        V2: XcmV2,
    }
})

export type XcmErrorV2 = XcmErrorV2_Undefined | XcmErrorV2_Overflow | XcmErrorV2_Unimplemented | XcmErrorV2_UnhandledXcmVersion | XcmErrorV2_UnhandledXcmMessage | XcmErrorV2_UnhandledEffect | XcmErrorV2_EscalationOfPrivilege | XcmErrorV2_UntrustedReserveLocation | XcmErrorV2_UntrustedTeleportLocation | XcmErrorV2_DestinationBufferOverflow | XcmErrorV2_MultiLocationFull | XcmErrorV2_MultiLocationNotInvertible | XcmErrorV2_FailedToDecode | XcmErrorV2_BadOrigin | XcmErrorV2_ExceedsMaxMessageSize | XcmErrorV2_FailedToTransactAsset | XcmErrorV2_WeightLimitReached | XcmErrorV2_Wildcard | XcmErrorV2_TooMuchWeightRequired | XcmErrorV2_NotHoldingFees | XcmErrorV2_WeightNotComputable | XcmErrorV2_Barrier | XcmErrorV2_NotWithdrawable | XcmErrorV2_LocationCannotHold | XcmErrorV2_TooExpensive | XcmErrorV2_AssetNotFound | XcmErrorV2_DestinationUnsupported | XcmErrorV2_RecursionLimitReached | XcmErrorV2_Transport | XcmErrorV2_Unroutable | XcmErrorV2_UnknownWeightRequired | XcmErrorV2_Trap | XcmErrorV2_UnknownClaim | XcmErrorV2_InvalidLocation

export type XcmErrorV2_Undefined = {
    __kind: 'Undefined'
}

export type XcmErrorV2_Overflow = {
    __kind: 'Overflow'
}

export type XcmErrorV2_Unimplemented = {
    __kind: 'Unimplemented'
}

export type XcmErrorV2_UnhandledXcmVersion = {
    __kind: 'UnhandledXcmVersion'
}

export type XcmErrorV2_UnhandledXcmMessage = {
    __kind: 'UnhandledXcmMessage'
}

export type XcmErrorV2_UnhandledEffect = {
    __kind: 'UnhandledEffect'
}

export type XcmErrorV2_EscalationOfPrivilege = {
    __kind: 'EscalationOfPrivilege'
}

export type XcmErrorV2_UntrustedReserveLocation = {
    __kind: 'UntrustedReserveLocation'
}

export type XcmErrorV2_UntrustedTeleportLocation = {
    __kind: 'UntrustedTeleportLocation'
}

export type XcmErrorV2_DestinationBufferOverflow = {
    __kind: 'DestinationBufferOverflow'
}

export type XcmErrorV2_MultiLocationFull = {
    __kind: 'MultiLocationFull'
}

export type XcmErrorV2_MultiLocationNotInvertible = {
    __kind: 'MultiLocationNotInvertible'
}

export type XcmErrorV2_FailedToDecode = {
    __kind: 'FailedToDecode'
}

export type XcmErrorV2_BadOrigin = {
    __kind: 'BadOrigin'
}

export type XcmErrorV2_ExceedsMaxMessageSize = {
    __kind: 'ExceedsMaxMessageSize'
}

export type XcmErrorV2_FailedToTransactAsset = {
    __kind: 'FailedToTransactAsset'
}

export type XcmErrorV2_WeightLimitReached = {
    __kind: 'WeightLimitReached'
    value: bigint
}

export type XcmErrorV2_Wildcard = {
    __kind: 'Wildcard'
}

export type XcmErrorV2_TooMuchWeightRequired = {
    __kind: 'TooMuchWeightRequired'
}

export type XcmErrorV2_NotHoldingFees = {
    __kind: 'NotHoldingFees'
}

export type XcmErrorV2_WeightNotComputable = {
    __kind: 'WeightNotComputable'
}

export type XcmErrorV2_Barrier = {
    __kind: 'Barrier'
}

export type XcmErrorV2_NotWithdrawable = {
    __kind: 'NotWithdrawable'
}

export type XcmErrorV2_LocationCannotHold = {
    __kind: 'LocationCannotHold'
}

export type XcmErrorV2_TooExpensive = {
    __kind: 'TooExpensive'
}

export type XcmErrorV2_AssetNotFound = {
    __kind: 'AssetNotFound'
}

export type XcmErrorV2_DestinationUnsupported = {
    __kind: 'DestinationUnsupported'
}

export type XcmErrorV2_RecursionLimitReached = {
    __kind: 'RecursionLimitReached'
}

export type XcmErrorV2_Transport = {
    __kind: 'Transport'
}

export type XcmErrorV2_Unroutable = {
    __kind: 'Unroutable'
}

export type XcmErrorV2_UnknownWeightRequired = {
    __kind: 'UnknownWeightRequired'
}

export type XcmErrorV2_Trap = {
    __kind: 'Trap'
    value: bigint
}

export type XcmErrorV2_UnknownClaim = {
    __kind: 'UnknownClaim'
}

export type XcmErrorV2_InvalidLocation = {
    __kind: 'InvalidLocation'
}

export const XcmErrorV2: sts.Type<XcmErrorV2> = sts.closedEnum(() => {
    return {
        Undefined: sts.unit(),
        Overflow: sts.unit(),
        Unimplemented: sts.unit(),
        UnhandledXcmVersion: sts.unit(),
        UnhandledXcmMessage: sts.unit(),
        UnhandledEffect: sts.unit(),
        EscalationOfPrivilege: sts.unit(),
        UntrustedReserveLocation: sts.unit(),
        UntrustedTeleportLocation: sts.unit(),
        DestinationBufferOverflow: sts.unit(),
        MultiLocationFull: sts.unit(),
        MultiLocationNotInvertible: sts.unit(),
        FailedToDecode: sts.unit(),
        BadOrigin: sts.unit(),
        ExceedsMaxMessageSize: sts.unit(),
        FailedToTransactAsset: sts.unit(),
        WeightLimitReached: sts.bigint(),
        Wildcard: sts.unit(),
        TooMuchWeightRequired: sts.unit(),
        NotHoldingFees: sts.unit(),
        WeightNotComputable: sts.unit(),
        Barrier: sts.unit(),
        NotWithdrawable: sts.unit(),
        LocationCannotHold: sts.unit(),
        TooExpensive: sts.unit(),
        AssetNotFound: sts.unit(),
        DestinationUnsupported: sts.unit(),
        RecursionLimitReached: sts.unit(),
        Transport: sts.unit(),
        Unroutable: sts.unit(),
        UnknownWeightRequired: sts.unit(),
        Trap: sts.bigint(),
        UnknownClaim: sts.unit(),
        InvalidLocation: sts.unit(),
    }
})

export type XcmV2 = XcmInstructionV2[]

export const XcmV2: sts.Type<XcmV2> = sts.array(() => XcmInstructionV2)

export type XcmInstructionV2 = XcmInstructionV2_WithdrawAsset | XcmInstructionV2_ReserveAssetDeposited | XcmInstructionV2_ReceiveTeleportedAsset | XcmInstructionV2_QueryResponse | XcmInstructionV2_TransferAsset | XcmInstructionV2_TransferReserveAsset | XcmInstructionV2_Transact | XcmInstructionV2_HrmpNewChannelOpenRequest | XcmInstructionV2_HrmpChannelAccepted | XcmInstructionV2_HrmpChannelClosing | XcmInstructionV2_ClearOrigin | XcmInstructionV2_DescendOrigin | XcmInstructionV2_ReportError | XcmInstructionV2_DepositAsset | XcmInstructionV2_DepositReserveAsset | XcmInstructionV2_ExchangeAsset | XcmInstructionV2_InitiateReserveWithdraw | XcmInstructionV2_InitiateTeleport | XcmInstructionV2_QueryHolding | XcmInstructionV2_BuyExecution | XcmInstructionV2_RefundSurplus | XcmInstructionV2_SetErrorHandler | XcmInstructionV2_SetAppendix | XcmInstructionV2_ClearError | XcmInstructionV2_ClaimAsset | XcmInstructionV2_Trap | XcmInstructionV2_SubscribeVersion | XcmInstructionV2_UnsubscribeVersion

export type XcmInstructionV2_WithdrawAsset = {
    __kind: 'WithdrawAsset'
    value: MultiAssetsV1
}

export type XcmInstructionV2_ReserveAssetDeposited = {
    __kind: 'ReserveAssetDeposited'
    value: MultiAssetsV1
}

export type XcmInstructionV2_ReceiveTeleportedAsset = {
    __kind: 'ReceiveTeleportedAsset'
    value: MultiAssetsV1
}

export type XcmInstructionV2_QueryResponse = {
    __kind: 'QueryResponse'
    queryId: bigint,
    response: XcmResponseV2,
    maxWeight: bigint,
}

export type XcmInstructionV2_TransferAsset = {
    __kind: 'TransferAsset'
    assets: MultiAssetsV1,
    beneficiary: MultiLocationV1,
}

export type XcmInstructionV2_TransferReserveAsset = {
    __kind: 'TransferReserveAsset'
    assets: MultiAssetsV1,
    dest: MultiLocationV1,
    xcm: XcmV2,
}

export type XcmInstructionV2_Transact = {
    __kind: 'Transact'
    originType: XcmOriginKindV0,
    requireWeightAtMost: bigint,
    call: Bytes,
}

export type XcmInstructionV2_HrmpNewChannelOpenRequest = {
    __kind: 'HrmpNewChannelOpenRequest'
    sender: number,
    maxMessageSize: number,
    maxCapacity: number,
}

export type XcmInstructionV2_HrmpChannelAccepted = {
    __kind: 'HrmpChannelAccepted'
    recipient: number,
}

export type XcmInstructionV2_HrmpChannelClosing = {
    __kind: 'HrmpChannelClosing'
    initiator: number,
    sender: number,
    recipient: number,
}

export type XcmInstructionV2_ClearOrigin = {
    __kind: 'ClearOrigin'
}

export type XcmInstructionV2_DescendOrigin = {
    __kind: 'DescendOrigin'
    value: XcmJunctionsV1
}

export type XcmInstructionV2_ReportError = {
    __kind: 'ReportError'
    queryId: bigint,
    dest: MultiLocationV1,
    maxResponseWeight: bigint,
}

export type XcmInstructionV2_DepositAsset = {
    __kind: 'DepositAsset'
    assets: MultiAssetFilterV1,
    maxAssets: number,
    beneficiary: MultiLocationV1,
}

export type XcmInstructionV2_DepositReserveAsset = {
    __kind: 'DepositReserveAsset'
    assets: MultiAssetFilterV1,
    maxAssets: number,
    dest: MultiLocationV1,
    xcm: XcmV2,
}

export type XcmInstructionV2_ExchangeAsset = {
    __kind: 'ExchangeAsset'
    give: MultiAssetFilterV1,
    receive: MultiAssetsV1,
}

export type XcmInstructionV2_InitiateReserveWithdraw = {
    __kind: 'InitiateReserveWithdraw'
    assets: MultiAssetFilterV1,
    reserve: MultiLocationV1,
    xcm: XcmV2,
}

export type XcmInstructionV2_InitiateTeleport = {
    __kind: 'InitiateTeleport'
    assets: MultiAssetFilterV1,
    dest: MultiLocationV1,
    xcm: XcmV2,
}

export type XcmInstructionV2_QueryHolding = {
    __kind: 'QueryHolding'
    queryId: bigint,
    dest: MultiLocationV1,
    assets: MultiAssetFilterV1,
    maxResponseWeight: bigint,
}

export type XcmInstructionV2_BuyExecution = {
    __kind: 'BuyExecution'
    fees: MultiAssetV1,
    weightLimit: XcmWeightLimitV2,
}

export type XcmInstructionV2_RefundSurplus = {
    __kind: 'RefundSurplus'
}

export type XcmInstructionV2_SetErrorHandler = {
    __kind: 'SetErrorHandler'
    value: XcmV2
}

export type XcmInstructionV2_SetAppendix = {
    __kind: 'SetAppendix'
    value: XcmV2
}

export type XcmInstructionV2_ClearError = {
    __kind: 'ClearError'
}

export type XcmInstructionV2_ClaimAsset = {
    __kind: 'ClaimAsset'
    assets: MultiAssetsV1,
    ticket: MultiLocationV1,
}

export type XcmInstructionV2_Trap = {
    __kind: 'Trap'
    value: bigint
}

export type XcmInstructionV2_SubscribeVersion = {
    __kind: 'SubscribeVersion'
    queryId: bigint,
    maxResponseWeight: bigint,
}

export type XcmInstructionV2_UnsubscribeVersion = {
    __kind: 'UnsubscribeVersion'
}

export const XcmInstructionV2: sts.Type<XcmInstructionV2> = sts.closedEnum(() => {
    return {
        WithdrawAsset: MultiAssetsV1,
        ReserveAssetDeposited: MultiAssetsV1,
        ReceiveTeleportedAsset: MultiAssetsV1,
        QueryResponse: sts.enumStruct({
            queryId: sts.bigint(),
            response: XcmResponseV2,
            maxWeight: sts.bigint(),
        }),
        TransferAsset: sts.enumStruct({
            assets: MultiAssetsV1,
            beneficiary: MultiLocationV1,
        }),
        TransferReserveAsset: sts.enumStruct({
            assets: MultiAssetsV1,
            dest: MultiLocationV1,
            xcm: XcmV2,
        }),
        Transact: sts.enumStruct({
            originType: XcmOriginKindV0,
            requireWeightAtMost: sts.bigint(),
            call: sts.bytes(),
        }),
        HrmpNewChannelOpenRequest: sts.enumStruct({
            sender: sts.number(),
            maxMessageSize: sts.number(),
            maxCapacity: sts.number(),
        }),
        HrmpChannelAccepted: sts.enumStruct({
            recipient: sts.number(),
        }),
        HrmpChannelClosing: sts.enumStruct({
            initiator: sts.number(),
            sender: sts.number(),
            recipient: sts.number(),
        }),
        ClearOrigin: sts.unit(),
        DescendOrigin: XcmJunctionsV1,
        ReportError: sts.enumStruct({
            queryId: sts.bigint(),
            dest: MultiLocationV1,
            maxResponseWeight: sts.bigint(),
        }),
        DepositAsset: sts.enumStruct({
            assets: MultiAssetFilterV1,
            maxAssets: sts.number(),
            beneficiary: MultiLocationV1,
        }),
        DepositReserveAsset: sts.enumStruct({
            assets: MultiAssetFilterV1,
            maxAssets: sts.number(),
            dest: MultiLocationV1,
            xcm: XcmV2,
        }),
        ExchangeAsset: sts.enumStruct({
            give: MultiAssetFilterV1,
            receive: MultiAssetsV1,
        }),
        InitiateReserveWithdraw: sts.enumStruct({
            assets: MultiAssetFilterV1,
            reserve: MultiLocationV1,
            xcm: XcmV2,
        }),
        InitiateTeleport: sts.enumStruct({
            assets: MultiAssetFilterV1,
            dest: MultiLocationV1,
            xcm: XcmV2,
        }),
        QueryHolding: sts.enumStruct({
            queryId: sts.bigint(),
            dest: MultiLocationV1,
            assets: MultiAssetFilterV1,
            maxResponseWeight: sts.bigint(),
        }),
        BuyExecution: sts.enumStruct({
            fees: MultiAssetV1,
            weightLimit: XcmWeightLimitV2,
        }),
        RefundSurplus: sts.unit(),
        SetErrorHandler: XcmV2,
        SetAppendix: XcmV2,
        ClearError: sts.unit(),
        ClaimAsset: sts.enumStruct({
            assets: MultiAssetsV1,
            ticket: MultiLocationV1,
        }),
        Trap: sts.bigint(),
        SubscribeVersion: sts.enumStruct({
            queryId: sts.bigint(),
            maxResponseWeight: sts.bigint(),
        }),
        UnsubscribeVersion: sts.unit(),
    }
})

export type XcmWeightLimitV2 = XcmWeightLimitV2_Unlimited | XcmWeightLimitV2_Limited

export type XcmWeightLimitV2_Unlimited = {
    __kind: 'Unlimited'
}

export type XcmWeightLimitV2_Limited = {
    __kind: 'Limited'
    value: bigint
}

export const XcmWeightLimitV2: sts.Type<XcmWeightLimitV2> = sts.closedEnum(() => {
    return {
        Unlimited: sts.unit(),
        Limited: sts.bigint(),
    }
})

export type XcmResponseV2 = XcmResponseV2_Null | XcmResponseV2_Assets | XcmResponseV2_ExecutionResult | XcmResponseV2_Version

export type XcmResponseV2_Null = {
    __kind: 'Null'
}

export type XcmResponseV2_Assets = {
    __kind: 'Assets'
    value: MultiAssetsV1
}

export type XcmResponseV2_ExecutionResult = {
    __kind: 'ExecutionResult'
    value?: ([number, XcmErrorV2] | undefined)
}

export type XcmResponseV2_Version = {
    __kind: 'Version'
    value: XcmVersion
}

export const XcmResponseV2: sts.Type<XcmResponseV2> = sts.closedEnum(() => {
    return {
        Null: sts.unit(),
        Assets: MultiAssetsV1,
        ExecutionResult: sts.option(() => sts.tuple(() => [sts.number(), XcmErrorV2])),
        Version: XcmVersion,
    }
})

export type XcmOutcomeV1 = XcmOutcomeV1_Complete | XcmOutcomeV1_Incomplete | XcmOutcomeV1_Error

export type XcmOutcomeV1_Complete = {
    __kind: 'Complete'
    value: bigint
}

export type XcmOutcomeV1_Incomplete = {
    __kind: 'Incomplete'
    value: [bigint, XcmErrorV2]
}

export type XcmOutcomeV1_Error = {
    __kind: 'Error'
    value: XcmErrorV2
}

export const XcmOutcomeV1: sts.Type<XcmOutcomeV1> = sts.closedEnum(() => {
    return {
        Complete: sts.bigint(),
        Incomplete: sts.tuple(() => [sts.bigint(), XcmErrorV2]),
        Error: XcmErrorV2,
    }
})

export type XcmOrderV1 = XcmOrderV1_Noop | XcmOrderV1_DepositAsset | XcmOrderV1_DepositReserveAsset | XcmOrderV1_ExchangeAsset | XcmOrderV1_InitiateReserveWithdraw | XcmOrderV1_InitiateTeleport | XcmOrderV1_QueryHolding | XcmOrderV1_BuyExecution

export type XcmOrderV1_Noop = {
    __kind: 'Noop'
}

export type XcmOrderV1_DepositAsset = {
    __kind: 'DepositAsset'
    assets: MultiAssetFilterV1,
    maxAssets: number,
    beneficiary: MultiLocationV1,
}

export type XcmOrderV1_DepositReserveAsset = {
    __kind: 'DepositReserveAsset'
    assets: MultiAssetFilterV1,
    maxAssets: number,
    dest: MultiLocationV1,
    effects: XcmOrderV1[],
}

export type XcmOrderV1_ExchangeAsset = {
    __kind: 'ExchangeAsset'
    give: MultiAssetFilterV1,
    receive: MultiAssetsV1,
}

export type XcmOrderV1_InitiateReserveWithdraw = {
    __kind: 'InitiateReserveWithdraw'
    assets: MultiAssetFilterV1,
    reserve: MultiLocationV1,
    effects: XcmOrderV1[],
}

export type XcmOrderV1_InitiateTeleport = {
    __kind: 'InitiateTeleport'
    assets: MultiAssetFilterV1,
    dest: MultiLocationV1,
    effects: XcmOrderV1[],
}

export type XcmOrderV1_QueryHolding = {
    __kind: 'QueryHolding'
    queryId: bigint,
    dest: MultiLocationV1,
    assets: MultiAssetFilterV1,
}

export type XcmOrderV1_BuyExecution = {
    __kind: 'BuyExecution'
    fees: MultiAssetV1,
    weight: bigint,
    debt: bigint,
    haltOnError: boolean,
    instructions: XcmV1[],
}

export const XcmOrderV1: sts.Type<XcmOrderV1> = sts.closedEnum(() => {
    return {
        Noop: sts.unit(),
        DepositAsset: sts.enumStruct({
            assets: MultiAssetFilterV1,
            maxAssets: sts.number(),
            beneficiary: MultiLocationV1,
        }),
        DepositReserveAsset: sts.enumStruct({
            assets: MultiAssetFilterV1,
            maxAssets: sts.number(),
            dest: MultiLocationV1,
            effects: sts.array(() => XcmOrderV1),
        }),
        ExchangeAsset: sts.enumStruct({
            give: MultiAssetFilterV1,
            receive: MultiAssetsV1,
        }),
        InitiateReserveWithdraw: sts.enumStruct({
            assets: MultiAssetFilterV1,
            reserve: MultiLocationV1,
            effects: sts.array(() => XcmOrderV1),
        }),
        InitiateTeleport: sts.enumStruct({
            assets: MultiAssetFilterV1,
            dest: MultiLocationV1,
            effects: sts.array(() => XcmOrderV1),
        }),
        QueryHolding: sts.enumStruct({
            queryId: sts.bigint(),
            dest: MultiLocationV1,
            assets: MultiAssetFilterV1,
        }),
        BuyExecution: sts.enumStruct({
            fees: MultiAssetV1,
            weight: sts.bigint(),
            debt: sts.bigint(),
            haltOnError: sts.boolean(),
            instructions: sts.array(() => XcmV1),
        }),
    }
})

export type XcmErrorV1 = XcmErrorV1_Undefined | XcmErrorV1_Overflow | XcmErrorV1_Unimplemented | XcmErrorV1_UnhandledXcmVersion | XcmErrorV1_UnhandledXcmMessage | XcmErrorV1_UnhandledEffect | XcmErrorV1_EscalationOfPrivilege | XcmErrorV1_UntrustedReserveLocation | XcmErrorV1_UntrustedTeleportLocation | XcmErrorV1_DestinationBufferOverflow | XcmErrorV1_SendFailed | XcmErrorV1_CannotReachDestination | XcmErrorV1_MultiLocationFull | XcmErrorV1_FailedToDecode | XcmErrorV1_BadOrigin | XcmErrorV1_ExceedsMaxMessageSize | XcmErrorV1_FailedToTransactAsset | XcmErrorV1_WeightLimitReached | XcmErrorV1_Wildcard | XcmErrorV1_TooMuchWeightRequired | XcmErrorV1_NotHoldingFees | XcmErrorV1_WeightNotComputable | XcmErrorV1_Barrier | XcmErrorV1_NotWithdrawable | XcmErrorV1_LocationCannotHold | XcmErrorV1_TooExpensive | XcmErrorV1_AssetNotFound | XcmErrorV1_DestinationUnsupported | XcmErrorV1_RecursionLimitReached

export type XcmErrorV1_Undefined = {
    __kind: 'Undefined'
}

export type XcmErrorV1_Overflow = {
    __kind: 'Overflow'
}

export type XcmErrorV1_Unimplemented = {
    __kind: 'Unimplemented'
}

export type XcmErrorV1_UnhandledXcmVersion = {
    __kind: 'UnhandledXcmVersion'
}

export type XcmErrorV1_UnhandledXcmMessage = {
    __kind: 'UnhandledXcmMessage'
}

export type XcmErrorV1_UnhandledEffect = {
    __kind: 'UnhandledEffect'
}

export type XcmErrorV1_EscalationOfPrivilege = {
    __kind: 'EscalationOfPrivilege'
}

export type XcmErrorV1_UntrustedReserveLocation = {
    __kind: 'UntrustedReserveLocation'
}

export type XcmErrorV1_UntrustedTeleportLocation = {
    __kind: 'UntrustedTeleportLocation'
}

export type XcmErrorV1_DestinationBufferOverflow = {
    __kind: 'DestinationBufferOverflow'
}

export type XcmErrorV1_SendFailed = {
    __kind: 'SendFailed'
}

export type XcmErrorV1_CannotReachDestination = {
    __kind: 'CannotReachDestination'
    value: [MultiLocationV1, XcmV1]
}

export type XcmErrorV1_MultiLocationFull = {
    __kind: 'MultiLocationFull'
}

export type XcmErrorV1_FailedToDecode = {
    __kind: 'FailedToDecode'
}

export type XcmErrorV1_BadOrigin = {
    __kind: 'BadOrigin'
}

export type XcmErrorV1_ExceedsMaxMessageSize = {
    __kind: 'ExceedsMaxMessageSize'
}

export type XcmErrorV1_FailedToTransactAsset = {
    __kind: 'FailedToTransactAsset'
}

export type XcmErrorV1_WeightLimitReached = {
    __kind: 'WeightLimitReached'
    value: bigint
}

export type XcmErrorV1_Wildcard = {
    __kind: 'Wildcard'
}

export type XcmErrorV1_TooMuchWeightRequired = {
    __kind: 'TooMuchWeightRequired'
}

export type XcmErrorV1_NotHoldingFees = {
    __kind: 'NotHoldingFees'
}

export type XcmErrorV1_WeightNotComputable = {
    __kind: 'WeightNotComputable'
}

export type XcmErrorV1_Barrier = {
    __kind: 'Barrier'
}

export type XcmErrorV1_NotWithdrawable = {
    __kind: 'NotWithdrawable'
}

export type XcmErrorV1_LocationCannotHold = {
    __kind: 'LocationCannotHold'
}

export type XcmErrorV1_TooExpensive = {
    __kind: 'TooExpensive'
}

export type XcmErrorV1_AssetNotFound = {
    __kind: 'AssetNotFound'
}

export type XcmErrorV1_DestinationUnsupported = {
    __kind: 'DestinationUnsupported'
}

export type XcmErrorV1_RecursionLimitReached = {
    __kind: 'RecursionLimitReached'
}

export const XcmErrorV1: sts.Type<XcmErrorV1> = sts.closedEnum(() => {
    return {
        Undefined: sts.unit(),
        Overflow: sts.unit(),
        Unimplemented: sts.unit(),
        UnhandledXcmVersion: sts.unit(),
        UnhandledXcmMessage: sts.unit(),
        UnhandledEffect: sts.unit(),
        EscalationOfPrivilege: sts.unit(),
        UntrustedReserveLocation: sts.unit(),
        UntrustedTeleportLocation: sts.unit(),
        DestinationBufferOverflow: sts.unit(),
        SendFailed: sts.unit(),
        CannotReachDestination: sts.tuple(() => [MultiLocationV1, XcmV1]),
        MultiLocationFull: sts.unit(),
        FailedToDecode: sts.unit(),
        BadOrigin: sts.unit(),
        ExceedsMaxMessageSize: sts.unit(),
        FailedToTransactAsset: sts.unit(),
        WeightLimitReached: sts.bigint(),
        Wildcard: sts.unit(),
        TooMuchWeightRequired: sts.unit(),
        NotHoldingFees: sts.unit(),
        WeightNotComputable: sts.unit(),
        Barrier: sts.unit(),
        NotWithdrawable: sts.unit(),
        LocationCannotHold: sts.unit(),
        TooExpensive: sts.unit(),
        AssetNotFound: sts.unit(),
        DestinationUnsupported: sts.unit(),
        RecursionLimitReached: sts.unit(),
    }
})

export type XcmV1 = XcmV1_WithdrawAsset | XcmV1_ReserveAssetDeposited | XcmV1_ReceiveTeleportedAsset | XcmV1_QueryResponse | XcmV1_TransferAsset | XcmV1_TransferReserveAsset | XcmV1_Transact | XcmV1_HrmpNewChannelOpenRequest | XcmV1_HrmpChannelAccepted | XcmV1_HrmpChannelClosing | XcmV1_RelayedFrom | XcmV1_SubscribeVersion | XcmV1_UnsubscribeVersion

export type XcmV1_WithdrawAsset = {
    __kind: 'WithdrawAsset'
    assets: MultiAssetsV1,
    effects: XcmOrderV1[],
}

export type XcmV1_ReserveAssetDeposited = {
    __kind: 'ReserveAssetDeposited'
    assets: MultiAssetsV1,
    effects: XcmOrderV1[],
}

export type XcmV1_ReceiveTeleportedAsset = {
    __kind: 'ReceiveTeleportedAsset'
    assets: MultiAssetsV1,
    effects: XcmOrderV1[],
}

export type XcmV1_QueryResponse = {
    __kind: 'QueryResponse'
    queryId: bigint,
    response: XcmResponseV1,
}

export type XcmV1_TransferAsset = {
    __kind: 'TransferAsset'
    assets: MultiAssetsV1,
    beneficiary: MultiLocationV1,
}

export type XcmV1_TransferReserveAsset = {
    __kind: 'TransferReserveAsset'
    assets: MultiAssetsV1,
    dest: MultiLocationV1,
    effects: XcmOrderV1[],
}

export type XcmV1_Transact = {
    __kind: 'Transact'
    originType: XcmOriginKindV0,
    requireWeightAtMost: bigint,
    call: Bytes,
}

export type XcmV1_HrmpNewChannelOpenRequest = {
    __kind: 'HrmpNewChannelOpenRequest'
    sender: number,
    maxMessageSize: number,
    maxCapacity: number,
}

export type XcmV1_HrmpChannelAccepted = {
    __kind: 'HrmpChannelAccepted'
    recipient: number,
}

export type XcmV1_HrmpChannelClosing = {
    __kind: 'HrmpChannelClosing'
    initiator: number,
    sender: number,
    recipient: number,
}

export type XcmV1_RelayedFrom = {
    __kind: 'RelayedFrom'
    who: MultiLocationV1,
    message: XcmV1,
}

export type XcmV1_SubscribeVersion = {
    __kind: 'SubscribeVersion'
    queryId: bigint,
    maxResponseWeight: bigint,
}

export type XcmV1_UnsubscribeVersion = {
    __kind: 'UnsubscribeVersion'
}

export const XcmV1: sts.Type<XcmV1> = sts.closedEnum(() => {
    return {
        WithdrawAsset: sts.enumStruct({
            assets: MultiAssetsV1,
            effects: sts.array(() => XcmOrderV1),
        }),
        ReserveAssetDeposited: sts.enumStruct({
            assets: MultiAssetsV1,
            effects: sts.array(() => XcmOrderV1),
        }),
        ReceiveTeleportedAsset: sts.enumStruct({
            assets: MultiAssetsV1,
            effects: sts.array(() => XcmOrderV1),
        }),
        QueryResponse: sts.enumStruct({
            queryId: sts.bigint(),
            response: XcmResponseV1,
        }),
        TransferAsset: sts.enumStruct({
            assets: MultiAssetsV1,
            beneficiary: MultiLocationV1,
        }),
        TransferReserveAsset: sts.enumStruct({
            assets: MultiAssetsV1,
            dest: MultiLocationV1,
            effects: sts.array(() => XcmOrderV1),
        }),
        Transact: sts.enumStruct({
            originType: XcmOriginKindV0,
            requireWeightAtMost: sts.bigint(),
            call: sts.bytes(),
        }),
        HrmpNewChannelOpenRequest: sts.enumStruct({
            sender: sts.number(),
            maxMessageSize: sts.number(),
            maxCapacity: sts.number(),
        }),
        HrmpChannelAccepted: sts.enumStruct({
            recipient: sts.number(),
        }),
        HrmpChannelClosing: sts.enumStruct({
            initiator: sts.number(),
            sender: sts.number(),
            recipient: sts.number(),
        }),
        RelayedFrom: sts.enumStruct({
            who: MultiLocationV1,
            message: XcmV1,
        }),
        SubscribeVersion: sts.enumStruct({
            queryId: sts.bigint(),
            maxResponseWeight: sts.bigint(),
        }),
        UnsubscribeVersion: sts.unit(),
    }
})

export type XcmWildMultiAssetV1 = XcmWildMultiAssetV1_All | XcmWildMultiAssetV1_AllOf

export type XcmWildMultiAssetV1_All = {
    __kind: 'All'
}

export type XcmWildMultiAssetV1_AllOf = {
    __kind: 'AllOf'
    id: XcmAssetIdV1,
    fungibility: XcmWildFungibilityV1,
}

export const XcmWildMultiAssetV1: sts.Type<XcmWildMultiAssetV1> = sts.closedEnum(() => {
    return {
        All: sts.unit(),
        AllOf: sts.enumStruct({
            id: XcmAssetIdV1,
            fungibility: XcmWildFungibilityV1,
        }),
    }
})

export type XcmWildFungibilityV1 = XcmWildFungibilityV1_Fungible | XcmWildFungibilityV1_NonFungible

export type XcmWildFungibilityV1_Fungible = {
    __kind: 'Fungible'
}

export type XcmWildFungibilityV1_NonFungible = {
    __kind: 'NonFungible'
}

export const XcmWildFungibilityV1: sts.Type<XcmWildFungibilityV1> = sts.closedEnum(() => {
    return {
        Fungible: sts.unit(),
        NonFungible: sts.unit(),
    }
})

export type XcmResponseV1 = XcmResponseV1_Assets | XcmResponseV1_Version

export type XcmResponseV1_Assets = {
    __kind: 'Assets'
    value: MultiAssetsV1
}

export type XcmResponseV1_Version = {
    __kind: 'Version'
    value: XcmVersion
}

export const XcmResponseV1: sts.Type<XcmResponseV1> = sts.closedEnum(() => {
    return {
        Assets: MultiAssetsV1,
        Version: XcmVersion,
    }
})

export type MultiLocationV1 = {
    parents: number,
    interior: XcmJunctionsV1,
}

export const MultiLocationV1: sts.Type<MultiLocationV1> = sts.struct(() => {
    return {
        parents: sts.number(),
        interior: XcmJunctionsV1,
    }
})

export type MultiAssetFilterV1 = MultiAssetFilterV1_Definite | MultiAssetFilterV1_Wild

export type MultiAssetFilterV1_Definite = {
    __kind: 'Definite'
    value: MultiAssetsV1
}

export type MultiAssetFilterV1_Wild = {
    __kind: 'Wild'
    value: XcmWildMultiAssetV1
}

export const MultiAssetFilterV1: sts.Type<MultiAssetFilterV1> = sts.closedEnum(() => {
    return {
        Definite: MultiAssetsV1,
        Wild: XcmWildMultiAssetV1,
    }
})

export type XcmAssetIdV1 = XcmAssetIdV1_Concrete | XcmAssetIdV1_Abstract

export type XcmAssetIdV1_Concrete = {
    __kind: 'Concrete'
    value: MultiLocationV1
}

export type XcmAssetIdV1_Abstract = {
    __kind: 'Abstract'
    value: Bytes
}

export const XcmAssetIdV1: sts.Type<XcmAssetIdV1> = sts.closedEnum(() => {
    return {
        Concrete: MultiLocationV1,
        Abstract: sts.bytes(),
    }
})

export type MultiAssetsV1 = MultiAssetV1[]

export const MultiAssetsV1: sts.Type<MultiAssetsV1> = sts.array(() => MultiAssetV1)

export type MultiAssetV1 = {
    id: XcmAssetIdV1,
    fungibility: XcmFungibilityV1,
}

export const MultiAssetV1: sts.Type<MultiAssetV1> = sts.struct(() => {
    return {
        id: XcmAssetIdV1,
        fungibility: XcmFungibilityV1,
    }
})

export type XcmJunctionsV1 = XcmJunctionsV1_Here | XcmJunctionsV1_X1 | XcmJunctionsV1_X2 | XcmJunctionsV1_X3 | XcmJunctionsV1_X4 | XcmJunctionsV1_X5 | XcmJunctionsV1_X6 | XcmJunctionsV1_X7 | XcmJunctionsV1_X8

export type XcmJunctionsV1_Here = {
    __kind: 'Here'
}

export type XcmJunctionsV1_X1 = {
    __kind: 'X1'
    value: XcmJunctionV1
}

export type XcmJunctionsV1_X2 = {
    __kind: 'X2'
    value: [XcmJunctionV1, XcmJunctionV1]
}

export type XcmJunctionsV1_X3 = {
    __kind: 'X3'
    value: [XcmJunctionV1, XcmJunctionV1, XcmJunctionV1]
}

export type XcmJunctionsV1_X4 = {
    __kind: 'X4'
    value: [XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1]
}

export type XcmJunctionsV1_X5 = {
    __kind: 'X5'
    value: [XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1]
}

export type XcmJunctionsV1_X6 = {
    __kind: 'X6'
    value: [XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1]
}

export type XcmJunctionsV1_X7 = {
    __kind: 'X7'
    value: [XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1]
}

export type XcmJunctionsV1_X8 = {
    __kind: 'X8'
    value: [XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1]
}

export const XcmJunctionsV1: sts.Type<XcmJunctionsV1> = sts.closedEnum(() => {
    return {
        Here: sts.unit(),
        X1: XcmJunctionV1,
        X2: sts.tuple(() => [XcmJunctionV1, XcmJunctionV1]),
        X3: sts.tuple(() => [XcmJunctionV1, XcmJunctionV1, XcmJunctionV1]),
        X4: sts.tuple(() => [XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1]),
        X5: sts.tuple(() => [XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1]),
        X6: sts.tuple(() => [XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1]),
        X7: sts.tuple(() => [XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1]),
        X8: sts.tuple(() => [XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1]),
    }
})

export type XcmJunctionV1 = XcmJunctionV1_Parachain | XcmJunctionV1_AccountId32 | XcmJunctionV1_AccountIndex64 | XcmJunctionV1_AccountKey20 | XcmJunctionV1_PalletInstance | XcmJunctionV1_GeneralIndex | XcmJunctionV1_GeneralKey | XcmJunctionV1_OnlyChild | XcmJunctionV1_Plurality

export type XcmJunctionV1_Parachain = {
    __kind: 'Parachain'
    value: number
}

export type XcmJunctionV1_AccountId32 = {
    __kind: 'AccountId32'
    network: XcmNetworkIdV0,
    id: Bytes,
}

export type XcmJunctionV1_AccountIndex64 = {
    __kind: 'AccountIndex64'
    network: XcmNetworkIdV0,
    index: bigint,
}

export type XcmJunctionV1_AccountKey20 = {
    __kind: 'AccountKey20'
    network: XcmNetworkIdV0,
    key: Bytes,
}

export type XcmJunctionV1_PalletInstance = {
    __kind: 'PalletInstance'
    value: number
}

export type XcmJunctionV1_GeneralIndex = {
    __kind: 'GeneralIndex'
    value: bigint
}

export type XcmJunctionV1_GeneralKey = {
    __kind: 'GeneralKey'
    value: Bytes
}

export type XcmJunctionV1_OnlyChild = {
    __kind: 'OnlyChild'
}

export type XcmJunctionV1_Plurality = {
    __kind: 'Plurality'
    id: XcmBodyIdV0,
    part: XcmBodyPartV0,
}

export const XcmJunctionV1: sts.Type<XcmJunctionV1> = sts.closedEnum(() => {
    return {
        Parachain: sts.number(),
        AccountId32: sts.enumStruct({
            network: XcmNetworkIdV0,
            id: sts.bytes(),
        }),
        AccountIndex64: sts.enumStruct({
            network: XcmNetworkIdV0,
            index: sts.bigint(),
        }),
        AccountKey20: sts.enumStruct({
            network: XcmNetworkIdV0,
            key: sts.bytes(),
        }),
        PalletInstance: sts.number(),
        GeneralIndex: sts.bigint(),
        GeneralKey: sts.bytes(),
        OnlyChild: sts.unit(),
        Plurality: sts.enumStruct({
            id: XcmBodyIdV0,
            part: XcmBodyPartV0,
        }),
    }
})

export type XcmFungibilityV1 = XcmFungibilityV1_Fungible | XcmFungibilityV1_NonFungible

export type XcmFungibilityV1_Fungible = {
    __kind: 'Fungible'
    value: bigint
}

export type XcmFungibilityV1_NonFungible = {
    __kind: 'NonFungible'
    value: XcmAssetInstanceV1
}

export const XcmFungibilityV1: sts.Type<XcmFungibilityV1> = sts.closedEnum(() => {
    return {
        Fungible: sts.bigint(),
        NonFungible: XcmAssetInstanceV1,
    }
})

export type XcmAssetInstanceV1 = XcmAssetInstanceV1_Undefined | XcmAssetInstanceV1_Index | XcmAssetInstanceV1_Array4 | XcmAssetInstanceV1_Array8 | XcmAssetInstanceV1_Array16 | XcmAssetInstanceV1_Array32 | XcmAssetInstanceV1_Blob

export type XcmAssetInstanceV1_Undefined = {
    __kind: 'Undefined'
}

export type XcmAssetInstanceV1_Index = {
    __kind: 'Index'
    value: bigint
}

export type XcmAssetInstanceV1_Array4 = {
    __kind: 'Array4'
    value: Bytes
}

export type XcmAssetInstanceV1_Array8 = {
    __kind: 'Array8'
    value: Bytes
}

export type XcmAssetInstanceV1_Array16 = {
    __kind: 'Array16'
    value: Bytes
}

export type XcmAssetInstanceV1_Array32 = {
    __kind: 'Array32'
    value: Bytes
}

export type XcmAssetInstanceV1_Blob = {
    __kind: 'Blob'
    value: Bytes
}

export const XcmAssetInstanceV1: sts.Type<XcmAssetInstanceV1> = sts.closedEnum(() => {
    return {
        Undefined: sts.unit(),
        Index: sts.bigint(),
        Array4: sts.bytes(),
        Array8: sts.bytes(),
        Array16: sts.bytes(),
        Array32: sts.bytes(),
        Blob: sts.bytes(),
    }
})

export type XcmOutcomeV0 = XcmOutcomeV0_Complete | XcmOutcomeV0_Incomplete | XcmOutcomeV0_Error

export type XcmOutcomeV0_Complete = {
    __kind: 'Complete'
    value: bigint
}

export type XcmOutcomeV0_Incomplete = {
    __kind: 'Incomplete'
    value: [bigint, XcmErrorV0]
}

export type XcmOutcomeV0_Error = {
    __kind: 'Error'
    value: XcmErrorV0
}

export const XcmOutcomeV0: sts.Type<XcmOutcomeV0> = sts.closedEnum(() => {
    return {
        Complete: sts.bigint(),
        Incomplete: sts.tuple(() => [sts.bigint(), XcmErrorV0]),
        Error: XcmErrorV0,
    }
})

export type XcmOrderV0 = XcmOrderV0_Null | XcmOrderV0_DepositAsset | XcmOrderV0_DepositReserveAsset | XcmOrderV0_ExchangeAsset | XcmOrderV0_InitiateReserveWithdraw | XcmOrderV0_InitiateTeleport | XcmOrderV0_QueryHolding | XcmOrderV0_BuyExecution

export type XcmOrderV0_Null = {
    __kind: 'Null'
}

export type XcmOrderV0_DepositAsset = {
    __kind: 'DepositAsset'
    assets: MultiAssetV0[],
    dest: MultiLocationV0,
}

export type XcmOrderV0_DepositReserveAsset = {
    __kind: 'DepositReserveAsset'
    assets: MultiAssetV0[],
    dest: MultiLocationV0,
    effects: XcmOrderV0[],
}

export type XcmOrderV0_ExchangeAsset = {
    __kind: 'ExchangeAsset'
    give: MultiAssetV0[],
    receive: MultiAssetV0[],
}

export type XcmOrderV0_InitiateReserveWithdraw = {
    __kind: 'InitiateReserveWithdraw'
    assets: MultiAssetV0[],
    reserve: MultiLocationV0,
    effects: XcmOrderV0[],
}

export type XcmOrderV0_InitiateTeleport = {
    __kind: 'InitiateTeleport'
    assets: MultiAssetV0[],
    dest: MultiLocationV0,
    effects: XcmOrderV0[],
}

export type XcmOrderV0_QueryHolding = {
    __kind: 'QueryHolding'
    queryId: bigint,
    dest: MultiLocationV0,
    assets: MultiAssetV0[],
}

export type XcmOrderV0_BuyExecution = {
    __kind: 'BuyExecution'
    fees: MultiAssetV0,
    weight: bigint,
    debt: bigint,
    haltOnError: boolean,
    xcm: XcmV0[],
}

export const XcmOrderV0: sts.Type<XcmOrderV0> = sts.closedEnum(() => {
    return {
        Null: sts.unit(),
        DepositAsset: sts.enumStruct({
            assets: sts.array(() => MultiAssetV0),
            dest: MultiLocationV0,
        }),
        DepositReserveAsset: sts.enumStruct({
            assets: sts.array(() => MultiAssetV0),
            dest: MultiLocationV0,
            effects: sts.array(() => XcmOrderV0),
        }),
        ExchangeAsset: sts.enumStruct({
            give: sts.array(() => MultiAssetV0),
            receive: sts.array(() => MultiAssetV0),
        }),
        InitiateReserveWithdraw: sts.enumStruct({
            assets: sts.array(() => MultiAssetV0),
            reserve: MultiLocationV0,
            effects: sts.array(() => XcmOrderV0),
        }),
        InitiateTeleport: sts.enumStruct({
            assets: sts.array(() => MultiAssetV0),
            dest: MultiLocationV0,
            effects: sts.array(() => XcmOrderV0),
        }),
        QueryHolding: sts.enumStruct({
            queryId: sts.bigint(),
            dest: MultiLocationV0,
            assets: sts.array(() => MultiAssetV0),
        }),
        BuyExecution: sts.enumStruct({
            fees: MultiAssetV0,
            weight: sts.bigint(),
            debt: sts.bigint(),
            haltOnError: sts.boolean(),
            xcm: sts.array(() => XcmV0),
        }),
    }
})

export type XcmErrorV0 = XcmErrorV0_Undefined | XcmErrorV0_Overflow | XcmErrorV0_Unimplemented | XcmErrorV0_UnhandledXcmVersion | XcmErrorV0_UnhandledXcmMessage | XcmErrorV0_UnhandledEffect | XcmErrorV0_EscalationOfPrivilege | XcmErrorV0_UntrustedReserveLocation | XcmErrorV0_UntrustedTeleportLocation | XcmErrorV0_DestinationBufferOverflow | XcmErrorV0_SendFailed | XcmErrorV0_CannotReachDestination | XcmErrorV0_MultiLocationFull | XcmErrorV0_FailedToDecode | XcmErrorV0_BadOrigin | XcmErrorV0_ExceedsMaxMessageSize | XcmErrorV0_FailedToTransactAsset | XcmErrorV0_WeightLimitReached | XcmErrorV0_Wildcard | XcmErrorV0_TooMuchWeightRequired | XcmErrorV0_NotHoldingFees | XcmErrorV0_WeightNotComputable | XcmErrorV0_Barrier | XcmErrorV0_NotWithdrawable | XcmErrorV0_LocationCannotHold | XcmErrorV0_TooExpensive | XcmErrorV0_AssetNotFound | XcmErrorV0_RecursionLimitReached

export type XcmErrorV0_Undefined = {
    __kind: 'Undefined'
}

export type XcmErrorV0_Overflow = {
    __kind: 'Overflow'
}

export type XcmErrorV0_Unimplemented = {
    __kind: 'Unimplemented'
}

export type XcmErrorV0_UnhandledXcmVersion = {
    __kind: 'UnhandledXcmVersion'
}

export type XcmErrorV0_UnhandledXcmMessage = {
    __kind: 'UnhandledXcmMessage'
}

export type XcmErrorV0_UnhandledEffect = {
    __kind: 'UnhandledEffect'
}

export type XcmErrorV0_EscalationOfPrivilege = {
    __kind: 'EscalationOfPrivilege'
}

export type XcmErrorV0_UntrustedReserveLocation = {
    __kind: 'UntrustedReserveLocation'
}

export type XcmErrorV0_UntrustedTeleportLocation = {
    __kind: 'UntrustedTeleportLocation'
}

export type XcmErrorV0_DestinationBufferOverflow = {
    __kind: 'DestinationBufferOverflow'
}

export type XcmErrorV0_SendFailed = {
    __kind: 'SendFailed'
}

export type XcmErrorV0_CannotReachDestination = {
    __kind: 'CannotReachDestination'
    value: [MultiLocationV0, XcmV0]
}

export type XcmErrorV0_MultiLocationFull = {
    __kind: 'MultiLocationFull'
}

export type XcmErrorV0_FailedToDecode = {
    __kind: 'FailedToDecode'
}

export type XcmErrorV0_BadOrigin = {
    __kind: 'BadOrigin'
}

export type XcmErrorV0_ExceedsMaxMessageSize = {
    __kind: 'ExceedsMaxMessageSize'
}

export type XcmErrorV0_FailedToTransactAsset = {
    __kind: 'FailedToTransactAsset'
}

export type XcmErrorV0_WeightLimitReached = {
    __kind: 'WeightLimitReached'
    value: bigint
}

export type XcmErrorV0_Wildcard = {
    __kind: 'Wildcard'
}

export type XcmErrorV0_TooMuchWeightRequired = {
    __kind: 'TooMuchWeightRequired'
}

export type XcmErrorV0_NotHoldingFees = {
    __kind: 'NotHoldingFees'
}

export type XcmErrorV0_WeightNotComputable = {
    __kind: 'WeightNotComputable'
}

export type XcmErrorV0_Barrier = {
    __kind: 'Barrier'
}

export type XcmErrorV0_NotWithdrawable = {
    __kind: 'NotWithdrawable'
}

export type XcmErrorV0_LocationCannotHold = {
    __kind: 'LocationCannotHold'
}

export type XcmErrorV0_TooExpensive = {
    __kind: 'TooExpensive'
}

export type XcmErrorV0_AssetNotFound = {
    __kind: 'AssetNotFound'
}

export type XcmErrorV0_RecursionLimitReached = {
    __kind: 'RecursionLimitReached'
}

export const XcmErrorV0: sts.Type<XcmErrorV0> = sts.closedEnum(() => {
    return {
        Undefined: sts.unit(),
        Overflow: sts.unit(),
        Unimplemented: sts.unit(),
        UnhandledXcmVersion: sts.unit(),
        UnhandledXcmMessage: sts.unit(),
        UnhandledEffect: sts.unit(),
        EscalationOfPrivilege: sts.unit(),
        UntrustedReserveLocation: sts.unit(),
        UntrustedTeleportLocation: sts.unit(),
        DestinationBufferOverflow: sts.unit(),
        SendFailed: sts.unit(),
        CannotReachDestination: sts.tuple(() => [MultiLocationV0, XcmV0]),
        MultiLocationFull: sts.unit(),
        FailedToDecode: sts.unit(),
        BadOrigin: sts.unit(),
        ExceedsMaxMessageSize: sts.unit(),
        FailedToTransactAsset: sts.unit(),
        WeightLimitReached: sts.bigint(),
        Wildcard: sts.unit(),
        TooMuchWeightRequired: sts.unit(),
        NotHoldingFees: sts.unit(),
        WeightNotComputable: sts.unit(),
        Barrier: sts.unit(),
        NotWithdrawable: sts.unit(),
        LocationCannotHold: sts.unit(),
        TooExpensive: sts.unit(),
        AssetNotFound: sts.unit(),
        RecursionLimitReached: sts.unit(),
    }
})

export type XcmV0 = XcmV0_WithdrawAsset | XcmV0_ReserveAssetDeposit | XcmV0_TeleportAsset | XcmV0_QueryResponse | XcmV0_TransferAsset | XcmV0_TransferReserveAsset | XcmV0_Transact | XcmV0_HrmpNewChannelOpenRequest | XcmV0_HrmpChannelAccepted | XcmV0_HrmpChannelClosing | XcmV0_RelayedFrom

export type XcmV0_WithdrawAsset = {
    __kind: 'WithdrawAsset'
    assets: MultiAssetV0[],
    effects: XcmOrderV0[],
}

export type XcmV0_ReserveAssetDeposit = {
    __kind: 'ReserveAssetDeposit'
    assets: MultiAssetV0[],
    effects: XcmOrderV0[],
}

export type XcmV0_TeleportAsset = {
    __kind: 'TeleportAsset'
    assets: MultiAssetV0[],
    effects: XcmOrderV0[],
}

export type XcmV0_QueryResponse = {
    __kind: 'QueryResponse'
    queryId: bigint,
    response: XcmResponseV0,
}

export type XcmV0_TransferAsset = {
    __kind: 'TransferAsset'
    assets: MultiAssetV0[],
    dest: MultiLocationV0,
}

export type XcmV0_TransferReserveAsset = {
    __kind: 'TransferReserveAsset'
    assets: MultiAssetV0[],
    dest: MultiLocationV0,
    effects: XcmOrderV0[],
}

export type XcmV0_Transact = {
    __kind: 'Transact'
    originType: XcmOriginKindV0,
    requireWeightAtMost: bigint,
    call: Bytes,
}

export type XcmV0_HrmpNewChannelOpenRequest = {
    __kind: 'HrmpNewChannelOpenRequest'
    sender: number,
    maxMessageSize: number,
    maxCapacity: number,
}

export type XcmV0_HrmpChannelAccepted = {
    __kind: 'HrmpChannelAccepted'
    recipient: number,
}

export type XcmV0_HrmpChannelClosing = {
    __kind: 'HrmpChannelClosing'
    initiator: number,
    sender: number,
    recipient: number,
}

export type XcmV0_RelayedFrom = {
    __kind: 'RelayedFrom'
    who: MultiLocationV0,
    message: XcmV0,
}

export const XcmV0: sts.Type<XcmV0> = sts.closedEnum(() => {
    return {
        WithdrawAsset: sts.enumStruct({
            assets: sts.array(() => MultiAssetV0),
            effects: sts.array(() => XcmOrderV0),
        }),
        ReserveAssetDeposit: sts.enumStruct({
            assets: sts.array(() => MultiAssetV0),
            effects: sts.array(() => XcmOrderV0),
        }),
        TeleportAsset: sts.enumStruct({
            assets: sts.array(() => MultiAssetV0),
            effects: sts.array(() => XcmOrderV0),
        }),
        QueryResponse: sts.enumStruct({
            queryId: sts.bigint(),
            response: XcmResponseV0,
        }),
        TransferAsset: sts.enumStruct({
            assets: sts.array(() => MultiAssetV0),
            dest: MultiLocationV0,
        }),
        TransferReserveAsset: sts.enumStruct({
            assets: sts.array(() => MultiAssetV0),
            dest: MultiLocationV0,
            effects: sts.array(() => XcmOrderV0),
        }),
        Transact: sts.enumStruct({
            originType: XcmOriginKindV0,
            requireWeightAtMost: sts.bigint(),
            call: sts.bytes(),
        }),
        HrmpNewChannelOpenRequest: sts.enumStruct({
            sender: sts.number(),
            maxMessageSize: sts.number(),
            maxCapacity: sts.number(),
        }),
        HrmpChannelAccepted: sts.enumStruct({
            recipient: sts.number(),
        }),
        HrmpChannelClosing: sts.enumStruct({
            initiator: sts.number(),
            sender: sts.number(),
            recipient: sts.number(),
        }),
        RelayedFrom: sts.enumStruct({
            who: MultiLocationV0,
            message: XcmV0,
        }),
    }
})

export type XcmResponseV0 = XcmResponseV0_Assets

export type XcmResponseV0_Assets = {
    __kind: 'Assets'
    value: MultiAssetV0[]
}

export const XcmResponseV0: sts.Type<XcmResponseV0> = sts.closedEnum(() => {
    return {
        Assets: sts.array(() => MultiAssetV0),
    }
})

export type XcmOriginKindV0 = XcmOriginKindV0_Native | XcmOriginKindV0_SovereignAccount | XcmOriginKindV0_Superuser | XcmOriginKindV0_Xcm

export type XcmOriginKindV0_Native = {
    __kind: 'Native'
}

export type XcmOriginKindV0_SovereignAccount = {
    __kind: 'SovereignAccount'
}

export type XcmOriginKindV0_Superuser = {
    __kind: 'Superuser'
}

export type XcmOriginKindV0_Xcm = {
    __kind: 'Xcm'
}

export const XcmOriginKindV0: sts.Type<XcmOriginKindV0> = sts.closedEnum(() => {
    return {
        Native: sts.unit(),
        SovereignAccount: sts.unit(),
        Superuser: sts.unit(),
        Xcm: sts.unit(),
    }
})

export type MultiLocationV0 = MultiLocationV0_Here | MultiLocationV0_X1 | MultiLocationV0_X2 | MultiLocationV0_X3 | MultiLocationV0_X4 | MultiLocationV0_X5 | MultiLocationV0_X6 | MultiLocationV0_X7 | MultiLocationV0_X8

export type MultiLocationV0_Here = {
    __kind: 'Here'
}

export type MultiLocationV0_X1 = {
    __kind: 'X1'
    value: XcmJunctionV0
}

export type MultiLocationV0_X2 = {
    __kind: 'X2'
    value: [XcmJunctionV0, XcmJunctionV0]
}

export type MultiLocationV0_X3 = {
    __kind: 'X3'
    value: [XcmJunctionV0, XcmJunctionV0, XcmJunctionV0]
}

export type MultiLocationV0_X4 = {
    __kind: 'X4'
    value: [XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0]
}

export type MultiLocationV0_X5 = {
    __kind: 'X5'
    value: [XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0]
}

export type MultiLocationV0_X6 = {
    __kind: 'X6'
    value: [XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0]
}

export type MultiLocationV0_X7 = {
    __kind: 'X7'
    value: [XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0]
}

export type MultiLocationV0_X8 = {
    __kind: 'X8'
    value: [XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0]
}

export const MultiLocationV0: sts.Type<MultiLocationV0> = sts.closedEnum(() => {
    return {
        Here: sts.unit(),
        X1: XcmJunctionV0,
        X2: sts.tuple(() => [XcmJunctionV0, XcmJunctionV0]),
        X3: sts.tuple(() => [XcmJunctionV0, XcmJunctionV0, XcmJunctionV0]),
        X4: sts.tuple(() => [XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0]),
        X5: sts.tuple(() => [XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0]),
        X6: sts.tuple(() => [XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0]),
        X7: sts.tuple(() => [XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0]),
        X8: sts.tuple(() => [XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0]),
    }
})

export type MultiAssetV0 = MultiAssetV0_None | MultiAssetV0_All | MultiAssetV0_AllFungible | MultiAssetV0_AllNonFungible | MultiAssetV0_AllAbstractFungible | MultiAssetV0_AllAbstractNonFungible | MultiAssetV0_AllConcreteFungible | MultiAssetV0_AllConcreteNonFungible | MultiAssetV0_AbstractFungible | MultiAssetV0_AbstractNonFungible | MultiAssetV0_ConcreteFungible | MultiAssetV0_ConcreteNonFungible

export type MultiAssetV0_None = {
    __kind: 'None'
}

export type MultiAssetV0_All = {
    __kind: 'All'
}

export type MultiAssetV0_AllFungible = {
    __kind: 'AllFungible'
}

export type MultiAssetV0_AllNonFungible = {
    __kind: 'AllNonFungible'
}

export type MultiAssetV0_AllAbstractFungible = {
    __kind: 'AllAbstractFungible'
    value: Bytes
}

export type MultiAssetV0_AllAbstractNonFungible = {
    __kind: 'AllAbstractNonFungible'
    value: Bytes
}

export type MultiAssetV0_AllConcreteFungible = {
    __kind: 'AllConcreteFungible'
    value: MultiLocationV0
}

export type MultiAssetV0_AllConcreteNonFungible = {
    __kind: 'AllConcreteNonFungible'
    value: MultiLocationV0
}

export type MultiAssetV0_AbstractFungible = {
    __kind: 'AbstractFungible'
    id: Bytes,
    instance: bigint,
}

export type MultiAssetV0_AbstractNonFungible = {
    __kind: 'AbstractNonFungible'
    class: Bytes,
    instance: XcmAssetInstanceV0,
}

export type MultiAssetV0_ConcreteFungible = {
    __kind: 'ConcreteFungible'
    id: MultiLocationV0,
    amount: bigint,
}

export type MultiAssetV0_ConcreteNonFungible = {
    __kind: 'ConcreteNonFungible'
    class: MultiLocationV0,
    instance: XcmAssetInstanceV0,
}

export const MultiAssetV0: sts.Type<MultiAssetV0> = sts.closedEnum(() => {
    return {
        None: sts.unit(),
        All: sts.unit(),
        AllFungible: sts.unit(),
        AllNonFungible: sts.unit(),
        AllAbstractFungible: sts.bytes(),
        AllAbstractNonFungible: sts.bytes(),
        AllConcreteFungible: MultiLocationV0,
        AllConcreteNonFungible: MultiLocationV0,
        AbstractFungible: sts.enumStruct({
            id: sts.bytes(),
            instance: sts.bigint(),
        }),
        AbstractNonFungible: sts.enumStruct({
            class: sts.bytes(),
            instance: XcmAssetInstanceV0,
        }),
        ConcreteFungible: sts.enumStruct({
            id: MultiLocationV0,
            amount: sts.bigint(),
        }),
        ConcreteNonFungible: sts.enumStruct({
            class: MultiLocationV0,
            instance: XcmAssetInstanceV0,
        }),
    }
})

export type XcmJunctionV0 = XcmJunctionV0_Parent | XcmJunctionV0_Parachain | XcmJunctionV0_AccountId32 | XcmJunctionV0_AccountIndex64 | XcmJunctionV0_AccountKey20 | XcmJunctionV0_PalletInstance | XcmJunctionV0_GeneralIndex | XcmJunctionV0_GeneralKey | XcmJunctionV0_OnlyChild | XcmJunctionV0_Plurality

export type XcmJunctionV0_Parent = {
    __kind: 'Parent'
}

export type XcmJunctionV0_Parachain = {
    __kind: 'Parachain'
    value: number
}

export type XcmJunctionV0_AccountId32 = {
    __kind: 'AccountId32'
    network: XcmNetworkIdV0,
    id: Bytes,
}

export type XcmJunctionV0_AccountIndex64 = {
    __kind: 'AccountIndex64'
    network: XcmNetworkIdV0,
    index: bigint,
}

export type XcmJunctionV0_AccountKey20 = {
    __kind: 'AccountKey20'
    network: XcmNetworkIdV0,
    key: Bytes,
}

export type XcmJunctionV0_PalletInstance = {
    __kind: 'PalletInstance'
    value: number
}

export type XcmJunctionV0_GeneralIndex = {
    __kind: 'GeneralIndex'
    value: bigint
}

export type XcmJunctionV0_GeneralKey = {
    __kind: 'GeneralKey'
    value: Bytes
}

export type XcmJunctionV0_OnlyChild = {
    __kind: 'OnlyChild'
}

export type XcmJunctionV0_Plurality = {
    __kind: 'Plurality'
    id: XcmBodyIdV0,
    part: XcmBodyPartV0,
}

export const XcmJunctionV0: sts.Type<XcmJunctionV0> = sts.closedEnum(() => {
    return {
        Parent: sts.unit(),
        Parachain: sts.number(),
        AccountId32: sts.enumStruct({
            network: XcmNetworkIdV0,
            id: sts.bytes(),
        }),
        AccountIndex64: sts.enumStruct({
            network: XcmNetworkIdV0,
            index: sts.bigint(),
        }),
        AccountKey20: sts.enumStruct({
            network: XcmNetworkIdV0,
            key: sts.bytes(),
        }),
        PalletInstance: sts.number(),
        GeneralIndex: sts.bigint(),
        GeneralKey: sts.bytes(),
        OnlyChild: sts.unit(),
        Plurality: sts.enumStruct({
            id: XcmBodyIdV0,
            part: XcmBodyPartV0,
        }),
    }
})

export type XcmBodyPartV0 = XcmBodyPartV0_Voice | XcmBodyPartV0_Members | XcmBodyPartV0_Fraction | XcmBodyPartV0_AtLeastProportion | XcmBodyPartV0_MoreThanProportion

export type XcmBodyPartV0_Voice = {
    __kind: 'Voice'
}

export type XcmBodyPartV0_Members = {
    __kind: 'Members'
    value: number
}

export type XcmBodyPartV0_Fraction = {
    __kind: 'Fraction'
    nom: number,
    denom: number,
}

export type XcmBodyPartV0_AtLeastProportion = {
    __kind: 'AtLeastProportion'
    nom: number,
    denom: number,
}

export type XcmBodyPartV0_MoreThanProportion = {
    __kind: 'MoreThanProportion'
    nom: number,
    denom: number,
}

export const XcmBodyPartV0: sts.Type<XcmBodyPartV0> = sts.closedEnum(() => {
    return {
        Voice: sts.unit(),
        Members: sts.number(),
        Fraction: sts.enumStruct({
            nom: sts.number(),
            denom: sts.number(),
        }),
        AtLeastProportion: sts.enumStruct({
            nom: sts.number(),
            denom: sts.number(),
        }),
        MoreThanProportion: sts.enumStruct({
            nom: sts.number(),
            denom: sts.number(),
        }),
    }
})

export type XcmBodyIdV0 = XcmBodyIdV0_Unit | XcmBodyIdV0_Named | XcmBodyIdV0_Index | XcmBodyIdV0_Executive | XcmBodyIdV0_Technical | XcmBodyIdV0_Legislative | XcmBodyIdV0_Judicial

export type XcmBodyIdV0_Unit = {
    __kind: 'Unit'
}

export type XcmBodyIdV0_Named = {
    __kind: 'Named'
    value: Bytes
}

export type XcmBodyIdV0_Index = {
    __kind: 'Index'
    value: number
}

export type XcmBodyIdV0_Executive = {
    __kind: 'Executive'
}

export type XcmBodyIdV0_Technical = {
    __kind: 'Technical'
}

export type XcmBodyIdV0_Legislative = {
    __kind: 'Legislative'
}

export type XcmBodyIdV0_Judicial = {
    __kind: 'Judicial'
}

export const XcmBodyIdV0: sts.Type<XcmBodyIdV0> = sts.closedEnum(() => {
    return {
        Unit: sts.unit(),
        Named: sts.bytes(),
        Index: sts.number(),
        Executive: sts.unit(),
        Technical: sts.unit(),
        Legislative: sts.unit(),
        Judicial: sts.unit(),
    }
})

export type XcmNetworkIdV0 = XcmNetworkIdV0_Any | XcmNetworkIdV0_Named | XcmNetworkIdV0_Polkadot | XcmNetworkIdV0_Kusama

export type XcmNetworkIdV0_Any = {
    __kind: 'Any'
}

export type XcmNetworkIdV0_Named = {
    __kind: 'Named'
    value: Bytes
}

export type XcmNetworkIdV0_Polkadot = {
    __kind: 'Polkadot'
}

export type XcmNetworkIdV0_Kusama = {
    __kind: 'Kusama'
}

export const XcmNetworkIdV0: sts.Type<XcmNetworkIdV0> = sts.closedEnum(() => {
    return {
        Any: sts.unit(),
        Named: sts.bytes(),
        Polkadot: sts.unit(),
        Kusama: sts.unit(),
    }
})

export type XcmAssetInstanceV0 = XcmAssetInstanceV0_Undefined | XcmAssetInstanceV0_Index8 | XcmAssetInstanceV0_Index16 | XcmAssetInstanceV0_Index32 | XcmAssetInstanceV0_Index64 | XcmAssetInstanceV0_Index128 | XcmAssetInstanceV0_Array4 | XcmAssetInstanceV0_Array8 | XcmAssetInstanceV0_Array16 | XcmAssetInstanceV0_Array32 | XcmAssetInstanceV0_Blob

export type XcmAssetInstanceV0_Undefined = {
    __kind: 'Undefined'
}

export type XcmAssetInstanceV0_Index8 = {
    __kind: 'Index8'
    value: number
}

export type XcmAssetInstanceV0_Index16 = {
    __kind: 'Index16'
    value: number
}

export type XcmAssetInstanceV0_Index32 = {
    __kind: 'Index32'
    value: number
}

export type XcmAssetInstanceV0_Index64 = {
    __kind: 'Index64'
    value: bigint
}

export type XcmAssetInstanceV0_Index128 = {
    __kind: 'Index128'
    value: bigint
}

export type XcmAssetInstanceV0_Array4 = {
    __kind: 'Array4'
    value: Bytes
}

export type XcmAssetInstanceV0_Array8 = {
    __kind: 'Array8'
    value: Bytes
}

export type XcmAssetInstanceV0_Array16 = {
    __kind: 'Array16'
    value: Bytes
}

export type XcmAssetInstanceV0_Array32 = {
    __kind: 'Array32'
    value: Bytes
}

export type XcmAssetInstanceV0_Blob = {
    __kind: 'Blob'
    value: Bytes
}

export const XcmAssetInstanceV0: sts.Type<XcmAssetInstanceV0> = sts.closedEnum(() => {
    return {
        Undefined: sts.unit(),
        Index8: sts.number(),
        Index16: sts.number(),
        Index32: sts.number(),
        Index64: sts.bigint(),
        Index128: sts.bigint(),
        Array4: sts.bytes(),
        Array8: sts.bytes(),
        Array16: sts.bytes(),
        Array32: sts.bytes(),
        Blob: sts.bytes(),
    }
})
