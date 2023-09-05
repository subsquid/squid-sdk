import {OldTypeDefinition, OldTypesBundle} from "../types"
import {ormlAlias, ormlTypes} from "./orml"

const additionalOverride: Record<string, OldTypeDefinition> = {
    Keys: "SessionKeys1"
}

const primitives: Record<string, OldTypeDefinition> = {
    Amount: "i128",
    AmountOf: "Amount",
    AuctionId: "u32",
    AuctionIdOf: "AuctionId",
    TokenSymbol: {
        _enum: {
            ACA: 0,
            AUSD: 1,
            DOT: 2,
            LDOT: 3,
            // 20 - 39: External tokens (e.g. bridged)
            RENBTC: 20,
            CASH: 21,
            // 40 - 127: Polkadot parachain tokens

            // 128 - 147: Karura & Kusama native tokens
            KAR: 128,
            KUSD: 129,
            KSM: 130,
            LKSM: 131,
            // 148 - 167: External tokens (e.g. bridged)
            // 149: Reserved for renBTC
            // 150: Reserved for CASH
            // 168 - 255: Kusama parachain tokens
            BNC: 168,
            VSKSM: 169
        }
    },
    DexShare: {
        _enum: {
            Token: "TokenSymbol",
            Erc20: "EvmAddress"
        }
    },
    CurrencyId: {
        _enum: {
            Token: "TokenSymbol",
            DEXShare: "(DexShare, DexShare)",
            ERC20: "EvmAddress",
            StableAssetPoolToken: "u32",
            LiquidCroadloan: "u32",
            ForeignAsset: "u32"
        }
    },
    CurrencyIdOf: "CurrencyId",
    AirDropCurrencyId: {
        _enum: ["KAR", "ACA"]
    },
    AuthoritysOriginId: {
        _enum: ["Root", "Treasury", "HonzonTreasury", "HomaTreasury", "TreasuryReserve"]
    },
    AcalaDataProviderId: {
        _enum: ["Aggregated", "Acala", "Band"]
    },
    TradingPair: "(CurrencyId,  CurrencyId)",
    OrmlCurrencyId: "CurrencyId",
    ChainBridgeChainId: "u8",
    AcalaAssetMetadata: {
        name: "Vec<u8>",
        symbol: "Vec<u8>",
        decimals: "u8",
        minimalBalance: "Balance"
    },
    NumberOrHex: "u128",
    Log: {
        address: "H160",
        topics: "Vec<H256>",
        data: "Bytes"
    },
    TransactionAction: {
        _enum: {
            Call: "H160",
            Create: "Null"
        }
    }
}

const accounts: Record<string, OldTypeDefinition> = {
    PalletBalanceOf: "Balance"
}

const auctionManager: Record<string, OldTypeDefinition> = {
    CollateralAuctionItem: {
        refundRecipient: "AccountId",
        currencyId: "CurrencyId",
        initialAmount: "Compact<Balance>",
        amount: "Compact<Balance>",
        target: "Compact<Balance>",
        startTime: "BlockNumber"
    },
    DebitAuctionItem: {
        initialAmount: "Compact<Balance>",
        amount: "Compact<Balance>",
        fix: "Compact<Balance>",
        startTime: "BlockNumber"
    },
    SurplusAuctionItem: {
        amount: "Compact<Balance>",
        startTime: "BlockNumber"
    }
}

const cdpEngine: Record<string, OldTypeDefinition> = {
    LiquidationStrategy: {
        _enum: ["Auction", "Exchange"]
    },
    OptionRate: "Option<Rate>",
    OptionRatio: "Option<Ratio>",
    ChangeOptionRate: {
        _enum: {
            NoChange: "Null",
            NewValue: "OptionRate"
        }
    },
    ChangeOptionRatio: {
        _enum: {
            NoChange: "Null",
            NewValue: "OptionRatio"
        }
    },
    ChangeBalance: {
        _enum: {
            NoChange: "Null",
            NewValue: "Balance"
        }
    },
    RiskManagementParams: {
        maximumTotalDebitValue: "Balance",
        interestRatePerSec: "Option<Rate>",
        liquidationRatio: "Option<Rate>",
        liquidationPenalty: "Option<Rate>",
        requiredCollateralRatio: "Option<Rate>"
    }
}

const collatorSelection: Record<string, OldTypeDefinition> = {
    CandidateInfoOf: "CandidateInfo"
}

