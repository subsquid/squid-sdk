import { OldTypesBundle } from "../types";

export const bundle: OldTypesBundle = {
    types: {
        Address: "MultiAddress",
        LookupSource: "MultiAddress",
        AccountInfo: "AccountInfoWithProviders",
        AssetInfo: {
            owner: "AccountId",
            data: "AssetData",
        },
        AssetId: "u64",
        EstateId: "u64",
        AssetData: {
            name: "Text",
            description: "Text",
            properties: "Text",
            supporters: "Vec<AccountId>",
        },
        AuctionId: "u64",
        AuctionItem: {
            itemId: "ItemId",
            recipient: "AccountId",
            initial_amount: "Balance",
            amount: "Balance",
            start_time: "u32",
            end_time: "u32",
            auction_type: "AuctionType",
            listing_level: "ListingLevel",
            currency_id: "FungibleTokenId",
        },
        AuctionInfo: {
            bid: "Option<(AccountId,Balance)>",
            start: "BlockNumber",
            end: "Option<BlockNumber>",
        },
        AuctionType: {
            _enum: ["Auction", "BuyNow"],
        },
        RentId: "u64",
        RentalInfo: {
            owner: "AccountId",
            start: "BlockNumber",
            end: "Option<BlockNumber>",
            price_per_block: "Balance",
        },
        MetaverseId: "u64",
        CollectionId: "u64",
        ClassId: "u32",
        ClassInfoOf: {
            metadata: "Vec<u8>",
            total_issuance: "TokenId",
            owner: "AccountId",
            data: "NftClassData",
        },
        TokenInfoOf: {
            metadata: "Vec<u8>",
            owner: "AccountId",
            data: "NftAssetData",
        },
        NftCollectionData: {
            name: "Vec<u8>",
            owner: "AccountId",
            properties: "Vec<u8>",
        },
        NftGroupCollectionData: {
            name: "Vec<u8>",
            properties: "Vec<u8>",
        },
        TokenType: {
            _enum: ["Transferable", "BoundToAddress"],
        },
        NftAssetData: {
            deposit: "Balance",
            name: "Vec<u8>",
            description: "Vec<u8>",
            properties: "Vec<u8>",
        },
        NftClassData: {
            deposit: "Balance",
            properties: "Vec<u8>",
            token_type: "TokenType",
            collection_type: "CollectionType",
            total_supply: "u64",
            initial_supply: "u64",
        },
        NetworkId: {
            _enum: {
                Any: "Null",
                Named: "Vec<u8>",
                Polkadot: "Null",
                Kusama: "Null",
            },
        },
        CollectionType: {
            _enum: ["Collectable", "Wearable", "Executable"],
        },
        CurrencyId: "FungibleTokenId",
        TokenSymbol: {
            _enum: ["NUUM", "AUSD", "ACA", "DOT"],
        },
        CurrencyIdOf: "FungibleTokenId",
        BalanceIdOf: "Balance",
        ChainId: {
            _enum: {
                RelayChain: "Null",
                ParaChain: "ParaId",
            },
        },
        XCurrencyId: {
            chain_id: "ChainId",
            currency_id: "CurrencyId",
        },
        GroupCollectionId: "u64",
        ClassIdOf: "ClassId",
        TokenIdOf: "TokenId",
        SpotId: "u32",
        ItemId: {
            _enum: {
                NFT: "AssetId",
                Spot: "(u64, MetaverseId)",
                Metaverse: "MetaverseId",
                Block: "u64",
            },
        },
        PoolId: "u32",
        FungibleTokenId: {
            _enum: {
                NativeToken: "TokenId",
                FungibleToken: "TokenId",
                DEXShare: "(TokenId, TokenId)",
                MiningResource: "TokenId",
            },
        },
        TradingPairStatus: {
            _enum: ["NotEnabled", "Enabled"],
        },
        TradingPair: "(FungibleTokenId,FungibleTokenId)",
        MetaverseInfo: {
            owner: "AccountId",
            metadata: "Text",
            currency_id: "FungibleTokenId",
        },
        Ticker: "Vec<u8>",
        Token: {
            ticker: "Ticker",
            total_supply: "Balance",
        },
        MetaverseFund: {
            vault: "AccountId",
            value: "u128",
            backing: "u128",
            currency_id: "FungibleTokenId",
        },
        LandId: "u64",
        TokenId: "u64",
        PreimageStatus: {
            _enum: {
                Missing: "BlockNumber",
                Available: {
                    data: "Vec<u8>",
                    provider: "AccountId",
                    deposit: "Balance",
                    since: "BlockNumber",
                    expiry: "Option<BlockNumber>",
                },
            },
        },
        VoteThreshold: {
            _enum: [
                "SuperMajorityApprove",
                "SuperMajorityAgainst",
                "RelativeMajority",
            ],
        },
        ProposalId: "u64",
        ReferendumId: "u64",
        MetaverseParameter: {
            _enum: {
                MaxProposals: "u8",
                SetReferendumJury: "AccountId",
            },
        },
        ReferendumParameters: {
            voting_threshold: "Option<VoteThreshold>",
            min_proposal_launch_period: "BlockNumber",
            voting_period: "BlockNumber",
            enactment_period: "BlockNumber",
            local_vote_locking_period: "BlockNumber",
            max_proposals_per_metaverse: "u8",
        },
        Delegations: {
            votes: "Balance",
            capital: "Balance",
        },
        Conviction: {
            _enum: [
                "None",
                "Locked1x",
                "Locked2x",
                "Locked3x",
                "Locked4x",
                "Locked5x",
                "Locked6x",
            ],
        },
        Vote: {
            aye: "bool",
            balance: "Balance",
            conviction: "Conviction",
        },
        Tally: {
            ayes: "Balance",
            nays: "Balance",
            turnout: "Balance",
        },
        PriorLock: "(BlockNumber, Balance)",
        VotingRecord: {
            votes: "Vec<(ReferendumId,Vote<Balance>)>",
            prior: "PriorLock<BlockNumber, Balance>",
        },
        ProposalInfo: {
            proposed_by: "AccountId",
            hash: "Hash",
            description: "Vec<u8>",
            referendum_launch_block: "BlockNumber",
        },
        ReferendumStatus: {
            end: "BlockNumber",
            metaverse: "MetaverseId",
            proposal_hash: "Hash",
            tally: "Tally<Balance>",
            threshold: "Option<VoteThreshold>",
        },
        ReferendumInfo: {
            _enum: {
                Ongoing: "ReferendumStatus<BlockNumber,Balance, Hash>",
                Finished: {
                    passed: "bool",
                    end: "BlockNumber",
                },
            },
        },
        ListingLevel: {
            _enum: {
                Global: "Null",
                Local: "MetaverseId",
            },
        },
        AmountOf: "Balance",
        VestingSchedule: {
            token: "FungibleTokenId",
            start: "BlockNumber",
            period: "BlockNumber",
            periodCount: "u32",
            perPeriod: "Compact<Balance>",
        },
        RoundIndex: "u32",
        VestingScheduleOf: "VestingSchedule",
        Candidate: {
            id: "AccountId",
            fee: "Perbill",
            bond: "Balance",
            nominators: "Vec<Bond>",
            total: "Balance",
            state: "CollatorStatus",
        },
        CollatorStatus: {
            _enum: {
                Active: "Null",
                Idle: "Null",
                Leaving: "RoundIndex",
            },
        },
        Range: "RangeBalance",
        RangeBalance: {
            min: "Balance",
            ideal: "Balance",
            max: "Balance",
        },
        RangePerbill: {
            min: "Perbill",
            ideal: "Perbill",
            max: "Perbill",
        },
        InflationInfo: {
            expect: "RangeBalance",
            annual: "RangePerbill",
            round: "RangePerbill",
        },
        OrderedSet: "Vec<Bond>",
        Collator: {
            id: "AccountId",
            bond: "Balance",
            nominators: "Vec<Bond>",
            total: "Balance",
            state: "CollatorStatus",
        },
        CollatorSnapshot: {
            bond: "Balance",
            nominators: "Vec<Bond>",
            total: "Balance",
        },
        RoundInfo: {
            current: "RoundIndex",
            first: "BlockNumber",
            length: "u32",
        },
        Nominator: {
            nominations: "Vec<Bond>",
            total: "Balance",
        },
        Bond: {
            owner: "AccountId",
            amount: "Balance",
        },
        ValidatorStatus: {
            _enum: {
                Active: "Null",
                Idle: "Null",
                Leaving: "RoundIndex",
            },
        },
        AuctionSlot: {
            spot_id: "SpotId",
            participants: "Vec<AccountId>",
            active_session_index: "BlockNumber",
            status: "ContinuumAuctionSlotStatus",
        },
        ContinuumAuctionSlotStatus: {
            _enum: ["AcceptParticipates", "GNPStarted", "GNPConfirmed"],
        },
    },
};
