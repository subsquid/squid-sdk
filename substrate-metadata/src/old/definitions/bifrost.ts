import { OldTypesBundle } from "../types";
import { ormlAlias, ormlTypes } from "./orml";

const bancor = {
    BancorPool: {
        currency_id: "CurrencyId",
        token_pool: "Balance",
        vstoken_pool: "Balance",
        token_ceiling: "Balance",
        token_base_supply: "Balance",
        vstoken_base_supply: "Balance",
    },
};

const bid = {
    BiddingOrderId: "u64",
    EraId: "u32",
    BiddingOrderUnit: {
        bidder_id: "AccountId",
        token_id: "AssetId",
        block_num: "BlockNumber",
        votes: "Balance",
        annual_roi: "Permill",
        validator: "AccountId",
    },
    BiddingOrderUnitOf: "BiddingOrderUnit",
};

const bridgeEos = {
    VersionId: "u32",
    PermissionName: "u64",
    PermissionLevel: { actor: "AccountName", permission: "PermissionName" },
    Action: {
        account: "AccountName",
        name: "ActionName",
        authorization: "Vec<PermissionLevel>",
        data: "Vec<u8>",
    },
    AccountName: "u64",
    Checksum256: "([u8;32])",
    ActionName: "u64",
    FlatMap: { map: "Vec<(ActionName, u64)>" },
    UnsignedInt: "u32",
    ActionReceipt: {
        receiver: "AccountName",
        act_digest: "Checksum256",
        global_sequence: "u64",
        recv_sequence: "u64",
        auth_sequence: "FlatMap<AccountName, u64>",
        code_sequence: "UnsignedInt",
        abi_sequence: "UnsignedInt",
    },
    BlockchainType: { _enum: ["BIFROST", "EOS", "IOST"] },
    Precision: "u32",
    BridgeAssetSymbol: {
        blockchain: "BlockchainType",
        symbol: "Vec<u8>",
        precision: "Precision",
    },
    PublicKey: { type_: "UnsignedInt", data: "[u8;33]" },
    ProducerKey: { producer_name: "AccountName", block_signing_key: "PublicKey" },
    ProducerSchedule: { version: "u32", producers: "Vec<ProducerKey>" },
    bridgeEosSignature: { type_: "UnsignedInt", data: "[u8;65]" }, // Signature => bridgeEosSignature
    BlockTimestamp: "(u32)",
    Extension: "(u16, Vec<u8>)",
    BlockHeader: {
        timestamp: "BlockTimestamp",
        producer: "AccountName",
        confirmed: "u16",
        previous: "Checksum256",
        transaction_mroot: "Checksum256",
        action_mroot: "Checksum256",
        schedule_version: "u32",
        new_producers: "Option<ProducerSchedule>",
        header_extensions: "Vec<Extension>",
    },
    SignedBlockHeader: {
        block_header: "BlockHeader",
        producer_signature: "bridgeEosSignature",
    }, // Signature => bridgeEosSignature
    Checksum256Array: "Vec<Checksum256>",
    IncrementalMerkle: { _node_count: "u64", _active_nodes: "Checksum256Array" },
    TxSig: { signature: "Vec<u8>", author: "AccountId" },
    MultiSig: { signatures: "Vec<TxSig>", threshold: "u8" },
    MultiSigTx: {
        chain_id: "Vec<u8>",
        raw_tx: "Vec<u8>",
        multi_sig: "MultiSig",
        action: "Action",
        from: "AccountId",
        asset_id: "AssetId",
    },
    Sent: { tx_id: "Vec<u8>", from: "AccountId", asset_id: "AssetId" },
    Succeeded: { tx_id: "Vec<u8>" },
    Failed: { tx_id: "Vec<u8>", reason: "Vec<u8>" },
    TxOut: {
        _enum: {
            Initialized: "MultiSigTx",
            Created: "MultiSigTx",
            SignComplete: "MultiSigTx",
            Sent: "Sent",
            Succeeded: "Succeeded",
            Failed: "Failed",
        },
    },
    TransactionStatus: {
        _enum: [
            "Initialized",
            "Created",
            "SignComplete",
            "Sent",
            "Succeeded",
            "Failed",
        ],
    },
    ProducerAuthoritySchedule: {
        version: "u32",
        producers: "Vec<ProducerAuthority>",
    },
    ProducerAuthority: {
        producer_name: "ActionName",
        authority: "BlockSigningAuthority",
    },
    BlockSigningAuthority: "(UnsignedInt, BlockSigningAuthorityV0)",
    BlockSigningAuthorityV0: { threshold: "u32", keyWeights: "Vec<KeyWeight>" }, // keys  => keyWeights
    KeyWeight: { key: "PublicKey", weight: "u16" },
};