const dex: Record<string, OldTypeDefinition> = {
    TradingPairProvisionParameters: {
        minContribution: "(Balance, Balance)",
        targetProvision: "(Balance, Balance)",
        accumulatedProvision: "(Balance, Balance)",
        notBefore: "BlockNumber"
    },
    BalanceWrapper: {
        amount: "Balance"
    },
    BalanceRequest: {
        amount: "Balance"
    },
    TradingPairStatus: {
        _enum: {
            Disabled: "Null",
            Provisioning: "TradingPairProvisionParameters",
            Enabled: "Null"
        }
    }
}

const evm: Record<string, OldTypeDefinition> = {
    Erc20Info: {
        address: "EvmAddress",
        name: "Vec<u8>",
        symbol: "Vec<u8>",
        decimals: "u8"
    },
    EstimateResourcesResponse: {
        /// Used gas
        gas: "u256",
        /// Used storage
        storage: "i32",
        /// Adjusted weight fee
        weightFee: "u256"
    },
    EvmAccountInfo: {
        nonce: "Index",
        contractInfo: "Option<EvmContractInfo>"
    },
    CodeInfo: {
        codeSize: "u32",
        refCount: "u32"
    },
    EvmContractInfo: {
        codeHash: "H256",
        maintainer: "H160",
        deployed: "bool"
    },
    EvmAddress: "H160",
    CallRequest: {
        from: "Option<H160>",
        to: "Option<H160>",
        gasLimit: "Option<u32>",
        storageLimit: "Option<u32>",
        value: "Option<U128>",
        data: "Option<Bytes>"
    }
}

const homa: Record<string, OldTypeDefinition> = {
    AcalaStakingLedge: {
        bonded: "Compact<Balance>",
        unlocking: "Vec<UnlockChunk>"
    },
    AcalaUnlockChunk: {
        value: "Compact<Balance>",
        era: "Compact<EraIndex>"
    }
}

const homaValidatorList: Record<string, OldTypeDefinition> = {
    RelaychainAccountId: "AccountId",
    SlashInfo: {
        validator: "RelaychainAccountId",
        relaychainTokenAmount: "Balance"
    },
    ValidatorBacking: {
        totalInsurance: "Balance",
        isFrozen: "bool"
    },
    Guarantee: {
        total: "Balance",
        bonded: "Balance",
        unbonding: "Option<(Balance, BlockNumber)>"
    }
}

const incentives: Record<string, OldTypeDefinition> = {
    PoolId: {
        _enum: {
            Loans: "CurrencyId",
            Dex: "CurrencyId"
        }
    },
    PoolIdV0: {
        _enum: {
            LoansIncentive: "CurrencyId",
            DexIncentive: "CurrencyId",
            HomaIncentive: "Null",
            DexSaving: "CurrencyId",
            HomaValidatorAllowance: "AccountId"
        }
    }
}

const loans: Record<string, OldTypeDefinition> = {
    Position: {
        collateral: "Balance",
        debit: "Balance"
    }
}

const nft: Record<string, OldTypeDefinition> = {
    CID: "Vec<u8>",
    Attributes: "BTreeMap<Vec<u8>, Vec<u8>>",
    TokenInfoOf: {
        metadata: "CID",
        owner: "AccountId",
        data: "TokenData"
    },
    Properties: {
        _set: {
            _bitLength: 8
        }
    },
    ClassData: {
        deposit: "Balance",
        properties: "Properties",
        attributes: "Attributes"
    },
    TokenData: {
        deposit: "Balance",
        attributes: "Attributes"
    },
    TokenId: "u64",
    TokenIdOf: "TokenId",
    NFTClassId: "u32",
    ClassIdOf: "ClassId",
    NFTBalance: "u128",
    NFTBalanceOf: "NFTBalance",
    ClassInfoOf: {
        metadata: "CID",
        totalIssuance: "TokenId",
        owner: "AccountId",
        data: "ClassData"
    }
}

const nomineesElection: Record<string, OldTypeDefinition> = {
    NomineeId: "AccountId",
    HomaUnlockChunk: {
        value: "Balance",
        era: "EraIndex"
    },
    BondingLedger: {
        total: "Balance",
        active: "Balance",
        unlocking: "Vec<HomaUnlockChunk>"
    }
}

