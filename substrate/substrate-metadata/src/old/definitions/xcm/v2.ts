import {OldTypes} from "../../types"


export const V2: OldTypes['types'] = {
    XcmResponseV2: {
        _enum: {
            Null: 'Null',
            Assets: 'MultiAssetsV1',
            ExecutionResult: 'Option<(u32, XcmErrorV2)>',
            Version: 'XcmVersion'
        }
    },
    XcmWeightLimitV2: {
        _enum: {
            Unlimited: 'Null',
            Limited: 'Compact<u64>'
        }
    },
    XcmInstructionV2: {
        _enum: {
            WithdrawAsset: 'MultiAssetsV1',
            ReserveAssetDeposited: 'MultiAssetsV1',
            ReceiveTeleportedAsset: 'MultiAssetsV1',
            QueryResponse: {
                queryId: 'Compact<u64>',
                response: 'XcmResponseV2',
                maxWeight: 'Compact<u64>'
            },
            TransferAsset: {
                assets: 'MultiAssetsV1',
                beneficiary: 'MultiLocationV1'
            },
            TransferReserveAsset: {
                assets: 'MultiAssetsV1',
                dest: 'MultiLocationV1',
                xcm: 'XcmV2'
            },
            Transact: {
                originType: 'XcmOriginKindV0',
                requireWeightAtMost: 'Compact<u64>',
                call: 'Vec<u8>'
            },
            HrmpNewChannelOpenRequest: {
                sender: 'Compact<u32>',
                maxMessageSize: 'Compact<u32>',
                maxCapacity: 'Compact<u32>'
            },
            HrmpChannelAccepted: {
                recipient: 'Compact<u32>'
            },
            HrmpChannelClosing: {
                initiator: 'Compact<u32>',
                sender: 'Compact<u32>',
                recipient: 'Compact<u32>'
            },
            ClearOrigin: 'Null',
            DescendOrigin: 'XcmJunctionsV1',
            ReportError: {
                queryId: 'Compact<u64>',
                dest: 'MultiLocationV1',
                maxResponseWeight: 'Compact<u64>'
            },
            DepositAsset: {
                assets: 'MultiAssetFilterV1',
                maxAssets: 'Compact<u32>',
                beneficiary: 'MultiLocationV1'
            },
            DepositReserveAsset: {
                assets: 'MultiAssetFilterV1',
                maxAssets: 'Compact<u32>',
                dest: 'MultiLocationV1',
                xcm: 'XcmV2'
            },
            ExchangeAsset: {
                give: 'MultiAssetFilterV1',
                receive: 'MultiAssetsV1'
            },
            InitiateReserveWithdraw: {
                assets: 'MultiAssetFilterV1',
                reserve: 'MultiLocationV1',
                xcm: 'XcmV2'
            },
            InitiateTeleport: {
                assets: 'MultiAssetFilterV1',
                dest: 'MultiLocationV1',
                xcm: 'XcmV2'
            },
            QueryHolding: {
                query_id: 'Compact<u64>',
                dest: 'MultiLocationV1',
                assets: 'MultiAssetFilterV1',
                maxResponse_Weight: 'Compact<u64>'
            },
            BuyExecution: {
                fees: 'MultiAssetV1',
                weightLimit: 'XcmWeightLimitV2'
            },
            RefundSurplus: 'Null',
            SetErrorHandler: 'XcmV2',
            SetAppendix: 'XcmV2',
            ClearError: 'Null',
            ClaimAsset: {
                assets: 'MultiAssetsV1',
                ticket: 'MultiLocationV1'
            },
            Trap: 'Compact<u64>',
            SubscribeVersion: {
                queryId: 'Compact<u64>',
                maxResponseWeight: 'Compact<u64>'
            },
            UnsubscribeVersion: 'Null'
        }
    },
    XcmV2: 'Vec<XcmInstructionV2>',
    XcmErrorV2: {
        _enum: {
            Undefined: 'Null',
            Overflow: 'Null',
            Unimplemented: 'Null',
            UnhandledXcmVersion: 'Null',
            UnhandledXcmMessage: 'Null',
            UnhandledEffect: 'Null',
            EscalationOfPrivilege: 'Null',
            UntrustedReserveLocation: 'Null',
            UntrustedTeleportLocation: 'Null',
            DestinationBufferOverflow: 'Null',
            MultiLocationFull: 'Null',
            MultiLocationNotInvertible: 'Null',
            FailedToDecode: 'Null',
            BadOrigin: 'Null',
            ExceedsMaxMessageSize: 'Null',
            FailedToTransactAsset: 'Null',
            WeightLimitReached: 'u64',
            Wildcard: 'Null',
            TooMuchWeightRequired: 'Null',
            NotHoldingFees: 'Null',
            WeightNotComputable: 'Null',
            Barrier: 'Null',
            NotWithdrawable: 'Null',
            LocationCannotHold: 'Null',
            TooExpensive: 'Null',
            AssetNotFound: 'Null',
            DestinationUnsupported: 'Null',
            RecursionLimitReached: 'Null',
            Transport: 'Null',
            Unroutable: 'Null',
            UnknownWeightRequired: 'Null',
            Trap: 'u64',
            UnknownClaim: 'Null',
            InvalidLocation: 'Null'
        }
    },
    XcmOutcomeV1: {
        _enum: {
            Complete: "u64",
            Incomplete: "(u64, XcmErrorV2)",
            Error: "XcmErrorV2"
        }
    }
}
