import { OldTypesBundle } from "../types";

export const bundle: OldTypesBundle = {
    types: {
        EthereumHeaderThingWithProof: {
            header: "EthereumHeader",
            ethash_proof: "Vec<EthashProof>",
            mmr_root: "H256",
            mmr_proof: "Vec<H256>",
        },
        EthereumHeaderThing: {
            header: "EthereumHeader",
            mmr_root: "H256",
        },
        GameId: "TcBlockNumber",
        TcBlockNumber: "u64",
        RelayProposalT: {
            relayer: "AccountId",
            bonded_proposal: "Vec<(Balance, TcHeaderThing)>",
            extend_from_header_hash: "Option<TcHeaderHash>",
        },
        TcHeaderThing: "EthereumHeaderThing",
        TcHeaderHash: "H256",
        Round: "u64",
        UsableBalance: {
            usableBalance: "Balance",
        },
        Status: {
            _enum: {
                Free: null,
                Reserved: null,
            },
        },
        MessageId: "(LaneId, MessageNonce)",
        BSCHeader: {
            parentHash: "H256",
            uncleHash: "H256",
            coinbase: "EthereumAddress",
            stateRoot: "H256",
            transactionsRoot: "H256",
            receiptsRoot: "H256",
            logBloom: "Bloom",
            difficulty: "U256",
            number: "u64",
            gasLimit: "U256",
            gasUsed: "U256",
            timestamp: "u64",
            extraData: "Bytes",
            mixDigest: "H256",
            nonce: "Bytes",
        },
        BalanceInfo: {},
        BalanceLock: {
            id: "LockIdentifier",
            lockFor: "LockFor",
            reasons: "Reasons",
        },
        LockFor: {
            _enum: {
                Common: "Common",
                Staking: "StakingLock",
            },
        },
        Common: {
            amount: "Balance",
        },
        StakingLock: {
            stakingAmount: "Balance",
            unbondings: "Vec<Unbonding>",
        },
        Unbonding: {
            amount: "Balance",
            until: "BlockNumber",
        },
        AccountData: {
            free: "Balance",
            reserved: "Balance",
            freeKton: "Balance",
            reservedKton: "Balance",
        },
        RingBalance: "Balance",
        KtonBalance: "Balance",
        TsInMs: "u64",
        Power: "u32",
        DepositId: "U256",
        StakingBalanceT: {
            _enum: {
                RingBalance: "Balance",
                KtonBalance: "Balance",
            },
        },
        StakingLedgerT: {
            stash: "AccountId",
            active: "Compact<Balance>",
            activeDepositRing: "Compact<Balance>",
            activeKton: "Compact<Balance>",
            depositItems: "Vec<TimeDepositItem>",
            ringStakingLock: "StakingLock",
            ktonStakingLock: "StakingLock",
            claimedRewards: "Vec<EraIndex>",
        },
        TimeDepositItem: {
            value: "Compact<Balance>",
            startTime: "Compact<TsInMs>",
            expireTime: "Compact<TsInMs>",
        },
        ExposureT: {
            ownRingBalance: "Compact<Balance>",
            ownKtonBalance: "Compact<Balance>",
            ownPower: "Power",
            totalPower: "Power",
            others: "Vec<IndividualExposure>",
        },
        Exposure: "ExposureT",
        IndividualExposure: {
            who: "AccountId",
            ringBalance: "Compact<Balance>",
            ktonBalance: "Compact<Balance>",
            power: "Power",
        },
        ElectionResultT: {
            electedStashes: "Vec<AccountId>",
            exposures: "Vec<(AccountId, ExposureT)>",
            compute: "ElectionCompute",
        },
        RKT: {
            r: "Balance",
            k: "Balance",
        },
        SpanRecord: {
            slashed: "RKT",
            paidOut: "RKT",
        },
        UnappliedSlash: {
            validator: "AccountId",
            own: "RKT",
            others: "Vec<(AccountId, RKT)>",
            reporters: "Vec<AccountId>",
            payout: "RKT",
        },
        MappedRing: "u128",
        EthereumTransactionIndex: "(H256, u64)",
        EthereumBlockNumber: "u64",
        EthereumHeader: {
            parentHash: "H256",
            timestamp: "u64",
            number: "EthereumBlockNumber",
            author: "EthereumAddress",
            transactionsRoot: "H256",
            unclesHash: "H256",
            extraData: "Bytes",
            stateRoot: "H256",
            receiptsRoot: "H256",
            logBloom: "Bloom",
            gasUsed: "U256",
            gasLimit: "U256",
            difficulty: "U256",
            seal: "Vec<Bytes>",
            baseFeePerGas: "Option<U256>",
            blockHash: "Option<H256>",
        },
        Bloom: "[u8; 256; Bloom]",
        EthashProof: {
            dagNodes: "(H512, H512)",
            proof: "Vec<H128>",
        },
        EthereumReceipt: {
            Legacy: "LegacyReceipt",
            AccessList: "LegacyReceipt",
            EIP1559Transaction: "LegacyReceipt",
        },
        LegacyReceipt: {
            gasUsed: "U256",
            logBloom: "Bloom",
            logs: "Vec<LogEntry>",
            outcome: "TransactionOutcome",
        },
        LogEntry: {},
        TransactionOutcome: {},
        EthereumNetwork: {
            _enum: {
                Mainnet: null,
                Ropsten: null,
            },
        },
        RedeemFor: {
            _enum: {
                Token: null,
                Deposit: null,
            },
        },
        EthereumReceiptProof: {
            index: "u64",
            proof: "Bytes",
            headerHash: "H256",
        },
        EthereumReceiptProofThing:
            "(EthereumHeader, EthereumReceiptProof, MMRProof)",
        MMRProof: {
            memberLeafIndex: "u64",
            lastLeafIndex: "u64",
            proof: "Vec<H256>",
        },
        EthereumRelayHeaderParcel: {
            header: "EthereumHeader",
            parentMmrRoot: "H256",
        },
        EthereumRelayProofs: {
            ethashProof: "Vec<EthashProof>",
            mmrProof: "Vec<H256>",
        },
        OtherSignature: {
            _enum: {
                Eth: "EcdsaSignature",
                Tron: "EcdsaSignature",
            },
        },
        EcdsaSignature: "[u8; 65; EcdsaSignature]",
        TronAddress: "EthereumAddress",
        OtherAddress: {
            _enum: {
                Eth: "EthereumAddress",
                Tron: "TronAddress",
            },
        },
        AddressT: "[u8; 20; AddressT]",
        MerkleMountainRangeRootLog: {
            prefix: "[u8; 4; Prefix]",
            ParentMmrRoot: "Hash",
        },
        ChainProperties: {
            ss58Format: "Option<u8>",
            tokenDecimals: "Option<Vec<u32>>",
            tokenSymbol: "Option<Vec<Text>>",
        },
        AccountInfo: {
            nonce: "Index",
            refcount: "RefCount",
            data: "AccountData",
        },
        Signer: "EthereumAddress",
        RelayAuthorityT: {
            accountId: "AccountId",
            signer: "EthereumAddress",
            stake: "Balance",
            term: "BlockNumber",
        },
        MMRRoot: "Hash",
        EcdsaAddress: "EthereumAddress",
        EcdsaMessage: "H256",
        RelayAuthoritySigner: "EcdsaAddress",
        RelayAuthorityMessage: "EcdsaMessage",
        RelayAuthoritySignature: "EcdsaSignature",
        Term: "BlockNumber",
        OpCode: "[u8; 4; OpCode]",
        ScheduledAuthoritiesChangeT: {
            nextAuthorities: "Vec<RelayAuthorityT>",
            deadline: "BlockNumber",
        },
        MmrRootToSign: {
            mmrRoot: "Hash",
            signatures: "Vec<(AccountId, EcdsaSignature)>",
        },
        ElectionCompute: {
            _enum: ["OnChain", "Signed", "Authority"],
        },
        ValidatorPrefs: "ValidatorPrefsWithBlocked",
        Relayer: {
            id: "AccountId",
            collateral: "Balance",
            fee: "Balance",
        },
        PriorRelayer: {
            id: "AccountId",
            fee: "Balance",
            validRange: "BlockNumber",
        },
        TokenMessageId: "[u8; 16; TokenMessageId]",
        TokenMetadata: {
            tokenType: "u32",
            address: "H160",
            name: "Vec<u8>",
            symbol: "Vec<u8>",
            decimal: "u8",
        },
        Order: {
            lane: "LaneId",
            message: "MessageNonce",
            sentTime: "BlockNumber",
            confirmTime: "BlockNumber",
            lockedCollateral: "Balance",
            assignedRelayers: "Vec<PriorRelayer>",
        },
        Fee: {
            amount: "Balance",
        },
        InProcessOrders: {
            orders: "Vec<LaneId, MessageNonce>",
        },
        MMRProofResult: {
            mmrSize: "u64",
            proof: "Text",
        },
        NodeIndex: "u64",
        MmrNodesPruningConfiguration: {
            step: "NodeIndex",
            progress: "NodeIndex",
            lastPosition: "NodeIndex",
        },
        ProxyType: {
            _enum: {
                Any: null,
                NonTransfer: null,
                Governance: null,
                Staking: null,
                IdentityJudgement: null,
                EthereumBridge: null,
            },
        },
        Announcement: "ProxyAnnouncement",
        RelayHeaderId: "EthereumBlockNumber",
        RelayHeaderParcel: "EthereumRelayHeaderParcel",
        RelayProofs: "EthereumRelayProofs",
        RelayAffirmationId: {
            relayHeaderId: "EthereumBlockNumber",
            round: "u32",
            index: "u32",
        },
        RelayAffirmationT: {
            relayer: "AccountId",
            relayHeaderParcels: "EthereumRelayHeaderParcel",
            bond: "Balance",
            maybeExtendedRelayAffirmationId: "Option<RelayAffirmationId>",
            verified: "bool",
        },
        RelayVotingState: {
            ayes: "Vec<AccountId>",
            nays: "Vec<AccountId>",
        },
        PowerOf: {
            power: "Power",
        },
    },
    versions: [
        {
            minmax: [0, 22],
            types: {},
        },
        {
            minmax: [23, 24],
            types: {
                AccountInfo: "AccountInfoWithTripleRefCount",
                AccountInfoWithTripleRefCount: {
                    nonce: "Index",
                    consumers: "RefCount",
                    providers: "RefCount",
                    data: "AccountData",
                },
            },
        },
        {
            minmax: [25, 1150],
            types: {
                Address: "MultiAddress",
                LookupSource: "MultiAddress",
                MultiAddress: "GenericMultiAddress",
                AccountData: {
                    feeFrozen: "Balance",
                    free: "Balance",
                    reserved: "Balance",
                    freeKton: "Balance",
                    reservedKton: "Balance",
                    miscFrozen: "Balance",
                },
                BalanceInfo: {},
                BalanceLock: {
                    id: "LockIdentifier",
                    lockFor: "LockFor",
                    reasons: "Reasons",
                },
                EcdsaMessage: "H256",
                EthashProof: {
                    dagNodes: "(H512, H512)",
                    proof: "Vec<H128>",
                },
                EthereumReceipt: {
                    gasUsed: "U256",
                    logBloom: "Bloom",
                    logs: "Vec<LogEntry>",
                    outcome: "TransactionOutcome",
                },
                Order: {
                    lane: "LaneId",
                    message: "MessageNonce",
                    sent_time: "BlockNumber",
                    confirm_time: "BlockNumber",
                    assigned_relayers: "Vec<PriorRelayer>",
                },
                RelayAffirmationId: {
                    relayHeaderId: "EthereumBlockNumber",
                    round: "u32",
                    index: "u32",
                },
                RelayAuthorityT: {
                    accountId: "AccountId",
                    signer: "EthereumAddress",
                    stake: "Balance",
                    term: "BlockNumber",
                },
                Term: "BlockNumber",
                Unbonding: {
                    amount: "Balance",
                    moment: "BlockNumber",
                },
            },
        },
        {
            minmax: [1160, null],
            types: {},
        },
    ],
    signedExtensions: {
        CheckEthereumRelayHeaderHash: 'Null',
        CheckEthereumRelayHeaderParcel: 'Null'
    }
};
