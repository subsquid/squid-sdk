import {OldTypes} from "../../types"


export const V0: OldTypes['types'] = {
    XcmAssetInstanceV0: {
        _enum: {
            Undefined: 'Null',
            Index8: 'u8',
            Index16: 'Compact<u16>',
            Index32: 'Compact<u32>',
            Index64: 'Compact<u64>',
            Index128: 'Compact<u128>',
            Array4: '[u8; 4]',
            Array8: '[u8; 8]',
            Array16: '[u8; 16]',
            Array32: '[u8; 32]',
            Blob: 'Vec<u8>'
        }
    },
    XcmNetworkIdV0: {
        _enum: {
            Any: 'Null',
            Named: 'Vec<u8>',
            Polkadot: 'Null',
            Kusama: 'Null'
        }
    },
    XcmBodyIdV0: {
        _enum: {
            Unit: 'Null',
            Named: 'Vec<u8>',
            Index: 'Compact<u32>',
            Executive: 'Null',
            Technical: 'Null',
            Legislative: 'Null',
            Judicial: 'Null'
        }
    },
    XcmBodyPartV0: {
        _enum: {
            Voice: 'Null',
            Members: 'Compact<u32>',
            Fraction: {
                nom: 'Compact<u32>',
                denom: 'Compact<u32>'
            },
            AtLeastProportion: {
                nom: 'Compact<u32>',
                denom: 'Compact<u32>'
            },
            MoreThanProportion: {
                nom: 'Compact<u32>',
                denom: 'Compact<u32>'
            }
        }
    },
    XcmJunctionV0: {
        _enum: {
            Parent: 'Null',
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
    MultiAssetV0: {
        _enum: {
            None: 'Null',
            All: 'Null',
            AllFungible: 'Null',
            AllNonFungible: 'Null',
            AllAbstractFungible: 'Vec<u8>',
            AllAbstractNonFungible: 'Vec<u8>',
            AllConcreteFungible: 'MultiLocationV0',
            AllConcreteNonFungible: 'MultiLocationV0',
            AbstractFungible: {
                id: 'Vec<u8>',
                instance: 'Compact<u128>'
            },
            AbstractNonFungible: {
                class: 'Vec<u8>',
                instance: 'XcmAssetInstanceV0'
            },
            ConcreteFungible: {
                id: 'MultiLocationV0',
                amount: 'Compact<u128>'
            },
            ConcreteNonFungible: {
                class: 'MultiLocationV0',
                instance: 'XcmAssetInstanceV0'
            }
        }
    },
    MultiLocationV0: {
        _enum: {
            Here: 'Null',
            X1: 'XcmJunctionV0',
            X2: '(XcmJunctionV0, XcmJunctionV0)',
            X3: '(XcmJunctionV0, XcmJunctionV0, XcmJunctionV0)',
            X4: '(XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0)',
            X5: '(XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0)',
            X6: '(XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0)',
            X7: '(XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0)',
            X8: '(XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0, XcmJunctionV0)'
        }
    },
    XcmOriginKindV0: {
        _enum: ['Native', 'SovereignAccount', 'Superuser', 'Xcm']
    },
    XcmResponseV0: {
        _enum: {
            Assets: 'Vec<MultiAssetV0>'
        }
    },
    XcmV0: {
        _enum: {
            WithdrawAsset: {
                assets: 'Vec<MultiAssetV0>',
                effects: 'Vec<XcmOrderV0>'
            },
            ReserveAssetDeposit: {
                assets: 'Vec<MultiAssetV0>',
                effects: 'Vec<XcmOrderV0>'
            },
            TeleportAsset: {
                assets: 'Vec<MultiAssetV0>',
                effects: 'Vec<XcmOrderV0>'
            },
            QueryResponse: {
                queryId: 'Compact<u64>',
                response: 'XcmResponseV0'
            },
            TransferAsset: {
                assets: 'Vec<MultiAssetV0>',
                dest: 'MultiLocationV0'
            },
            TransferReserveAsset: {
                assets: 'Vec<MultiAssetV0>',
                dest: 'MultiLocationV0',
                effects: 'Vec<XcmOrderV0>'
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
                who: 'MultiLocationV0',
                message: 'XcmV0'
            }
        }
    },
    XcmErrorV0: {
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
            CannotReachDestination: '(MultiLocationV0, XcmV0)',
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
            RecursionLimitReached: 'Null'
        }
    },
    XcmOrderV0: {
        _enum: {
            Null: 'Null',
            DepositAsset: {
                assets: 'Vec<MultiAssetV0>',
                dest: 'MultiLocationV0'
            },
            DepositReserveAsset: {
                assets: 'Vec<MultiAssetV0>',
                dest: 'MultiLocationV0',
                effects: 'Vec<XcmOrderV0>'
            },
            ExchangeAsset: {
                give: 'Vec<MultiAssetV0>',
                receive: 'Vec<MultiAssetV0>'
            },
            InitiateReserveWithdraw: {
                assets: 'Vec<MultiAssetV0>',
                reserve: 'MultiLocationV0',
                effects: 'Vec<XcmOrderV0>'
            },
            InitiateTeleport: {
                assets: 'Vec<MultiAssetV0>',
                dest: 'MultiLocationV0',
                effects: 'Vec<XcmOrderV0>'
            },
            QueryHolding: {
                queryId: 'Compact<u64>',
                dest: 'MultiLocationV0',
                assets: 'Vec<MultiAssetV0>'
            },
            BuyExecution: {
                fees: 'MultiAssetV0',
                weight: 'u64',
                debt: 'u64',
                haltOnError: 'bool',
                xcm: 'Vec<XcmV0>'
            }
        }
    },
    XcmOutcomeV0: {
        _enum: {
            Complete: "u64",
            Incomplete: "(u64, XcmErrorV0)",
            Error: "XcmErrorV0"
        }
    }
}
