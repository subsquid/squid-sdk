import {OldTypesBundle} from "../types"


export const bundle: OldTypesBundle = {
    types: {
        AccountData: {
            free: "Balance",
            reserved: "Balance",
            misc_frozen: "Balance",
            fee_frozen: "Balance"
        },
        Address: "MultiAddress",
        Amount: "i128",
        AmountOf: "i128",
        Asset: {
            _enum: {
                CategoricalOutcome: "(MarketId, CategoryIndex)",
                ScalarOutcome: "(MarketId, ScalarPosition)",
                CombinatorialOutcome: null,
                PoolShare: "u128",
                Ztg: null
            }
        },
        AuthorId: "AccountId",
        BlockNumber: "u64",
        Bond: {
            owner: "AccountId",
            amount: "Balance"
        },
        CategoryIndex: "u16",
        Collator2: {
            id: "AccountId",
            bond: "Balance",
            nominators: "Vec<AccountId>",
            top_nominators: "Vec<Bond>",
            bottom_nominators: "Vec<Bond>",
            total_counted: "Balance",
            total_backing: "Balance",
            state: "CollatorStatus"
        },
        CollatorSnapshot: {
            bond: "Balance",
            delegations: "Vec<Bond>",
            total: "Balance"
        },
        CollatorStatus: {
            _enum: {
                Active: null,
                Idle: null,
                Leaving: "RoundIndex"
            }
        },
        CommonPoolEventParams: {
            pool_id: "u128",
            who: "AccountId"
        },
        Currency: "Asset",
        CurrencyId: "Asset",
        CurrencyIdOf: "Asset",
        DelegatorStatus: {
            _enum: {
                Active: null,
                Leaving: "RoundIndex"
            }
        },
        EmaConfig: {
            ema_period: "Timespan",
            ema_period_estimate_after: "Option<Timespan>",
            smoothing: "u128"
        },
        EmaMarketVolume: {
            config: "EmaConfig",
            ema: "u128",
            multiplier: "u128",
            last_time: "UnixTimestamp",
            state: "MarketVolumeState",
            start_time: "UnixTimestamp",
            volumes_per_period: "u128"
        },
        ExitQ: {
            candidates: "Vec<AccountId>",
            nominators_leaving: "Vec<AccountId>",
            candidate_schedule: "Vec<(AccountId, RoundIndex)>",
            nominator_schedule: "Vec<(AccountId, Option<AccountId>, RoundIndex)>"
        },
        FeeSigmoid: {
            config: "FeeSigmoidConfig"
        },
        FeeSigmoidConfig: {
            m: "i128",
            p: "i128",
            n: "i128",
            initial_fee: "i128",
            min_revenue: "i128"
        },
        Index: "u64",
        InflationInfo: {
            expect: "RangeBalance",
            annual: "RangePerbill",
            round: "RangePerbill"
        },
        Juror: {
            status: "JurorStatus"
        },
        JurorStatus: {
            _enum: [
                "Ok",
                "Tardy"
            ]
        },
        Lookup: "MultiAddress",
        Market: {
            creator: "AccountId",
            creation: "MarketCreation",
            creator_fee: "u8",
            oracle: "AccountId",
            metadata: "Vec<u8>",
            market_type: "MarketType",
            period: "MarketPeriod",
            scoring_rule: "ScoringRule",
            status: "MarketStatus",
            report: "Option<Report>",
            resolved_outcome: "Option<Outcome>",
            mdm: "MarketDisputeMechanism"
        },
        MarketCreation: {
            _enum: [
                "Permissionless",
                "Advised"
            ]
        },
        MarketDispute: {
            at: "BlockNumber",
            by: "AccountId",
            outcome: "OutcomeReport"
        },
        MarketDisputeMechanism: {
            _enum: {
                Authorized: "AccountId",
                Court: null,
                SimpleDisputes: null
            }
        },
        MarketId: "u128",
        MarketIdOf: "u128",
        MarketPeriod: {
            _enum: {
                Block: "Range<BlockNumber>",
                Timestamp: "Range<Moment>"
            }
        },
        MarketStatus: {
            _enum: [
                "Proposed",
                "Active",
                "Suspended",
                "Closed",
                "CollectingSubsidy",
                "InsufficientSubsidy",
                "Reported",
                "Disputed",
                "Resolved"
            ]
        },
        MarketType: {
            _enum: {
                Categorical: "u16",
                Scalar: "RangeInclusive<u128>"
            }
        },
        MarketVolumeState: {
            _enum: [
                "Uninitialized",
                "DataCollectionStarted",
                "DataCollected"
            ]
        },
        MaxRuntimeUsize: "u64",
        Moment: "u64",
        MultiHash: {
            _enum: {
                Sha3_384: "[u8; 50]"
            }
        },
        Nominator2: {
            delegations: "Vec<Bond>",
            revocations: "Vec<AccountId>",
            total: "Balance",
            scheduled_revocations_count: "u32",
            scheduled_revocations_total: "Balance",
            status: "DelegatorStatus"
        },
        NominatorAdded: {
            _enum: {
                AddedToTop: "Balance",
                AddedToBottom: null
            }
        },
        Order: {
            side: "OrderSide",
            maker: "AccountId",
            taker: "Option<AccountId>",
            asset: "Asset",
            total: "Balance",
            price: "Balance",
            filled: "Balance"
        },
        OrderSide: {
            _enum: [
                "Bid",
                "Ask"
            ]
        },
        OrderedSet: "Vec<Bond>",
        OwnedValuesParams: {
            participated_blocks: "BlockNumber",
            perpetual_incentives: "Balance",
            total_incentives: "Balance",
            total_shares: "Balance"
        },
        RangeBalance: {
            min: "Balance",
            ideal: "Balance",
            max: "Balance"
        },
        RangePerbill: {
            min: "Perbill",
            ideal: "Perbill",
            max: "Perbill"
        },
        RelayChainAccountId: "AccountId32",
        RewardInfo: {
            total_reward: "Balance",
            claimed_reward: "Balance"
        },
        Rikiddo: {
            config: "RikiddoConfig",
            fees: "FeeSigmoid",
            ma_short: "EmaMarketVolume",
            ma_long: "EmaMarketVolume"
        },
        RikiddoConfig: {
            initial_fee: "i128",
            log2_e: "i128"
        },
        ScoringRule: {
            _enum: [
                "CPMM",
                "RikiddoSigmoidFeeMarketEma"
            ]
        },
        OutcomeReport: {
            _enum: {
                Categorical: "u16",
                Scalar: "u128"
            }
        },
        ParachainBondConfig: {
            account: "AccountId",
            percent: "Percent"
        },
        Pool: {
            assets: "Vec<Asset>",
            base_asset: "Option<Asset>",
            market_id: "MarketId",
            pool_status: "PoolStatus",
            scoring_rule: "ScoringRule",
            swap_fee: "Option<Balance>",
            total_subsidy: "Option<Balance>",
            total_weight: "Option<u128>",
            weights: "Option<BTreeMap<Asset, u128>>"
        },
        PoolAssetEvent: {
            asset: "Asset",
            bound: "Balance",
            cpep: "CommonPoolEventParams<AccountId>",
            transferred: "Balance"
        },
        PoolAssetsEvent: {
            assets: "Vec<Asset>",
            bounds: "Vec<Balance>",
            cpep: "CommonPoolEventParams<AccountId>",
            transferred: "Vec<Balance>"
        },
        PoolId: "u128",
        PoolStatus: {
            _enum: [
                "Active",
                "CollectingSubsidy",
                "Stale"
            ]
        },
        RegistrationInfo: {
            account: "AccountId",
            deposit: "Balance"
        },
        Report: {
            at: "BlockNumber",
            by: "AccountId",
            outcome: "OutcomeReport"
        },
        RoundInfo: {
            current: "RoundIndex",
            first: "BlockNumber",
            length: "u32"
        },
        RoundIndex: "u32",
        ScalarPosition: {
            _enum: [
                "Long",
                "Short"
            ]
        },
        SerdeWrapper: "Balance",
        SubsidyUntil: {
            market_id: "MarketId",
            period: "MarketPeriod"
        },
        SwapEvent: {
            asset_amount_in: "Balance",
            asset_amount_out: "Balance",
            asset_bound: "Balance",
            asset_in: "Asset",
            asset_out: "Asset",
            cpep: "CommonPoolEventParams<AccountId>",
            max_price: "Balance"
        },
        Timespan: {
            _enum: {
                Seconds: "u32",
                Minutes: "u32",
                Hours: "u32",
                Days: "u16",
                Weeks: "u16"
            }
        },
        TokensAccountData: {
            free: "Balance",
            reserved: "Balance",
            frozen: "Balance"
        },
        UnixTimestamp: "u64",
        VestingBlockNumber: "u32"
    },
    typesAlias: {},
    signedExtensions: {
        TransactionCallFilter: "Null"
    },
    versions: [
        {
            minmax: [
                0,
                25
            ],
            types: {
                PoolAssetEvent: {
                    bound: "Balance",
                    cpep: "CommonPoolEventParams<AccountId>",
                    transferred: "Balance"
                },
                PoolAssetsEvent: {
                    bounds: "Vec<Balance>",
                    cpep: "CommonPoolEventParams<AccountId>",
                    transferred: "Vec<Balance>"
                },
                SwapEvent: {
                    asset_amount_in: "Balance",
                    asset_amount_out: "Balance",
                    asset_bound: "Balance",
                    cpep: "CommonPoolEventParams<AccountId>",
                    max_price: "Balance"
                }
            }
        }
    ]
}