const runtime: Record<string, OldTypeDefinition> = {
    OracleKey: "CurrencyId",
    OracleValue: "Price",
    AsOriginId: "AuthoritysOriginId",
    ProxyType: {
        _enum: ["Any", "CancelProxy", "Governance", "Auction", "Swap", "Loan"]
    },
    AtLeast64BitUnsigned: "u128",
    StableAssetPoolId: "u32",
    RelayChainBlockNumberOf: "RelayChainBlockNumber"
}

const stakingPool: Record<string, OldTypeDefinition> = {
    SubAccountStatus: {
        bonded: "Balance",
        available: "Balance",
        unbonding: "Vec<(EraIndex,Balance)>",
        mockRewardRate: "Rate"
    },
    Params: {
        targetMaxFreeUnbondedRatio: "Ratio",
        targetMinFreeUnbondedRatio: "Ratio",
        targetUnbondingToFreeRatio: "Ratio",
        unbondingToFreeAdjustment: "Ratio",
        baseFeeRate: "Rate"
    },
    StakingPoolPhase: {
        _enum: ["Started", "RelaychainUpdated", "LedgerUpdated", "Finished"]
    },
    Ledger: {
        bonded: "Balance",
        unbondingToFree: "Balance",
        freePool: "Balance",
        toUnbondNextEra: "(Balance, Balance)"
    },
    ChangeRate: {
        _enum: {
            NoChange: "Null",
            NewValue: "Rate"
        }
    },
    ChangeRatio: {
        _enum: {
            NoChange: "Null",
            NewValue: "Ratio"
        }
    },
    BalanceInfo: {
        amount: "Balance"
    },
    PolkadotAccountId: "AccountId",
    PolkadotAccountIdOf: "PolkadotAccountId"
}

const support: Record<string, OldTypeDefinition> = {
    ExchangeRate: "FixedU128",
    Rate: "FixedU128",
    Ratio: "FixedU128"
}

const renvmBridge: Record<string, OldTypeDefinition> = {
    PublicKey: "[u8; 20]",
    DestAddress: "Vec<u8>"
}

const stableAsset: Record<string, OldTypeDefinition> = {
    PoolTokenIndex: "u32",
    AssetId: "CurrencyId"
}

const types: Record<string, OldTypeDefinition> = {
    ...primitives,
    ...accounts,
    ...auctionManager,
    ...cdpEngine,
    ...collatorSelection,
    ...dex,
    ...evm,
    ...homa,
    ...homaValidatorList,
    ...incentives,
    ...loans,
    ...nft,
    ...nomineesElection,
    ...runtime,
    ...stakingPool,
    ...support,

    // ecosystem
    ...renvmBridge,
    ...stableAsset,
    ...additionalOverride
}


const alias = {
    rewards: {
        OrmlCurrencyId: "CurrencyId"
    },
    oracle: {
        DataProviderId: "AcalaDataProviderId"
    },
    chainBridge: {
        ChainId: "ChainBridgeChainId"
    },
    evm: {
        AccountInfo: "EvmAccountInfo",
        ContractInfo: "EvmContractInfo"
    },
    stakingPool: {
        Phase: "StakingPoolPhase"
    },
    nomineesElection: {
        UnlockChunk: "HomaUnlockChunk"
    }
}

const xcmV0 = {
    MultiLocation: "MultiLocationV0",
    MultiAsset: "MultiAssetV0",
    Xcm: "XcmV0",
    XcmOrder: "XcmOrderV0",
    XcmError: "XcmErrorV0",
    Response: "ResponseV0"
}

const xcmV1 = {
    MultiLocation: "MultiLocationV1",
    MultiAsset: "MultiAssetV1",
    Xcm: "XcmV1",
    XcmOrder: "XcmOrderV1",
    XcmError: "XcmErrorV1",
    Response: "ResponseV1"
}

const addressV0 = {
    Address: "LookupSource",
    LookupSource: "IndicesLookupSource"
}

const addressV1 = {
    Address: "GenericMultiAddress",
    LookupSource: "GenericMultiAddress"
}

const currencyV0 = {
    CurrencyId: {
        _enum: {
            Token: "TokenSymbol",
            DEXShare: "(TokenSymbol, TokenSymbol)",
            ERC20: "EvmAddress"
        }
    },
    CurrencyIdOf: "CurrencyId"
}

