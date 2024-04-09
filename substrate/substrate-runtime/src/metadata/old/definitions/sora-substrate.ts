import {OldTypesBundle} from "../types"


export const bundle: OldTypesBundle = {
    versions: [
        {
            minmax: [
                1,
                32
            ],
            types: {
                String: "Text",
                FixedU128: "u128",
                U256: "u256",
                Sr25519Public: "[u8; 32]",
                SessionKeys2: "(Sr25519Public, Sr25519Public)",
                SessionKeys3: "(Sr25519Public, Sr25519Public, Sr25519Public)",
                Address: "AccountId",
                Amount: "i128",
                AmountOf: "Amount",
                AssetId32: "[u8; 32]",
                AssetId: "AssetId32",
                AssetIdOf: "AssetId",
                AssetInfo: {
                    assetId: "AssetId",
                    symbol: "AssetSymbolStr",
                    name: "AssetNameStr",
                    precision: "u8",
                    isMintable: "bool"
                },
                AssetKind: {
                    _enum: [
                        "Thischain",
                        "Sidechain",
                        "SidechainOwned"
                    ]
                },
                AssetName: "Vec<u8>",
                AssetNameStr: "String",
                AssetRecord: "Null",
                AssetSymbol: "Vec<u8>",
                AssetSymbolStr: "String",
                Balance: "u128",
                BalanceInfo: {
                    balance: "Balance"
                },
                BalancePrecision: "u8",
                BasisPoints: "u16",
                NetworkId: "BridgeNetworkId",
                BridgeNetworkId: "u32",
                BridgeStatus: {
                    _enum: [
                        "Initialized",
                        "Migrating"
                    ]
                },
                BridgeTimepoint: {
                    height: "MultiChainHeight",
                    index: "u32"
                },
                ChangePeersContract: {
                    _enum: [
                        "XOR",
                        "VAL"
                    ]
                },
                ChargeFeeInfo: {
                    tip: "Compact<Balance>",
                    targetAssetId: "AssetId"
                },
                ContentSource: "Text",
                ContributionInfo: {
                    fundsContributed: "Balance",
                    tokensBought: "Balance",
                    tokensClaimed: "Balance",
                    claimingFinished: "bool",
                    numberOfClaims: "u32"
                },
                CurrencyId: "AssetId",
                CurrencyIdEncoded: {
                    _enum: {
                        AssetId: "H256",
                        TokenAddress: "H160"
                    }
                },
                CurrencyIdOf: "AssetId",
                CustomInfo: {
                    amount: "Balance"
                },
                DEXId: "u32",
                DEXIdOf: "DEXId",
                DEXInfo: {
                    baseAssetId: "AssetId",
                    defaultFee: "BasisPoints",
                    defaultProtocolFee: "BasisPoints"
                },
                Description: "Text",
                DispatchErrorWithPostInfoTPostDispatchInfo: {
                    postInfo: "PostDispatchInfo",
                    error: "DispatchError"
                },
                DispatchResultWithPostInfo: {
                    _enum: {
                        Ok: "PostDispatchInfo",
                        Err: "DispatchErrorWithPostInfoTPostDispatchInfo"
                    }
                },
                DistributionAccounts: "Null",
                Duration: "Null",
                EthBridgeStorageVersion: {
                    _enum: [
                        "V1",
                        "V2RemovePendingTransfers"
                    ]
                },
                EthPeersSync: {
                    isBridgeReady: "bool",
                    isXorReady: "bool",
                    isValReady: "bool"
                },
                Farm: "Null",
                FarmId: "u64",
                Farmer: "Null",
                FilterMode: {
                    _enum: [
                        "Disabled",
                        "ForbidSelected",
                        "AllowSelected"
                    ]
                },
                Fixed: "FixedU128",
                FixedBytes: "Vec<u8>",
                HolderId: "AccountId",
                ILOInfo: {
                    iloOrganizer: "AccountId",
                    tokensForIlo: "Balance",
                    tokensForLiquidity: "Balance",
                    iloPrice: "Balance",
                    softCap: "Balance",
                    hardCap: "Balance",
                    minContribution: "Balance",
                    maxContribution: "Balance",
                    refundType: "bool",
                    liquidityPercent: "Balance",
                    listingPrice: "Balance",
                    lockupDays: "u32",
                    startBlock: "BlockNumber",
                    endBlock: "BlockNumber",
                    tokenVesting: "VestingInfo",
                    soldTokens: "Balance",
                    fundsRaised: "Balance",
                    succeeded: "bool",
                    failed: "bool",
                    lpTokens: "Balance",
                    claimedLpTokens: "bool",
                    finishBlock: "BlockNumber"
                },
                IncomingAddToken: {
                    tokenAddress: "EthereumAddress",
                    assetId: "AssetId",
                    precision: "BalancePrecision",
                    symbol: "AssetSymbol",
                    name: "AssetName",
                    author: "AccountId",
                    txHash: "H256",
                    atHeight: "u64",
                    timepoint: "BridgeTimepoint",
                    networkId: "BridgeNetworkId"
                },
                IncomingCancelOutgoingRequest: {
                    outgoingRequest: "OutgoingRequest",
                    outgoingRequestHash: "H256",
                    initialRequestHash: "H256",
                    txInput: "Vec<u8>",
                    author: "AccountId",
                    txHash: "H256",
                    atHeight: "u64",
                    timepoint: "BridgeTimepoint",
                    networkId: "BridgeNetworkId"
                },
                IncomingChangePeers: {
                    peerAccountId: "AccountId",
                    peerAddress: "EthereumAddress",
                    added: "bool",
                    author: "AccountId",
                    txHash: "H256",
                    atHeight: "u64",
                    timepoint: "BridgeTimepoint",
                    networkId: "BridgeNetworkId"
                },
                IncomingChangePeersCompat: {
                    peerAccountId: "AccountId",
                    peerAddress: "EthereumAddress",
                    added: "bool",
                    contract: "ChangePeersContract",
                    author: "AccountId",
                    txHash: "H256",
                    atHeight: "u64",
                    timepoint: "BridgeTimepoint",
                    networkId: "BridgeNetworkId"
                },
                IncomingMarkAsDoneRequest: {
                    outgoingRequestHash: "H256",
                    initialRequestHash: "H256",
                    author: "AccountId",
                    atHeight: "u64",
                    timepoint: "BridgeTimepoint",
                    networkId: "BridgeNetworkId"
                },
                IncomingMetaRequestKind: {
                    _enum: [
                        "CancelOutgoingRequest",
                        "MarkAsDone"
                    ]
                },
                IncomingMigrate: {
                    newContractAddress: "EthereumAddress",
                    author: "AccountId",
                    txHash: "H256",
                    atHeight: "u64",
                    timepoint: "BridgeTimepoint",
                    networkId: "BridgeNetworkId"
                },
                IncomingPrepareForMigration: {
                    author: "AccountId",
                    txHash: "H256",
                    atHeight: "u64",
                    timepoint: "BridgeTimepoint",
                    networkId: "BridgeNetworkId"
                },
                IncomingRequest: {
                    _enum: {
                        Transfer: "IncomingTransfer",
                        AddToken: "IncomingAddToken",
                        ChangePeers: "IncomingChangePeers",
                        CancelOutgoingRequest: "IncomingCancelOutgoingRequest",
                        MarkAsDone: "IncomingMarkAsDoneRequest",
                        PrepareForMigration: "IncomingPrepareForMigration",
                        Migrate: "IncomingMigrate"
                    }
                },
                IncomingRequestKind: {
                    _enum: {
                        Transaction: "IncomingTransactionRequestKind",
                        Meta: "IncomingMetaRequestKind"
                    }
                },
                IncomingTransactionRequestKind: {
                    _enum: [
                        "Transfer",
                        "AddAsset",
                        "AddPeer",
                        "RemovePeer",
                        "PrepareForMigration",
                        "Migrate",
                        "AddPeerCompat",
                        "RemovePeerCompat",
                        "TransferXOR"
                    ]
                },
                IncomingTransfer: {
                    from: "EthereumAddress",
                    to: "AccountId",
                    assetId: "AssetId",
                    assetKind: "AssetKind",
                    amount: "Balance",
                    author: "AccountId",
                    txHash: "H256",
                    atHeight: "u64",
                    timepoint: "BridgeTimepoint",
                    networkId: "BridgeNetworkId"
                },
                Keys: "SessionKeys3",
                LPRewardsInfo: {
                    amount: "Balance",
                    currency: "AssetId",
                    reason: "RewardReason"
                },
                LPSwapOutcomeInfo: {
                    amount: "Balance",
                    fee: "Balance",
                    rewards: "Vec<LPRewardsInfo>",
                    amountWithoutImpact: "Balance"
                },
                LiquiditySourceType: {
                    _enum: [
                        "XYKPool",
                        "BondingCurvePool",
                        "MulticollateralBondingCurvePool",
                        "MockPool",
                        "MockPool2",
                        "MockPool3",
                        "MockPool4",
                        "XSTPool"
                    ]
                },
                LoadIncomingMetaRequest: {
                    author: "AccountId",
                    hash: "H256",
                    timepoint: "BridgeTimepoint",
                    kind: "IncomingMetaRequestKind",
                    networkId: "BridgeNetworkId"
                },
                LoadIncomingRequest: {
                    _enum: {
                        Transaction: "LoadIncomingTransactionRequest",
                        Meta: "(LoadIncomingMetaRequest, H256)"
                    }
                },
                LoadIncomingTransactionRequest: {
                    author: "AccountId",
                    hash: "H256",
                    timepoint: "BridgeTimepoint",
                    kind: "IncomingTransactionRequestKind",
                    networkId: "BridgeNetworkId"
                },
                LockInfo: {
                    poolTokens: "Balance",
                    unlockingBlock: "BlockNumber",
                    assetA: "AssetId",
                    assetB: "AssetId"
                },
                LookupSource: "AccountId",
                MarketMakerInfo: {
                    count: "u32",
                    volume: "Balance"
                },
                Mode: {
                    _enum: [
                        "Permit",
                        "Forbid"
                    ]
                },
                MultiChainHeight: {
                    _enum: {
                        Thischain: "BlockNumber",
                        Sidechain: "u64"
                    }
                },
                MultiCurrencyBalance: "Balance",
                MultiCurrencyBalanceOf: "MultiCurrencyBalance",
                MultisigAccount: {
                    signatories: "Vec<AccountId>",
                    threshold: "u8"
                },
                OffchainRequest: {
                    _enum: {
                        Outgoing: "(OutgoingRequest, H256)",
                        LoadIncoming: "LoadIncomingRequest",
                        Incoming: "(IncomingRequest, H256)"
                    }
                },
                OracleKey: "AssetId",
                OutgoingAddAsset: {
                    author: "AccountId",
                    assetId: "AssetId",
                    supply: "Balance",
                    nonce: "Index",
                    networkId: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingAddAssetEncoded: {
                    name: "String",
                    symbol: "String",
                    decimal: "u8",
                    supply: "U256",
                    sidechainAssetId: "FixedBytes",
                    hash: "H256",
                    networkId: "H256",
                    raw: "Vec<u8>"
                },
                OutgoingAddPeer: {
                    author: "AccountId",
                    peerAddress: "EthereumAddress",
                    peerAccountId: "AccountId",
                    nonce: "Index",
                    networkId: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingAddPeerCompat: {
                    author: "AccountId",
                    peerAddress: "EthereumAddress",
                    peerAccountId: "AccountId",
                    nonce: "Index",
                    networkId: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingAddPeerEncoded: {
                    peerAddress: "EthereumAddress",
                    txHash: "H256",
                    networkId: "H256",
                    raw: "Vec<u8>"
                },
                OutgoingAddToken: {
                    author: "AccountId",
                    tokenAddress: "EthereumAddress",
                    ticker: "String",
                    name: "String",
                    decimals: "u8",
                    nonce: "Index",
                    networkId: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingAddTokenEncoded: {
                    tokenAddress: "EthereumAddress",
                    ticker: "String",
                    name: "String",
                    decimals: "u8",
                    hash: "H256",
                    networkId: "H256",
                    raw: "Vec<u8>"
                },
                OutgoingMigrate: {
                    author: "AccountId",
                    newContractAddress: "EthereumAddress",
                    erc20NativeTokens: "Vec<EthereumAddress>",
                    nonce: "Index",
                    networkId: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingMigrateEncoded: {
                    thisContractAddress: "EthereumAddress",
                    txHash: "H256",
                    newContractAddress: "EthereumAddress",
                    erc20NativeTokens: "Vec<EthereumAddress>",
                    networkId: "H256",
                    raw: "Vec<u8>"
                },
                OutgoingPrepareForMigration: {
                    author: "AccountId",
                    nonce: "Index",
                    networkId: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingPrepareForMigrationEncoded: {
                    thisContractAddress: "EthereumAddress",
                    txHash: "H256",
                    networkId: "H256",
                    raw: "Vec<u8>"
                },
                OutgoingRemovePeer: {
                    author: "AccountId",
                    peerAccountId: "AccountId",
                    peerAddress: "EthereumAddress",
                    nonce: "Index",
                    networkId: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingRemovePeerCompat: {
                    author: "AccountId",
                    peerAccountId: "AccountId",
                    peerAddress: "EthereumAddress",
                    nonce: "Index",
                    networkId: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingRemovePeerEncoded: {
                    peerAddress: "EthereumAddress",
                    txHash: "H256",
                    networkId: "H256",
                    raw: "Vec<u8>"
                },
                OutgoingRequest: {
                    _enum: {
                        Transfer: "OutgoingTransfer",
                        AddAsset: "OutgoingAddAsset",
                        AddToken: "OutgoingAddToken",
                        AddPeer: "OutgoingAddPeer",
                        RemovePeer: "OutgoingRemovePeer",
                        PrepareForMigration: "OutgoingPrepareForMigration",
                        Migrate: "OutgoingMigrate"
                    }
                },
                OutgoingRequestEncoded: {
                    _enum: {
                        Transfer: "OutgoingTransferEncoded",
                        AddAsset: "OutgoingAddAssetEncoded",
                        AddToken: "OutgoingAddTokenEncoded",
                        AddPeer: "OutgoingAddPeerEncoded",
                        RemovePeer: "OutgoingRemovePeerEncoded",
                        PrepareForMigration: "OutgoingPrepareForMigrationEncoded",
                        Migrate: "OutgoingMigrateEncoded"
                    }
                },
                OutgoingTransfer: {
                    from: "AccountId",
                    to: "EthereumAddress",
                    assetId: "AssetId",
                    amount: "Balance",
                    nonce: "Index",
                    networkId: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingTransferEncoded: {
                    currencyId: "CurrencyIdEncoded",
                    amount: "U256",
                    to: "EthereumAddress",
                    from: "EthereumAddress",
                    txHash: "H256",
                    networkId: "H256",
                    raw: "Vec<u8>"
                },
                OwnerId: "AccountId",
                PendingMultisigAccount: {
                    approvingAccounts: "Vec<AccountId>",
                    migrateAt: "Option<BlockNumber>"
                },
                Permission: "Null",
                PermissionId: "u32",
                PollInfo: {
                    numberOfOptions: "u32",
                    pollStartBlock: "BlockNumber",
                    pollEndBlock: "BlockNumber"
                },
                PoolFarmer: {
                    account: "AccountId",
                    block: "BlockNumber",
                    weight: "Balance"
                },
                PostDispatchInfo: {
                    actualWeight: "Option<Weight>",
                    paysFee: "Pays"
                },
                PredefinedAssetId: {
                    _enum: [
                        "XOR",
                        "DOT",
                        "KSM",
                        "USDT",
                        "VAL",
                        "PSWAP",
                        "DAI",
                        "ETH",
                        "XSTUSD"
                    ]
                },
                PriceInfo: {
                    priceFailures: "u32",
                    spotPrices: "Vec<Balance>",
                    averagePrice: "Balance",
                    needsUpdate: "bool",
                    lastSpotPrice: "Balance"
                },
                Public: "[u8; 33]",
                QuoteAmount: {
                    _enum: {
                        WithDesiredInput: "QuoteWithDesiredInput",
                        WithDesiredOutput: "QuoteWithDesiredOutput"
                    }
                },
                QuoteWithDesiredInput: {
                    desiredAmountIn: "Balance"
                },
                QuoteWithDesiredOutput: {
                    desiredAmountOut: "Balance"
                },
                RefCount: "u32",
                RequestStatus: {
                    _enum: [
                        "Pending",
                        "Frozen",
                        "ApprovalsReady",
                        "Failed",
                        "Done"
                    ]
                },
                RewardInfo: {
                    limit: "Balance",
                    totalAvailable: "Balance",
                    rewards: "BTreeMap<RewardReason, Balance>"
                },
                RewardReason: {
                    _enum: [
                        "Unspecified",
                        "BuyOnBondingCurve",
                        "LiquidityProvisionFarming",
                        "MarketMakerVolume"
                    ]
                },
                Scope: {
                    _enum: {
                        Limited: "H512",
                        Unlimited: "Null"
                    }
                },
                SignatureParams: {
                    r: "[u8; 32]",
                    s: "[u8; 32]",
                    v: "u8"
                },
                SmoothPriceState: "Null",
                StakingInfo: {
                    deposited: "Balance",
                    rewards: "Balance"
                },
                StorageVersion: "Null",
                SwapAction: "Null",
                SwapAmount: {
                    _enum: {
                        WithDesiredInput: "SwapWithDesiredInput",
                        WithDesiredOutput: "SwapWithDesiredOutput"
                    }
                },
                SwapOutcome: {
                    amount: "Balance",
                    fee: "Balance"
                },
                SwapOutcomeInfo: {
                    amount: "Balance",
                    fee: "Balance"
                },
                SwapVariant: {
                    _enum: [
                        "WithDesiredInput",
                        "WithDesiredOutput"
                    ]
                },
                SwapWithDesiredInput: {
                    desiredAmountIn: "Balance",
                    minAmountOut: "Balance"
                },
                SwapWithDesiredOutput: {
                    desiredAmountOut: "Balance",
                    maxAmountIn: "Balance"
                },
                TAssetBalance: "Balance",
                TP: "TradingPair",
                TechAccountId: {
                    _enum: {
                        Pure: "(DEXId, TechPurpose)",
                        Generic: "(Vec<u8>, Vec<u8>)",
                        Wrapped: "AccountId",
                        WrappedRepr: "AccountId"
                    }
                },
                TechAmount: "Amount",
                TechAssetId: {
                    _enum: {
                        Wrapped: "PredefinedAssetId",
                        Escaped: "AssetId"
                    }
                },
                TechBalance: "Balance",
                TechPurpose: {
                    _enum: {
                        FeeCollector: "Null",
                        FeeCollectorForPair: "TechTradingPair",
                        LiquidityKeeper: "TechTradingPair",
                        Identifier: "Vec<u8>"
                    }
                },
                TechTradingPair: {
                    baseAssetId: "TechAssetId",
                    targetAssetId: "TechAssetId"
                },
                TokenLockInfo: {
                    tokens: "Balance",
                    unlockingBlock: "BlockNumber",
                    assetId: "AssetId"
                },
                TradingPair: {
                    baseAssetId: "AssetId",
                    targetAssetId: "AssetId"
                },
                ValidationFunction: "Null",
                "BTreeMap<RewardReason,Balance>": "Vec<(RewardReason,Balance)>",
                "BTreeSet<SignatureParams>": "Vec<SignatureParams>",
                "BTreeSet<H256>": "Vec<H256>",
                "BTreeSet<AssetId>": "Vec<AssetId>",
                "BTreeSet<AssetIdOf>": "Vec<AssetIdOf>",
                "BTreeSet<AccountId>": "Vec<AccountId>",
                "BTreeSet<LiquiditySourceType>": "Vec<LiquiditySourceType>",
                "ecdsa::Public": "[u8; 33]",
                "Result<IncomingRequest, DispatchError>": {
                    _enum: {
                        Ok: "IncomingRequest",
                        Err: "DispatchError"
                    }
                },
                VotingInfo: {
                    votingOption: "u32",
                    numberOfVotes: "Balance",
                    ceresWithdrawn: "bool"
                }
            }
        },
        {
            minmax: [
                33,
                34
            ],
            types: {
                ContributorsVesting: {
                    firstReleasePercent: "Balance",
                    vestingPeriod: "BlockNumber",
                    vestingPercent: "Balance"
                },
                CrowdloanLease: {
                    startBlock: "String",
                    totalDays: "String",
                    blocksPerDay: "String"
                },
                CrowdloanReward: {
                    id: "Vec<u8>",
                    address: "Vec<u8>",
                    contribution: "Fixed",
                    xorReward: "Fixed",
                    valReward: "Fixed",
                    pswapReward: "Fixed",
                    xstusdReward: "Fixed",
                    percent: "Fixed"
                },
                EthAddress: "H160",
                ILOInfo: {
                    iloOrganizer: "AccountId",
                    tokensForIlo: "Balance",
                    tokensForLiquidity: "Balance",
                    iloPrice: "Balance",
                    softCap: "Balance",
                    hardCap: "Balance",
                    minContribution: "Balance",
                    maxContribution: "Balance",
                    refundType: "bool",
                    liquidityPercent: "Balance",
                    listingPrice: "Balance",
                    lockupDays: "u32",
                    startBlock: "BlockNumber",
                    endBlock: "BlockNumber",
                    contributorsVesting: "ContributorsVesting",
                    teamVesting: "TeamVesting",
                    soldTokens: "Balance",
                    fundsRaised: "Balance",
                    succeeded: "bool",
                    failed: "bool",
                    lpTokens: "Balance",
                    claimedLpTokens: "bool",
                    finishBlock: "BlockNumber"
                },
                IncomingAddToken: {
                    tokenAddress: "EthAddress",
                    assetId: "AssetId",
                    precision: "BalancePrecision",
                    symbol: "AssetSymbol",
                    name: "AssetName",
                    author: "AccountId",
                    txHash: "H256",
                    atHeight: "u64",
                    timepoint: "BridgeTimepoint",
                    networkId: "BridgeNetworkId"
                },
                IncomingChangePeers: {
                    peerAccountId: "AccountId",
                    peerAddress: "EthAddress",
                    added: "bool",
                    author: "AccountId",
                    txHash: "H256",
                    atHeight: "u64",
                    timepoint: "BridgeTimepoint",
                    networkId: "BridgeNetworkId"
                },
                IncomingChangePeersCompat: {
                    peerAccountId: "AccountId",
                    peerAddress: "EthAddress",
                    added: "bool",
                    contract: "ChangePeersContract",
                    author: "AccountId",
                    txHash: "H256",
                    atHeight: "u64",
                    timepoint: "BridgeTimepoint",
                    networkId: "BridgeNetworkId"
                },
                IncomingMigrate: {
                    newContractAddress: "EthAddress",
                    author: "AccountId",
                    txHash: "H256",
                    atHeight: "u64",
                    timepoint: "BridgeTimepoint",
                    networkId: "BridgeNetworkId"
                },
                IncomingTransfer: {
                    from: "EthAddress",
                    to: "AccountId",
                    assetId: "AssetId",
                    assetKind: "AssetKind",
                    amount: "Balance",
                    author: "AccountId",
                    txHash: "H256",
                    atHeight: "u64",
                    timepoint: "BridgeTimepoint",
                    networkId: "BridgeNetworkId"
                },
                OutgoingAddPeer: {
                    author: "AccountId",
                    peerAddress: "EthAddress",
                    peerAccountId: "AccountId",
                    nonce: "Index",
                    networkId: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingAddPeerCompat: {
                    author: "AccountId",
                    peerAddress: "EthAddress",
                    peerAccountId: "AccountId",
                    nonce: "Index",
                    networkId: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingAddPeerEncoded: {
                    peerAddress: "EthAddress",
                    txHash: "H256",
                    networkId: "H256",
                    raw: "Vec<u8>"
                },
                OutgoingAddToken: {
                    author: "AccountId",
                    tokenAddress: "EthAddress",
                    ticker: "String",
                    name: "String",
                    decimals: "u8",
                    nonce: "Index",
                    networkId: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingAddTokenEncoded: {
                    tokenAddress: "EthAddress",
                    ticker: "String",
                    name: "String",
                    decimals: "u8",
                    hash: "H256",
                    networkId: "H256",
                    raw: "Vec<u8>"
                },
                OutgoingMigrate: {
                    author: "AccountId",
                    newContractAddress: "EthAddress",
                    erc20NativeTokens: "Vec<EthAddress>",
                    nonce: "Index",
                    networkId: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingMigrateEncoded: {
                    thisContractAddress: "EthAddress",
                    txHash: "H256",
                    newContractAddress: "EthAddress",
                    erc20NativeTokens: "Vec<EthAddress>",
                    networkId: "H256",
                    raw: "Vec<u8>"
                },
                OutgoingPrepareForMigrationEncoded: {
                    thisContractAddress: "EthAddress",
                    txHash: "H256",
                    networkId: "H256",
                    raw: "Vec<u8>"
                },
                OutgoingRemovePeer: {
                    author: "AccountId",
                    peerAccountId: "AccountId",
                    peerAddress: "EthAddress",
                    nonce: "Index",
                    networkId: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingRemovePeerCompat: {
                    author: "AccountId",
                    peerAccountId: "AccountId",
                    peerAddress: "EthAddress",
                    nonce: "Index",
                    networkId: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingRemovePeerEncoded: {
                    peerAddress: "EthAddress",
                    txHash: "H256",
                    networkId: "H256",
                    raw: "Vec<u8>"
                },
                OutgoingTransfer: {
                    from: "AccountId",
                    to: "EthAddress",
                    assetId: "AssetId",
                    amount: "Balance",
                    nonce: "Index",
                    networkId: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingTransferEncoded: {
                    currencyId: "CurrencyIdEncoded",
                    amount: "U256",
                    to: "EthAddress",
                    from: "EthAddress",
                    txHash: "H256",
                    networkId: "H256",
                    raw: "Vec<u8>"
                },
                PoolData: {
                    multiplier: "u32",
                    depositFee: "Balance",
                    isCore: "bool",
                    isFarm: "bool",
                    totalTokensInPool: "Balance",
                    rewards: "Balance",
                    rewardsToBeDistributed: "Balance",
                    isRemoved: "bool"
                },
                TeamVesting: {
                    teamVestingTotalTokens: "Balance",
                    teamVestingFirstReleasePercent: "Balance",
                    teamVestingPeriod: "BlockNumber",
                    teamVestingPercent: "Balance"
                },
                TokenInfo: {
                    farmsTotalMultiplier: "u32",
                    stakingTotalMultiplier: "u32",
                    tokenPerBlock: "Balance",
                    farmsAllocation: "Balance",
                    stakingAllocation: "Balance",
                    teamAllocation: "Balance",
                    teamAccount: "AccountId"
                },
                UserInfo: {
                    poolAsset: "AssetId",
                    rewardAsset: "AssetId",
                    isFarm: "bool",
                    pooledTokens: "Balance",
                    rewards: "Balance"
                }
            }
        },
        {
            minmax: [
                35,
                41
            ],
            types: {
                LiquiditySourceIdOf: {
                    dexId: "DEXId",
                    liquiditySourceIndex: "LiquiditySourceType"
                },
                ContributorsVesting: {
                    firstReleasePercent: "Balance",
                    vestingPeriod: "Moment",
                    vestingPercent: "Balance"
                },
                ILOInfo: {
                    iloOrganizer: "AccountId",
                    tokensForIlo: "Balance",
                    tokensForLiquidity: "Balance",
                    iloPrice: "Balance",
                    softCap: "Balance",
                    hardCap: "Balance",
                    minContribution: "Balance",
                    maxContribution: "Balance",
                    refundType: "bool",
                    liquidityPercent: "Balance",
                    listingPrice: "Balance",
                    lockupDays: "u32",
                    startTimestamp: "Moment",
                    endTimestamp: "Moment",
                    contributorsVesting: "ContributorsVesting",
                    teamVesting: "TeamVesting",
                    soldTokens: "Balance",
                    fundsRaised: "Balance",
                    succeeded: "bool",
                    failed: "bool",
                    lpTokens: "Balance",
                    claimedLpTokens: "bool",
                    finishTimestamp: "Moment"
                },
                LockInfo: {
                    poolTokens: "Balance",
                    unlockingTimestamp: "Moment",
                    assetA: "AssetId",
                    assetB: "AssetId"
                },
                PollInfo: {
                    numberOfOptions: "u32",
                    pollStartTimestamp: "Moment",
                    pollEndTimestamp: "Moment"
                },
                TeamVesting: {
                    teamVestingTotalTokens: "Balance",
                    teamVestingFirstReleasePercent: "Balance",
                    teamVestingPeriod: "Moment",
                    teamVestingPercent: "Balance"
                },
                TokenLockInfo: {
                    tokens: "Balance",
                    unlockingTimestamp: "Moment",
                    assetId: "AssetId"
                }
            }
        },
        {
            minmax: [
                42,
                42
            ],
            types: {
                AssetInfo: {
                    assetid: "AssetId",
                    symbol: "AssetSymbolStr",
                    name: "AssetNameStr",
                    precision: "u8",
                    ismintable: "bool"
                },
                AssetName: "Text",
                AssetSymbol: "Text",
                AuxiliaryDigest: {
                    logs: "Vec<AuxiliaryDigestItem>"
                },
                AuxiliaryDigestItem: {
                    _enum: {
                        Commitment: "(EthNetworkId, ChannelId, H256)"
                    }
                },
                BasicChannelMessage: {
                    networkid: "EthNetworkId",
                    target: "H160",
                    nonce: "u64",
                    payload: "Vec<u8>"
                },
                BridgeSignatureVersion: {
                    _enum: [
                        "V1",
                        "V2"
                    ]
                },
                ChannelId: {
                    _enum: {
                        Basic: null,
                        Incentivized: null
                    }
                },
                ContributionInfo: {
                    fundscontributed: "Balance",
                    tokensbought: "Balance",
                    tokensclaimed: "Balance",
                    claimingfinished: "bool",
                    numberofclaims: "u32"
                },
                ContributorsVesting: {
                    firstreleasepercent: "Balance",
                    vestingperiod: "Moment",
                    vestingpercent: "Balance"
                },
                CrowdloanLease: {
                    startblock: "String",
                    totaldays: "String",
                    blocksperday: "String"
                },
                CrowdloanReward: {
                    id: "Vec<u8>",
                    address: "Vec<u8>",
                    contribution: "Fixed",
                    xorreward: "Fixed",
                    valreward: "Fixed",
                    pswapreward: "Fixed",
                    xstusdreward: "Fixed",
                    percent: "Fixed"
                },
                DEXInfo: {
                    baseassetid: "AssetId",
                    defaultfee: "BasisPoints",
                    defaultprotocolfee: "BasisPoints"
                },
                DispatchErrorWithPostInfoTPostDispatchInfo: {
                    postinfo: "PostDispatchInfo",
                    error: "DispatchError"
                },
                EthNetworkId: "U256",
                EthPeersSync: {
                    isbridgeready: "bool",
                    isxorready: "bool",
                    isvalready: "bool"
                },
                ILOInfo: {
                    iloorganizer: "AccountId",
                    tokensforilo: "Balance",
                    tokensforliquidity: "Balance",
                    iloprice: "Balance",
                    softcap: "Balance",
                    hardcap: "Balance",
                    mincontribution: "Balance",
                    maxcontribution: "Balance",
                    refundtype: "bool",
                    liquiditypercent: "Balance",
                    listingprice: "Balance",
                    lockupdays: "u32",
                    starttimestamp: "Moment",
                    endtimestamp: "Moment",
                    contributorsvesting: "ContributorsVesting",
                    teamvesting: "TeamVesting",
                    soldtokens: "Balance",
                    fundsraised: "Balance",
                    succeeded: "bool",
                    failed: "bool",
                    lptokens: "Balance",
                    claimedlptokens: "bool",
                    finishtimestamp: "Moment"
                },
                IncomingAddToken: {
                    tokenaddress: "EthAddress",
                    assetid: "AssetId",
                    precision: "BalancePrecision",
                    symbol: "AssetSymbol",
                    name: "AssetName",
                    author: "AccountId",
                    txhash: "H256",
                    atheight: "u64",
                    timepoint: "BridgeTimepoint",
                    networkid: "BridgeNetworkId"
                },
                IncomingCancelOutgoingRequest: {
                    outgoingrequest: "OutgoingRequest",
                    outgoingrequesthash: "H256",
                    initialrequesthash: "H256",
                    txinput: "Vec<u8>",
                    author: "AccountId",
                    txhash: "H256",
                    atheight: "u64",
                    timepoint: "BridgeTimepoint",
                    networkid: "BridgeNetworkId"
                },
                IncomingChangePeers: {
                    peeraccountid: "AccountId",
                    peeraddress: "EthAddress",
                    added: "bool",
                    author: "AccountId",
                    txhash: "H256",
                    atheight: "u64",
                    timepoint: "BridgeTimepoint",
                    networkid: "BridgeNetworkId"
                },
                IncomingChangePeersCompat: {
                    peeraccountid: "AccountId",
                    peeraddress: "EthAddress",
                    added: "bool",
                    contract: "ChangePeersContract",
                    author: "AccountId",
                    txhash: "H256",
                    atheight: "u64",
                    timepoint: "BridgeTimepoint",
                    networkid: "BridgeNetworkId"
                },
                IncomingMarkAsDoneRequest: {
                    outgoingrequesthash: "H256",
                    initialrequesthash: "H256",
                    author: "AccountId",
                    atheight: "u64",
                    timepoint: "BridgeTimepoint",
                    networkid: "BridgeNetworkId"
                },
                IncomingMigrate: {
                    newcontractaddress: "EthAddress",
                    author: "AccountId",
                    txhash: "H256",
                    atheight: "u64",
                    timepoint: "BridgeTimepoint",
                    networkid: "BridgeNetworkId"
                },
                IncomingPrepareForMigration: {
                    author: "AccountId",
                    txhash: "H256",
                    atheight: "u64",
                    timepoint: "BridgeTimepoint",
                    networkid: "BridgeNetworkId"
                },
                IncomingTransfer: {
                    from: "EthAddress",
                    to: "AccountId",
                    assetid: "AssetId",
                    assetkind: "AssetKind",
                    amount: "Balance",
                    author: "AccountId",
                    txhash: "H256",
                    atheight: "u64",
                    timepoint: "BridgeTimepoint",
                    networkid: "BridgeNetworkId"
                },
                IntentivizedChannelMessage: {
                    networkid: "EthNetworkId",
                    target: "H160",
                    nonce: "u64",
                    fee: "U256",
                    payload: "Vec<u8>"
                },
                LPSwapOutcomeInfo: {
                    amount: "Balance",
                    fee: "Balance",
                    rewards: "Vec<LPRewardsInfo>"
                },
                LiquiditySourceIdOf: {
                    dexid: "DEXId",
                    liquiditysourceindex: "LiquiditySourceType"
                },
                LoadIncomingMetaRequest: {
                    author: "AccountId",
                    hash: "H256",
                    timepoint: "BridgeTimepoint",
                    kind: "IncomingMetaRequestKind",
                    networkid: "BridgeNetworkId"
                },
                LoadIncomingTransactionRequest: {
                    author: "AccountId",
                    hash: "H256",
                    timepoint: "BridgeTimepoint",
                    kind: "IncomingTransactionRequestKind",
                    networkid: "BridgeNetworkId"
                },
                LockInfo: {
                    pooltokens: "Balance",
                    unlockingtimestamp: "Moment",
                    asseta: "AssetId",
                    assetb: "AssetId"
                },
                OutgoingAddAsset: {
                    author: "AccountId",
                    assetid: "AssetId",
                    supply: "Balance",
                    nonce: "Index",
                    networkid: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingAddAssetEncoded: {
                    name: "String",
                    symbol: "String",
                    decimal: "u8",
                    supply: "U256",
                    sidechainassetid: "FixedBytes",
                    hash: "H256",
                    networkid: "H256",
                    raw: "Vec<u8>"
                },
                OutgoingAddPeer: {
                    author: "AccountId",
                    peeraddress: "EthAddress",
                    peeraccountid: "AccountId",
                    nonce: "Index",
                    networkid: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingAddPeerCompat: {
                    author: "AccountId",
                    peeraddress: "EthAddress",
                    peeraccountid: "AccountId",
                    nonce: "Index",
                    networkid: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingAddPeerEncoded: {
                    peeraddress: "EthAddress",
                    txhash: "H256",
                    networkid: "H256",
                    raw: "Vec<u8>"
                },
                OutgoingAddToken: {
                    author: "AccountId",
                    tokenaddress: "EthAddress",
                    ticker: "String",
                    name: "String",
                    decimals: "u8",
                    nonce: "Index",
                    networkid: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingAddTokenEncoded: {
                    tokenaddress: "EthAddress",
                    ticker: "String",
                    name: "String",
                    decimals: "u8",
                    hash: "H256",
                    networkid: "H256",
                    raw: "Vec<u8>"
                },
                OutgoingMigrate: {
                    author: "AccountId",
                    newcontractaddress: "EthAddress",
                    erc20nativetokens: "Vec<EthAddress>",
                    nonce: "Index",
                    networkid: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingMigrateEncoded: {
                    thiscontractaddress: "EthAddress",
                    txhash: "H256",
                    newcontractaddress: "EthAddress",
                    erc20nativetokens: "Vec<EthAddress>",
                    networkid: "H256",
                    raw: "Vec<u8>"
                },
                OutgoingPrepareForMigration: {
                    author: "AccountId",
                    nonce: "Index",
                    networkid: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingPrepareForMigrationEncoded: {
                    thiscontractaddress: "EthAddress",
                    txhash: "H256",
                    networkid: "H256",
                    raw: "Vec<u8>"
                },
                OutgoingRemovePeer: {
                    author: "AccountId",
                    peeraccountid: "AccountId",
                    peeraddress: "EthAddress",
                    nonce: "Index",
                    networkid: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingRemovePeerCompat: {
                    author: "AccountId",
                    peeraccountid: "AccountId",
                    peeraddress: "EthAddress",
                    nonce: "Index",
                    networkid: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingRemovePeerEncoded: {
                    peeraddress: "EthAddress",
                    txhash: "H256",
                    networkid: "H256",
                    raw: "Vec<u8>"
                },
                OutgoingTransfer: {
                    from: "AccountId",
                    to: "EthAddress",
                    assetid: "AssetId",
                    amount: "Balance",
                    nonce: "Index",
                    networkid: "BridgeNetworkId",
                    timepoint: "BridgeTimepoint"
                },
                OutgoingTransferEncoded: {
                    currencyid: "CurrencyIdEncoded",
                    amount: "U256",
                    to: "EthAddress",
                    from: "EthAddress",
                    txhash: "H256",
                    networkid: "H256",
                    raw: "Vec<u8>"
                },
                PendingMultisigAccount: {
                    approvingaccounts: "Vec<AccountId>",
                    migrateat: "Option<BlockNumber>"
                },
                PollInfo: {
                    numberofoptions: "u32",
                    pollstarttimestamp: "Moment",
                    pollendtimestamp: "Moment"
                },
                PoolData: {
                    multiplier: "u32",
                    depositfee: "Balance",
                    iscore: "bool",
                    isfarm: "bool",
                    totaltokensinpool: "Balance",
                    rewards: "Balance",
                    rewardstobedistributed: "Balance",
                    isremoved: "bool"
                },
                PostDispatchInfo: {
                    actualweight: "Option<Weight>",
                    paysfee: "Pays"
                },
                PredefinedAssetId: {
                    _enum: [
                        "XOR",
                        "DOT",
                        "KSM",
                        "USDT",
                        "VAL",
                        "PSWAP",
                        "DAI",
                        "ETH",
                        "XSTUSD",
                        "XST"
                    ]
                },
                PriceInfo: {
                    pricefailures: "u32",
                    spotprices: "Vec<Balance>",
                    averageprice: "Balance",
                    needsupdate: "bool",
                    lastspotprice: "Balance"
                },
                QuoteWithDesiredInput: {
                    desiredamountin: "Balance"
                },
                QuoteWithDesiredOutput: {
                    desiredamountout: "Balance"
                },
                RewardInfo: {
                    limit: "Balance",
                    totalavailable: "Balance",
                    rewards: "BTreeMap<RewardReason, Balance>"
                },
                SwapWithDesiredInput: {
                    desiredamountin: "Balance",
                    minamountout: "Balance"
                },
                SwapWithDesiredOutput: {
                    desiredamountout: "Balance",
                    maxamountin: "Balance"
                },
                TeamVesting: {
                    teamvestingtotaltokens: "Balance",
                    teamvestingfirstreleasepercent: "Balance",
                    teamvestingperiod: "Moment",
                    teamvestingpercent: "Balance"
                },
                TechTradingPair: {
                    baseassetid: "TechAssetId",
                    targetassetid: "TechAssetId"
                },
                TokenInfo: {
                    farmstotalmultiplier: "u32",
                    stakingtotalmultiplier: "u32",
                    tokenperblock: "Balance",
                    farmsallocation: "Balance",
                    stakingallocation: "Balance",
                    teamallocation: "Balance",
                    teamaccount: "AccountId"
                },
                TokenLockInfo: {
                    tokens: "Balance",
                    unlockingtimestamp: "Moment",
                    assetid: "AssetId"
                },
                TradingPair: {
                    baseassetid: "AssetId",
                    targetassetid: "AssetId"
                },
                UserInfo: {
                    poolasset: "AssetId",
                    rewardasset: "AssetId",
                    isfarm: "bool",
                    pooledtokens: "Balance",
                    rewards: "Balance"
                },
                VotingInfo: {
                    votingoption: "u32",
                    numberofvotes: "Balance",
                    cereswithdrawn: "bool"
                }
            }
        },
        {
            minmax: [
                43,
                45
            ],
            types: {
                PredefinedAssetId: {
                    _enum: [
                        "XOR",
                        "DOT",
                        "KSM",
                        "USDT",
                        "VAL",
                        "PSWAP",
                        "DAI",
                        "ETH",
                        "XSTUSD",
                        "XST",
                        "TBCD"
                    ]
                }
            }
        },
        {
            minmax: [
                46,
                46
            ],
            types: {
                HermesPollInfo: {
                    creator: "AccountId",
                    hermeslocked: "Balance",
                    pollstarttimestamp: "Moment",
                    pollendtimestamp: "Moment",
                    title: "String",
                    description: "String",
                    creatorhermeswithdrawn: "bool"
                },
                HermesVotingInfo: {
                    votingoption: "VotingOption",
                    numberofhermes: "Balance",
                    hermeswithdrawn: "bool"
                },
                ILOInfo: {
                    iloorganizer: "AccountId",
                    tokensforilo: "Balance",
                    tokensforliquidity: "Balance",
                    iloprice: "Balance",
                    softcap: "Balance",
                    hardcap: "Balance",
                    mincontribution: "Balance",
                    maxcontribution: "Balance",
                    refundtype: "bool",
                    liquiditypercent: "Balance",
                    listingprice: "Balance",
                    lockupdays: "u32",
                    starttimestamp: "Moment",
                    endtimestamp: "Moment",
                    contributorsvesting: "ContributorsVesting",
                    teamvesting: "TeamVesting",
                    soldtokens: "Balance",
                    fundsraised: "Balance",
                    succeeded: "bool",
                    failed: "bool",
                    lptokens: "Balance",
                    claimedlptokens: "bool",
                    finishtimestamp: "Moment",
                    baseasset: "AssetId"
                },
                PoolData: {
                    multiplier: "u32",
                    depositfee: "Balance",
                    iscore: "bool",
                    isfarm: "bool",
                    totaltokensinpool: "Balance",
                    rewards: "Balance",
                    rewardstobedistributed: "Balance",
                    isremoved: "bool",
                    baseasset: "AssetId"
                },
                UserInfo: {
                    poolasset: "AssetId",
                    rewardasset: "AssetId",
                    isfarm: "bool",
                    pooledtokens: "Balance",
                    rewards: "Balance",
                    baseasset: "AssetId"
                },
                VotingOption: {
                    _enum: [
                        "Yes",
                        "No"
                    ]
                }
            }
        },
        {
            minmax: [
                47,
                null
            ],
            types: {
                LPSwapOutcomeInfo: {
                    amount: "Balance",
                    fee: "Balance",
                    rewards: "Vec<LPRewardsInfo>",
                    route: "Vec<AssetId>"
                }
            }
        }
    ],
    types: {
        AccountInfo: "AccountInfoWithDualRefCount",
        Address: "AccountId",
        Amount: "i128",
        AmountOf: "Amount",
        AssetId: "AssetId32",
        AssetId32: "[u8; 32]",
        AssetIdOf: "AssetId",
        AssetInfo: {
            assetId: "AssetId",
            symbol: "AssetSymbolStr",
            name: "AssetNameStr",
            precision: "u8",
            isMintable: "bool"
        },
        AssetKind: {
            _enum: [
                "Thischain",
                "Sidechain",
                "SidechainOwned"
            ]
        },
        AssetName: "Text",
        AssetNameStr: "String",
        AssetRecord: "Null",
        AssetSymbol: "Text",
        AssetSymbolStr: "String",
        AuxiliaryDigest: {
            logs: "Vec<AuxiliaryDigestItem>"
        },
        AuxiliaryDigestItem: {
            _enum: {
                Commitment: "(EthNetworkId, ChannelId, H256)"
            }
        },
        Balance: "u128",
        BalanceInfo: {
            balance: "Balance"
        },
        BalancePrecision: "u8",
        BasicChannelMessage: {
            networkId: "EthNetworkId",
            target: "H160",
            nonce: "u64",
            payload: "Vec<u8>"
        },
        BasisPoints: "u16",
        BridgeNetworkId: "u32",
        BridgeSignatureVersion: {
            _enum: [
                "V1",
                "V2"
            ]
        },
        BridgeStatus: {
            _enum: [
                "Initialized",
                "Migrating"
            ]
        },
        BridgeTimepoint: {
            height: "MultiChainHeight",
            index: "u32"
        },
        ChangePeersContract: {
            _enum: [
                "XOR",
                "VAL"
            ]
        },
        ChannelId: {
            _enum: {
                Basic: null,
                Incentivized: null
            }
        },
        ChargeFeeInfo: {
            tip: "Compact<Balance>",
            target_asset_id: "AssetId"
        },
        ContentSource: "Text",
        ContributionInfo: {
            fundsContributed: "Balance",
            tokensBought: "Balance",
            tokensClaimed: "Balance",
            claimingFinished: "bool",
            numberOfClaims: "u32"
        },
        ContributorsVesting: {
            firstReleasePercent: "Balance",
            vestingPeriod: "Moment",
            vestingPercent: "Balance"
        },
        CrowdloanLease: {
            startBlock: "String",
            totalDays: "String",
            blocksPerDay: "String"
        },
        CrowdloanReward: {
            id: "Vec<u8>",
            address: "Vec<u8>",
            contribution: "Fixed",
            xorReward: "Fixed",
            valReward: "Fixed",
            pswapReward: "Fixed",
            xstusdReward: "Fixed",
            percent: "Fixed"
        },
        CurrencyId: "AssetId",
        CurrencyIdEncoded: {
            _enum: {
                AssetId: "H256",
                TokenAddress: "H160"
            }
        },
        CurrencyIdOf: "AssetId",
        CustomInfo: {
            amount: "Balance"
        },
        DEXId: "u32",
        DEXIdOf: "DEXId",
        DEXInfo: {
            baseAssetId: "AssetId",
            defaultFee: "BasisPoints",
            defaultProtocolFee: "BasisPoints"
        },
        Description: "Text",
        DispatchErrorWithPostInfoTPostDispatchInfo: {
            postInfo: "PostDispatchInfo",
            error: "DispatchError"
        },
        DispatchResultWithPostInfo: "Result<PostDispatchInfo, DispatchErrorWithPostInfoTPostDispatchInfo>",
        DistributionAccounts: "Null",
        Duration: "Null",
        EthAddress: "H160",
        EthBridgeStorageVersion: {
            _enum: [
                "V1",
                "V2RemovePendingTransfers"
            ]
        },
        EthNetworkId: "U256",
        EthPeersSync: {
            isBridgeReady: "bool",
            isXorReady: "bool",
            isValReady: "bool"
        },
        Farm: "Null",
        FarmId: "u64",
        Farmer: "Null",
        FilterMode: {
            _enum: [
                "Disabled",
                "ForbidSelected",
                "AllowSelected"
            ]
        },
        Fixed: "FixedU128",
        FixedBytes: "Vec<u8>",
        HermesPollInfo: {
            creator: "AccountId",
            hermesLocked: "Balance",
            pollStartTimestamp: "Moment",
            pollEndTimestamp: "Moment",
            title: "String",
            description: "String",
            creatorHermesWithdrawn: "bool"
        },
        HermesVotingInfo: {
            votingOption: "VotingOption",
            numberOfHermes: "Balance",
            hermesWithdrawn: "bool"
        },
        HolderId: "AccountId",
        ILOInfo: {
            iloOrganizer: "AccountId",
            tokensForIlo: "Balance",
            tokensForLiquidity: "Balance",
            iloPrice: "Balance",
            softCap: "Balance",
            hardCap: "Balance",
            minContribution: "Balance",
            maxContribution: "Balance",
            refundType: "bool",
            liquidityPercent: "Balance",
            listingPrice: "Balance",
            lockupDays: "u32",
            startTimestamp: "Moment",
            endTimestamp: "Moment",
            contributorsVesting: "ContributorsVesting",
            teamVesting: "TeamVesting",
            soldTokens: "Balance",
            fundsRaised: "Balance",
            succeeded: "bool",
            failed: "bool",
            lpTokens: "Balance",
            claimedLpTokens: "bool",
            finishTimestamp: "Moment",
            baseAsset: "AssetId"
        },
        IncomingAddToken: {
            tokenAddress: "EthAddress",
            assetId: "AssetId",
            precision: "BalancePrecision",
            symbol: "AssetSymbol",
            name: "AssetName",
            author: "AccountId",
            txHash: "H256",
            atHeight: "u64",
            timepoint: "BridgeTimepoint",
            networkId: "BridgeNetworkId"
        },
        IncomingCancelOutgoingRequest: {
            outgoingRequest: "OutgoingRequest",
            outgoingRequestHash: "H256",
            initialRequestHash: "H256",
            txInput: "Vec<u8>",
            author: "AccountId",
            txHash: "H256",
            atHeight: "u64",
            timepoint: "BridgeTimepoint",
            networkId: "BridgeNetworkId"
        },
        IncomingChangePeers: {
            peerAccountId: "AccountId",
            peerAddress: "EthAddress",
            added: "bool",
            author: "AccountId",
            txHash: "H256",
            atHeight: "u64",
            timepoint: "BridgeTimepoint",
            networkId: "BridgeNetworkId"
        },
        IncomingChangePeersCompat: {
            peerAccountId: "AccountId",
            peerAddress: "EthAddress",
            added: "bool",
            contract: "ChangePeersContract",
            author: "AccountId",
            txHash: "H256",
            atHeight: "u64",
            timepoint: "BridgeTimepoint",
            networkId: "BridgeNetworkId"
        },
        IncomingMarkAsDoneRequest: {
            outgoingRequestHash: "H256",
            initialRequestHash: "H256",
            author: "AccountId",
            atHeight: "u64",
            timepoint: "BridgeTimepoint",
            networkId: "BridgeNetworkId"
        },
        IncomingMetaRequestKind: {
            _enum: [
                "CancelOutgoingRequest",
                "MarkAsDone"
            ]
        },
        IncomingMigrate: {
            newContractAddress: "EthAddress",
            author: "AccountId",
            txHash: "H256",
            atHeight: "u64",
            timepoint: "BridgeTimepoint",
            networkId: "BridgeNetworkId"
        },
        IncomingPrepareForMigration: {
            author: "AccountId",
            txHash: "H256",
            atHeight: "u64",
            timepoint: "BridgeTimepoint",
            networkId: "BridgeNetworkId"
        },
        IncomingRequest: {
            _enum: {
                Transfer: "IncomingTransfer",
                AddToken: "IncomingAddToken",
                ChangePeers: "IncomingChangePeers",
                CancelOutgoingRequest: "IncomingCancelOutgoingRequest",
                MarkAsDone: "IncomingMarkAsDoneRequest",
                PrepareForMigration: "IncomingPrepareForMigration",
                Migrate: "IncomingMigrate"
            }
        },
        IncomingRequestKind: {
            _enum: {
                Transaction: "IncomingTransactionRequestKind",
                Meta: "IncomingMetaRequestKind"
            }
        },
        IncomingTransactionRequestKind: {
            _enum: [
                "Transfer",
                "AddAsset",
                "AddPeer",
                "RemovePeer",
                "PrepareForMigration",
                "Migrate",
                "AddPeerCompat",
                "RemovePeerCompat",
                "TransferXOR"
            ]
        },
        IncomingTransfer: {
            from: "EthAddress",
            to: "AccountId",
            assetId: "AssetId",
            assetKind: "AssetKind",
            amount: "Balance",
            author: "AccountId",
            txHash: "H256",
            atHeight: "u64",
            timepoint: "BridgeTimepoint",
            networkId: "BridgeNetworkId"
        },
        IntentivizedChannelMessage: {
            networkId: "EthNetworkId",
            target: "H160",
            nonce: "u64",
            fee: "U256",
            payload: "Vec<u8>"
        },
        Keys: "SessionKeys3",
        LPRewardsInfo: {
            amount: "Balance",
            currency: "AssetId",
            reason: "RewardReason"
        },
        LPSwapOutcomeInfo: {
            amount: "Balance",
            fee: "Balance",
            rewards: "Vec<LPRewardsInfo>",
            route: "Vec<AssetId>"
        },
        LiquiditySourceIdOf: {
            dexId: "DEXId",
            liquiditySourceIndex: "LiquiditySourceType"
        },
        LiquiditySourceType: {
            _enum: [
                "XYKPool",
                "BondingCurvePool",
                "MulticollateralBondingCurvePool",
                "MockPool",
                "MockPool2",
                "MockPool3",
                "MockPool4",
                "XSTPool"
            ]
        },
        LoadIncomingMetaRequest: {
            author: "AccountId",
            hash: "H256",
            timepoint: "BridgeTimepoint",
            kind: "IncomingMetaRequestKind",
            networkId: "BridgeNetworkId"
        },
        LoadIncomingRequest: {
            _enum: {
                Transaction: "LoadIncomingTransactionRequest",
                Meta: "(LoadIncomingMetaRequest, H256)"
            }
        },
        LoadIncomingTransactionRequest: {
            author: "AccountId",
            hash: "H256",
            timepoint: "BridgeTimepoint",
            kind: "IncomingTransactionRequestKind",
            networkId: "BridgeNetworkId"
        },
        LockInfo: {
            poolTokens: "Balance",
            unlockingTimestamp: "Moment",
            assetA: "AssetId",
            assetB: "AssetId"
        },
        LookupSource: "AccountId",
        MarketMakerInfo: {
            count: "u32",
            volume: "Balance"
        },
        Mode: {
            _enum: [
                "Permit",
                "Forbid"
            ]
        },
        MultiChainHeight: {
            _enum: {
                Thischain: "BlockNumber",
                Sidechain: "u64"
            }
        },
        MultiCurrencyBalance: "Balance",
        MultiCurrencyBalanceOf: "MultiCurrencyBalance",
        MultisigAccount: {
            signatories: "Vec<AccountId>",
            threshold: "u8"
        },
        OffchainRequest: {
            _enum: {
                Outgoing: "(OutgoingRequest, H256)",
                LoadIncoming: "LoadIncomingRequest",
                Incoming: "(IncomingRequest, H256)"
            }
        },
        OracleKey: "AssetId",
        OutgoingAddAsset: {
            author: "AccountId",
            assetId: "AssetId",
            supply: "Balance",
            nonce: "Index",
            networkId: "BridgeNetworkId",
            timepoint: "BridgeTimepoint"
        },
        OutgoingAddAssetEncoded: {
            name: "String",
            symbol: "String",
            decimal: "u8",
            supply: "U256",
            sidechainAssetId: "FixedBytes",
            hash: "H256",
            networkId: "H256",
            raw: "Vec<u8>"
        },
        OutgoingAddPeer: {
            author: "AccountId",
            peerAddress: "EthAddress",
            peerAccountId: "AccountId",
            nonce: "Index",
            networkId: "BridgeNetworkId",
            timepoint: "BridgeTimepoint"
        },
        OutgoingAddPeerCompat: {
            author: "AccountId",
            peerAddress: "EthAddress",
            peerAccountId: "AccountId",
            nonce: "Index",
            networkId: "BridgeNetworkId",
            timepoint: "BridgeTimepoint"
        },
        OutgoingAddPeerEncoded: {
            peerAddress: "EthAddress",
            txHash: "H256",
            networkId: "H256",
            raw: "Vec<u8>"
        },
        OutgoingAddToken: {
            author: "AccountId",
            tokenAddress: "EthAddress",
            ticker: "String",
            name: "String",
            decimals: "u8",
            nonce: "Index",
            networkId: "BridgeNetworkId",
            timepoint: "BridgeTimepoint"
        },
        OutgoingAddTokenEncoded: {
            tokenAddress: "EthAddress",
            ticker: "String",
            name: "String",
            decimals: "u8",
            hash: "H256",
            networkId: "H256",
            raw: "Vec<u8>"
        },
        OutgoingMigrate: {
            author: "AccountId",
            newContractAddress: "EthAddress",
            erc20NativeTokens: "Vec<EthAddress>",
            nonce: "Index",
            networkId: "BridgeNetworkId",
            timepoint: "BridgeTimepoint"
        },
        OutgoingMigrateEncoded: {
            thisContractAddress: "EthAddress",
            txHash: "H256",
            newContractAddress: "EthAddress",
            erc20NativeTokens: "Vec<EthAddress>",
            networkId: "H256",
            raw: "Vec<u8>"
        },
        OutgoingPrepareForMigration: {
            author: "AccountId",
            nonce: "Index",
            networkId: "BridgeNetworkId",
            timepoint: "BridgeTimepoint"
        },
        OutgoingPrepareForMigrationEncoded: {
            thisContractAddress: "EthAddress",
            txHash: "H256",
            networkId: "H256",
            raw: "Vec<u8>"
        },
        OutgoingRemovePeer: {
            author: "AccountId",
            peerAccountId: "AccountId",
            peerAddress: "EthAddress",
            nonce: "Index",
            networkId: "BridgeNetworkId",
            timepoint: "BridgeTimepoint"
        },
        OutgoingRemovePeerCompat: {
            author: "AccountId",
            peerAccountId: "AccountId",
            peerAddress: "EthAddress",
            nonce: "Index",
            networkId: "BridgeNetworkId",
            timepoint: "BridgeTimepoint"
        },
        OutgoingRemovePeerEncoded: {
            peerAddress: "EthAddress",
            txHash: "H256",
            networkId: "H256",
            raw: "Vec<u8>"
        },
        OutgoingRequest: {
            _enum: {
                Transfer: "OutgoingTransfer",
                AddAsset: "OutgoingAddAsset",
                AddToken: "OutgoingAddToken",
                AddPeer: "OutgoingAddPeer",
                RemovePeer: "OutgoingRemovePeer",
                PrepareForMigration: "OutgoingPrepareForMigration",
                Migrate: "OutgoingMigrate"
            }
        },
        OutgoingRequestEncoded: {
            _enum: {
                Transfer: "OutgoingTransferEncoded",
                AddAsset: "OutgoingAddAssetEncoded",
                AddToken: "OutgoingAddTokenEncoded",
                AddPeer: "OutgoingAddPeerEncoded",
                RemovePeer: "OutgoingRemovePeerEncoded",
                PrepareForMigration: "OutgoingPrepareForMigrationEncoded",
                Migrate: "OutgoingMigrateEncoded"
            }
        },
        OutgoingTransfer: {
            from: "AccountId",
            to: "EthAddress",
            assetId: "AssetId",
            amount: "Balance",
            nonce: "Index",
            networkId: "BridgeNetworkId",
            timepoint: "BridgeTimepoint"
        },
        OutgoingTransferEncoded: {
            currencyId: "CurrencyIdEncoded",
            amount: "U256",
            to: "EthAddress",
            from: "EthAddress",
            txHash: "H256",
            networkId: "H256",
            raw: "Vec<u8>"
        },
        OwnerId: "AccountId",
        PendingMultisigAccount: {
            approvingAccounts: "Vec<AccountId>",
            migrateAt: "Option<BlockNumber>"
        },
        Permission: "Null",
        PermissionId: "u32",
        PollInfo: {
            numberOfOptions: "u32",
            pollStartTimestamp: "Moment",
            pollEndTimestamp: "Moment"
        },
        PoolData: {
            multiplier: "u32",
            depositFee: "Balance",
            isCore: "bool",
            isFarm: "bool",
            totalTokensInPool: "Balance",
            rewards: "Balance",
            rewardsToBeDistributed: "Balance",
            isRemoved: "bool",
            baseAsset: "AssetId"
        },
        PoolFarmer: {
            account: "AccountId",
            block: "BlockNumber",
            weight: "Balance"
        },
        PostDispatchInfo: {
            actualWeight: "Option<Weight>",
            paysFee: "Pays"
        },
        PredefinedAssetId: {
            _enum: [
                "XOR",
                "DOT",
                "KSM",
                "USDT",
                "VAL",
                "PSWAP",
                "DAI",
                "ETH",
                "XSTUSD",
                "XST",
                "TBCD"
            ]
        },
        PriceInfo: {
            priceFailures: "u32",
            spotPrices: "Vec<Balance>",
            averagePrice: "Balance",
            needsUpdate: "bool",
            lastSpotPrice: "Balance"
        },
        Public: "[u8; 33]",
        QuoteAmount: {
            _enum: {
                WithDesiredInput: "QuoteWithDesiredInput",
                WithDesiredOutput: "QuoteWithDesiredOutput"
            }
        },
        QuoteWithDesiredInput: {
            desiredAmountIn: "Balance"
        },
        QuoteWithDesiredOutput: {
            desiredAmountOut: "Balance"
        },
        RefCount: "u32",
        RequestStatus: {
            _enum: [
                "Pending",
                "Frozen",
                "ApprovalsReady",
                "Failed",
                "Done"
            ]
        },
        RewardInfo: {
            limit: "Balance",
            totalAvailable: "Balance",
            rewards: "BTreeMap<RewardReason, Balance>"
        },
        RewardReason: {
            _enum: [
                "Unspecified",
                "BuyOnBondingCurve",
                "LiquidityProvisionFarming",
                "MarketMakerVolume"
            ]
        },
        Scope: {
            _enum: {
                Limited: "H512",
                Unlimited: "Null"
            }
        },
        SignatureParams: {
            r: "[u8; 32]",
            s: "[u8; 32]",
            v: "u8"
        },
        SmoothPriceState: "Null",
        StakingInfo: {
            deposited: "Balance",
            rewards: "Balance"
        },
        StorageVersion: "Null",
        SwapAction: "Null",
        SwapAmount: {
            _enum: {
                WithDesiredInput: "SwapWithDesiredInput",
                WithDesiredOutput: "SwapWithDesiredOutput"
            }
        },
        SwapOutcome: {
            amount: "Balance",
            fee: "Balance"
        },
        SwapOutcomeInfo: {
            amount: "Balance",
            fee: "Balance"
        },
        SwapVariant: {
            _enum: [
                "WithDesiredInput",
                "WithDesiredOutput"
            ]
        },
        SwapWithDesiredInput: {
            desiredAmountIn: "Balance",
            minAmountOut: "Balance"
        },
        SwapWithDesiredOutput: {
            desiredAmountOut: "Balance",
            maxAmountIn: "Balance"
        },
        TAssetBalance: "Balance",
        TP: "TradingPair",
        TeamVesting: {
            teamVestingTotalTokens: "Balance",
            teamVestingFirstReleasePercent: "Balance",
            teamVestingPeriod: "Moment",
            teamVestingPercent: "Balance"
        },
        TechAccountId: {
            _enum: {
                Pure: "(DEXId, TechPurpose)",
                Generic: "(Vec<u8>, Vec<u8>)",
                Wrapped: "AccountId",
                WrappedRepr: "AccountId"
            }
        },
        TechAmount: "Amount",
        TechAssetId: {
            _enum: {
                Wrapped: "PredefinedAssetId",
                Escaped: "AssetId"
            }
        },
        TechBalance: "Balance",
        TechPurpose: {
            _enum: {
                FeeCollector: "Null",
                FeeCollectorForPair: "TechTradingPair",
                LiquidityKeeper: "TechTradingPair",
                Identifier: "Vec<u8>"
            }
        },
        TechTradingPair: {
            baseAssetId: "TechAssetId",
            targetAssetId: "TechAssetId"
        },
        TokenInfo: {
            farmsTotalMultiplier: "u32",
            stakingTotalMultiplier: "u32",
            tokenPerBlock: "Balance",
            farmsAllocation: "Balance",
            stakingAllocation: "Balance",
            teamAllocation: "Balance",
            teamAccount: "AccountId"
        },
        TokenLockInfo: {
            tokens: "Balance",
            unlockingTimestamp: "Moment",
            assetId: "AssetId"
        },
        TradingPair: {
            baseAssetId: "AssetId",
            targetAssetId: "AssetId"
        },
        UserInfo: {
            poolAsset: "AssetId",
            rewardAsset: "AssetId",
            isFarm: "bool",
            pooledTokens: "Balance",
            rewards: "Balance",
            baseAsset: "AssetId"
        },
        ValidationFunction: "Null",
        VotingInfo: {
            votingOption: "u32",
            numberOfVotes: "Balance",
            ceresWithdrawn: "bool"
        },
        VotingOption: {
            _enum: [
                "Yes",
                "No"
            ]
        },
        String: "Vec<u8>",
        Text: "Vec<u8>"
    },
    typesAlias: {
        bridgeMultisig: {
            Timepoint: "BridgeTimepoint"
        }
    }
}