const bridgeIost = {
    IostAction: { contract: "Vec<u8>", action_name: "Vec<u8>", data: "Vec<u8>" },
    IostMultiSigTx: {
        chain_id: "i32",
        raw_tx: "Vec<u8>",
        multi_sig: "MultiSig",
        action: "IostAction",
        from: "AccountId",
        asset_id: "AssetId",
    },
    Processing: { tx_id: "Vec<u8>", multi_sig_tx: "IostMultiSigTx" },
    IostTxOut: {
        _enum: {
            Initial: "IostMultiSigTx",
            Generated: "IostMultiSigTx",
            Signed: "IostMultiSigTx",
            Processing: "Processing",
            Success: "Vec<u8>",
            Fail: "Failed",
        },
    },
};

const flexibleFee = {
    PalletBalanceOf: "Balance",
    ExtraFeeName: {
        _enum: ["SalpContribute", "NoExtraFee"],
    },
};

const minterReward = {
    IsExtended: "bool",
    SystemPalletId: "PalletId",
};

const salp = {
    TrieIndex: "u32",
    FundInfo: {
        raised: "Balance",
        cap: "Balance",
        first_slot: "LeasePeriod",
        last_slot: "LeasePeriod",
        trie_index: "TrieIndex",
        status: "FundStatus",
    },
    RedeemStatus: "BalanceOf",
    FundStatus: {
        _enum: [
            "Ongoing",
            "Retired",
            "Success",
            "Failed",
            "RefundWithdrew",
            "RedeemWithdrew",
            "End",
        ],
    },
    ContributionStatus: {
        _enum: [
            "Idle",
            "Refunded",
            "Redeemed",
            "Unlocked",
            "MigratedIdle",
            "Contributing",
        ],
    },
    CrowdloanContributeCall: {
        _enum: {
            CrowdloanContribute: "ContributeCall",
        },
    },
    ContributeCall: {
        _enum: {
            Contribute: "Contribution",
        },
    },
    Contribution: {
        index: "ParaId",
        value: "BalanceOf",
        signature: "Option<MultiSignature>",
    },
    Withdraw: {
        who: "AccountIdOf",
        index: "ParaId",
    },
    WithdrawCall: {
        _enum: {
            Withdraw: "Withdraw",
        },
    },
    ParachainTransactProxyType: {
        _enum: ["Primary", "Derived"],
    },
    ParachainDerivedProxyAccountType: {
        _enum: ["Salp", "Staking"],
    },
    Keys: "SessionKeys1",
    ParachainTransactType: {
        _enum: ["Xcm", "Proxy"],
    },
    RpcContributionStatus: {
        _enum: ["Idle", "Contributing", "Refunded", "Unlocked", "Redeemed"],
    },
};

const stakingReward = {
    RewardRecord: {
        account_id: "AccountId",
        record_amount: "Balance",
    },
};

const swap = {
    PoolId: "u32",
    SwapFee: "u128",
    PoolDetails: { owner: "AccountId", swap_fee_rate: "SwapFee", active: "bool" },
    PoolWeight: "Balance",
    PoolToken: "u128",
    PoolCreateTokenDetails: {
        token_id: "AssetId",
        token_balance: "Balance",
        token_weight: "PoolWeight",
    },
};

const tokens = {
    OrmlAccountData: {
        free: "Balance",
        reserved: "Balance",
        frozen: "Balance",
    },
};

const vesting = {
    MaxLocksOf: "u32",
    BifrostVestingInfo: {
        locked: "Balance",
        per_block: "Balance",
        starting_block: "BlockNumber",
    },
};

const runtime = {
    OracleKey: "CurrencyId",
    OracleValue: "Price",
    BlockNumberFor: "BlockNumber",
};

const vsBondAuction = {
    OrderInfo: {
        owner: "AccountIdOf",
        vsbond: "CurrencyId",
        amount: "BalanceOf",
        remain: "BalanceOf",
        total_price: "BalanceOf",
        order_id: "OrderId",
        order_type: "OrderType",
        remain_price: "BalanceOf",
    },
    OrderId: "u64",
    OrderType: {
        _enum: ["Sell", "Buy"],
    },
};

