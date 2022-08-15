import {OldTypes} from "../../types"


export const V1: OldTypes['types'] = {
    XcmAssetInstanceV1: {
        _enum: {
            Undefined: 'Null',
            Index: 'Compact<u128>',
            Array4: '[u8; 4]',
            Array8: '[u8; 8]',
            Array16: '[u8; 16]',
            Array32: '[u8; 32]',
            Blob: 'Bytes'
        }
    },
    XcmFungibilityV1: {
        _enum: {
            Fungible: 'Compact<u128>',
            NonFungible: 'XcmAssetInstanceV1'
        }
    },
    XcmJunctionV1: {
        _enum: {
            Parachain: 'Compact<u32>',
            AccountId32: {
                network: 'XcmNetworkIdV0',
                id: '[u8; 32]'
            },
            AccountIndex64: {
                network: 'XcmNetworkIdV0',
                index: 'Compact<u64>'
            },
            AccountKey20: {
                network: 'XcmNetworkIdV0',
                key: '[u8; 20]'
            },
            PalletInstance: 'u8',
            GeneralIndex: 'Compact<u128>',
            GeneralKey: 'Vec<u8>',
            OnlyChild: 'Null',
            Plurality: {
                id: 'XcmBodyIdV0',
                part: 'XcmBodyPartV0'
            }
        }
    },
    XcmJunctionsV1: {
        _enum: {
            Here: 'Null',
            X1: 'XcmJunctionV1',
            X2: '(XcmJunctionV1, XcmJunctionV1)',
            X3: '(XcmJunctionV1, XcmJunctionV1, XcmJunctionV1)',
            X4: '(XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1)',
            X5: '(XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1)',
            X6: '(XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1)',
            X7: '(XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1)',
            X8: '(XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1, XcmJunctionV1)'
        }
    },
    MultiAssetsV1: 'Vec<MultiAssetV1>',
    MultiAssetV1: {
        id: 'XcmAssetIdV1',
        fungibility: 'XcmFungibilityV1'
    },
    XcmAssetIdV1: {
        _enum: {
            Concrete: 'MultiLocationV1',
            Abstract: 'Bytes'
        }
    },
    MultiAssetFilterV1: {
        _enum: {
            Definite: 'MultiAssetsV1',
            Wild: 'XcmWildMultiAssetV1'
        }
    },
    MultiLocationV1: {
        parents: 'u8',
        interior: 'XcmJunctionsV1'
    },
    XcmResponseV1: {
        _enum: {
            Assets: 'MultiAssetsV1',
            Version: 'XcmVersion'
        }
    },
    XcmWildFungibilityV1: {
        _enum: ['Fungible', 'NonFungible']
    },
    XcmWildMultiAssetV1: {
        _enum: {
            All: 'Null',
            AllOf: {
                id: 'XcmAssetIdV1',
                fungibility: 'XcmWildFungibilityV1'
            }
        }
    },
    XcmV1: {
        _enum: {
            WithdrawAsset: {
                assets: 'MultiAssetsV1',
                effects: 'Vec<XcmOrderV1>'
            },
            ReserveAssetDeposited: {
                assets: 'MultiAssetsV1',
                effects: 'Vec<XcmOrderV1>'
            },
            ReceiveTeleportedAsset: {
                assets: 'MultiAssetsV1',
                effects: 'Vec<XcmOrderV1>'
            },
            QueryResponse: {
                queryId: 'Compact<u64>',
                response: 'XcmResponseV1'
            },
            TransferAsset: {
                assets: 'MultiAssetsV1',
                beneficiary: 'MultiLocationV1'
            },
            TransferReserveAsset: {
                assets: 'MultiAssetsV1',
                dest: 'MultiLocationV1',
                effects: 'Vec<XcmOrderV1>'
            },
            Transact: {
                originType: 'XcmOriginKindV0',
                requireWeightAtMost: 'u64',
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
            RelayedFrom: {
                who: 'MultiLocationV1',
                message: 'XcmV1'
            },
            SubscribeVersion: {
                queryId: 'Compact<u64>',
                maxResponseWeight: 'Compact<u64>'
            },
            UnsubscribeVersion: 'Null'
        }
    },
    XcmErrorV1: {
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
            SendFailed: 'Null',
            CannotReachDestination: '(MultiLocationV1, XcmV1)',
            MultiLocationFull: 'Null',
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
            RecursionLimitReached: 'Null'
        }
    },
    XcmOrderV1: {
        _enum: {
            Noop: 'Null',
            DepositAsset: {
                assets: 'MultiAssetFilterV1',
                maxAssets: 'u32',
                beneficiary: 'MultiLocationV1'
            },
            DepositReserveAsset: {
                assets: 'MultiAssetFilterV1',
                maxAssets: 'u32',
                dest: 'MultiLocationV1',
                effects: 'Vec<XcmOrderV1>'
            },
            ExchangeAsset: {
                give: 'MultiAssetFilterV1',
                receive: 'MultiAssetsV1'
            },
            InitiateReserveWithdraw: {
                assets: 'MultiAssetFilterV1',
                reserve: 'MultiLocationV1',
                effects: 'Vec<XcmOrderV1>'
            },
            InitiateTeleport: {
                assets: 'MultiAssetFilterV1',
                dest: 'MultiLocationV1',
                effects: 'Vec<XcmOrderV1>'
            },
            QueryHolding: {
                queryId: 'Compact<u64>',
                dest: 'MultiLocationV1',
                assets: 'MultiAssetFilterV1'
            },
            BuyExecution: {
                fees: 'MultiAssetV1',
                weight: 'u64',
                debt: 'u64',
                haltOnError: 'bool',
                instructions: 'Vec<XcmV1>'
            }
        }
    },
    XcmOutcomeV1: {
        _enum: {
            Complete: "u64",
            Incomplete: "(u64, XcmErrorV1)",
            Error: "XcmErrorV1"
        }
    }
}