const poolIdV0 = {
    PoolId: {
        _enum: {
            Loans: "CurrencyId",
            DexIncentive: "CurrencyId",
            DexSaving: "CurrencyId",
            Homa: "Null"
        }
    }
}

const poolIdV1 = {
    PoolId: {
        _enum: {
            LoansIncentive: "CurrencyId",
            DexIncentive: "CurrencyId",
            HomaIncentive: "Null",
            DexSaving: "CurrencyId",
            HomaValidatorAllowance: "AccountId"
        }
    },
    // for orml-reward types
    PoolInfo: {
        totalShares: "Compact<Share>",
        totalRewards: "Compact<Balance>",
        totalWithdrawnRewards: "Compact<Balance>"
    }
}

//acala, karura, mandala
export const bundle: OldTypesBundle = {
    types: {
        ...ormlTypes,
        ...types
    },
    typesAlias: {
        ...ormlAlias,
        ...alias
    },
    versions: [
        {
            minmax: [600, 699],
            types: {
                ...xcmV0,
                ...poolIdV0,
                ...addressV0,
                TokenSymbol: {
                    _enum: ["ACA", "AUSD", "DOT", "XBTC", "LDOT", "RENBTC"]
                }
            }
        },
        {
            minmax: [700, 719],
            types: {
                ...xcmV0,
                ...poolIdV0,
                ...addressV1,
                TokenSymbol: {
                    _enum: ["ACA", "AUSD", "DOT", "XBTC", "LDOT", "RENBTC"]
                }
            }
        },
        {
            minmax: [720, 722],
            types: {
                ...addressV1,
                ...xcmV0,
                ...poolIdV0,
                ...currencyV0,
                TokenSymbol: {
                    _enum: {
                        ACA: 0,
                        AUSD: 1,
                        DOT: 2,
                        LDOT: 3,
                        XBTC: 4,
                        RENBTC: 5,
                        POLKABTC: 6,
                        PLM: 7,
                        PHA: 8,
                        HDT: 9,
                        BCG: 11,
                        KAR: 128,
                        KUSD: 129,
                        KSM: 130,
                        LKSM: 131,
                        SDN: 135,
                        KILT: 138
                    }
                }
            }
        },
        {
            minmax: [723, 729],
            types: {
                ...addressV1,
                ...xcmV0,
                ...poolIdV1,
                ...currencyV0,
                TokenSymbol: {
                    _enum: {
                        ACA: 0,
                        AUSD: 1,
                        DOT: 2,
                        LDOT: 3,
                        XBTC: 4,
                        RENBTC: 5,
                        POLKABTC: 6,
                        PLM: 7,
                        PHA: 8,
                        HDT: 9,
                        BCG: 11,
                        KAR: 128,
                        KUSD: 129,
                        KSM: 130,
                        LKSM: 131,
                        SDN: 135,
                        KILT: 138
                    }
                }
            }
        },
        {
            minmax: [730, 1007],
            types: {
                ...addressV1,
                ...xcmV0,
                ...poolIdV1,
                TokenSymbol: {
                    _enum: {
                        ACA: 0,
                        AUSD: 1,
                        DOT: 2,
                        LDOT: 3,
                        RENBTC: 4,

                        KAR: 128,
                        KUSD: 129,
                        KSM: 130,
                        LKSM: 131,
                        // Reserve for XBTC = 132
                        CASH: 140
                    }
                }
            }
        },
        {
            minmax: [1008, 1008],
            types: {
                ...addressV1,
                ...xcmV0,
                ...poolIdV1,
                TokenSymbol: {
                    _enum: {
                        ACA: 0,
                        AUSD: 1,
                        DOT: 2,
                        LDOT: 3,
                        RENBTC: 20,
                        CASH: 21,
                        KAR: 128,
                        KUSD: 129,
                        KSM: 130,
                        LKSM: 131
                    }
                }
            }
        },
        {
            minmax: [1008, 1009],
            types: {
                ...addressV1,
                ...xcmV0,
                ...poolIdV1
            }
        },
        {
            minmax: [1010, 1013],
            types: {
                ...addressV1,
                ...xcmV0
            }
        },
        {
            minmax: [1014, 1018],
            types: {
                ...addressV1,
                ...xcmV1
            }
        },
        {
            minmax: [1019, null],
            types: {
                ...addressV1
            }
        }
    ],
    signedExtensions: {
        SetEvmOrigin: 'Null'
    }
}