const zenlinkProtocol = {
    ZenlinkAssetId: {
        chain_id: "u32",
        asset_type: "u8",
        asset_index: "u64",
    },
    ZenlinkAssetBalance: "u128",
    PairInfo: {
        asset0: "ZenlinkAssetId",
        asset1: "ZenlinkAssetId",
        account: "AccountId",
        totalLiquidity: "ZenlinkAssetBalance",
        holdingLiquidity: "ZenlinkAssetBalance",
        reserve0: "ZenlinkAssetBalance",
        reserve1: "ZenlinkAssetBalance",
        lpAssetId: "ZenlinkAssetId",
    },
    PairMetadata: {
        pair_account: "AccountId",
        target_supply: "ZenlinkAssetBalance",
    },
    BootstrapParamter: {
        min_contribution: "(ZenlinkAssetBalance, ZenlinkAssetBalance)",
        target_supply: "(ZenlinkAssetBalance, ZenlinkAssetBalance)",
        accumulated_supply: "(ZenlinkAssetBalance, ZenlinkAssetBalance)",
        end_block_number: "BlockNumber",
        pair_account: "AccountId",
    },
    PairStatus: {
        _enum: {
            Trading: "PairMetadata",
            Bootstrap: "BootstrapParamter",
            Disable: null,
        },
    },
};

const primitives = {
    CurrencyId: {
        _enum: {
            Native: "TokenSymbol",
            VToken: "TokenSymbol",
            Token: "TokenSymbol",
            Stable: "TokenSymbol",
            VSToken: "TokenSymbol",
            VSBond: "(TokenSymbol, ParaId, LeasePeriod, LeasePeriod)",
            LPToken: "(TokenSymbol, u8, TokenSymbol, u8)",
        },
    },
    CurrencyIdOf: "CurrencyId",
    TAssetBalance: "Balance",
    AmountOf: "Balance",
    StorageVersion: "Releases",
    ShareWeight: "Balance",
    Currency: "CurrencyIdOf",
    Amount: "AmountOf",
    NodePrimitivesCurrencyCurrencyId: "CurrencyId",
    OrmlTokensBalanceLock: "BalanceLock",
    OrmlTokensAccountData: "OrmlAccountData",
    TransferOriginType: {
        _enum: ["FromSelf", "FromRelayChain", "FromSiblingParaChain"],
    },
    Nonce: "u64",
};

const liquidityMining = {
    PoolId: "u32",
    PoolInfo: {
        pool_id: "PoolId",
        keeper: "AccountId",
        investor: "Option<AccountId>",
        trading_pair: "(CurrencyId, CurrencyId)",
        duration: "BlockNumber",
        type: "PoolType",
        min_deposit_to_start: "Balance",
        after_block_to_start: "BlockNumber",
        deposit: "Balance",
        rewards: "BTreeMap<CurrencyId, RewardData>",
        update_b: "BlockNumber",
        state: "PoolState",
        block_startup: "Option<BlockNumber>",
        redeem_limit_time: "BlockNumber",
        unlock_limit_nums: "u32",
        pending_unlock_nums: "u32",
    },
    PoolType: {
        _enum: ["Mining", "Farming", "EBFarming"],
    },
    PoolState: {
        _enum: ["UnCharged", "Charged", "Ongoing", "Retired", "Dead"],
    },
    DepositData: {
        deposit: "Balance",
        gain_avgs: "BTreeMap<CurrencyId, FixedU128>",
        update_b: "BlockNumber",
        pending_unlocks: "Vec<(BlockNumber, Balance)>",
    },
    RewardData: {
        total: "Balance",
        per_block: "Balance",
        claimed: "Balance",
        gain_avg: "FixedU128",
    },
};

const TokenSymbol = {
    _enum: ["ASG", "BNC", "KUSD", "DOT", "KSM", "KAR", "ZLK", "PHA", "RMRK"],
};

const xcmV0 = {
    MultiAsset: "MultiAssetV0",
    Xcm: "XcmV0",
    XcmOrder: "XcmOrderV0",
    MultiLocation: "MultiLocationV0",
    XcmError: "XcmErrorV0",
    Response: "ResponseV0",
};

const xcmV1 = {
    MultiAsset: "MultiAssetV1",
    Xcm: "XcmV1",
    XcmOrder: "XcmOrderV1",
    MultiLocation: "MultiLocationV1",
    XcmError: "XcmErrorV1",
    Response: "ResponseV1",
};

export const bundle: OldTypesBundle = {
    types: {
        ...ormlTypes,
        ...bancor,
        ...bid,
        ...bridgeEos,
        ...bridgeIost,
        ...flexibleFee,
        ...minterReward,
        ...salp,
        ...stakingReward,
        ...swap,
        ...tokens,
        ...vesting,
        ...runtime,
        ...vsBondAuction,
        ...zenlinkProtocol,
        ...primitives,
        ...liquidityMining,
        Keys: "SessionKeys1",
    },
    typesAlias: {
        ...ormlAlias,
        zenlinkProtocol: {
            AssetBalance: "U128",
        },
    },
    versions: [
        {
            minmax: [0, 901],
            types: {
                TokenSymbol,
                ...xcmV0,
            },
        },
        {
            minmax: [902, null],
            types: {
                TokenSymbol,
                ...xcmV1,
            },
        },
    ],
};
