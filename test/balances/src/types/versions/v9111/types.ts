
export const DispatchError = sts.closedEnum(() => {
    return  {
        Arithmetic: ArithmeticError,
        BadOrigin: sts.unit(),
        CannotLookup: sts.unit(),
        ConsumerRemaining: sts.unit(),
        Module: sts.enumStruct({
            index: Type_2,
            error: Type_2,
        }),
        NoProviders: sts.unit(),
        Other: sts.unit(),
        Token: TokenError,
    }
})

export const DispatchInfo = sts.struct(() => {
    return  {
        weight: Type_8,
        class: DispatchClass,
        paysFee: Pays,
    }
})

export const Type_4 = sts.number()

export const Type_52 = sts.closedEnum(() => {
    return  {
        Err: DispatchError,
        Ok: sts.unit(),
    }
})

export const H256 = sts.bytes()

export const Type_71 = sts.tuple(Type_4, Type_4)

export const Type_10 = sts.bytes()

export const Type_72 = sts.option(() => Type_10)

export const AccountId32 = sts.bytes()

export const ProxyType = sts.closedEnum(() => {
    return  {
        Any: sts.unit(),
        Auction: sts.unit(),
        CancelProxy: sts.unit(),
        Governance: sts.unit(),
        IdentityJudgement: sts.unit(),
        NonTransfer: sts.unit(),
        Staking: sts.unit(),
    }
})

export const Timepoint = sts.struct(() => {
    return  {
        height: Type_4,
        index: Type_4,
    }
})

export const Type_1 = sts.bytes()

export const ElectionCompute = sts.closedEnum(() => {
    return  {
        Emergency: sts.unit(),
        Fallback: sts.unit(),
        OnChain: sts.unit(),
        Signed: sts.unit(),
        Unsigned: sts.unit(),
    }
})

export const Type_55 = sts.boolean()

export const Id = sts.number()

export const V1MultiLocation = sts.struct(() => {
    return  {
        parents: Type_2,
        interior: V1Junctions,
    }
})

export const VersionedMultiAssets = sts.closedEnum(() => {
    return  {
        V0: Type_137,
        V1: V1MultiAssets,
    }
})

export const Type_8 = sts.bigint()

export const Type_135 = sts.option(() => V1MultiLocation)

export const Type_2 = sts.number()

export const VersionedMultiLocation = sts.closedEnum(() => {
    return  {
        V0: V0MultiLocation,
        V1: V1MultiLocation,
    }
})

export const V2Error = sts.closedEnum(() => {
    return  {
        AssetNotFound: sts.unit(),
        BadOrigin: sts.unit(),
        Barrier: sts.unit(),
        DestinationUnsupported: sts.unit(),
        ExceedsMaxMessageSize: sts.unit(),
        FailedToDecode: sts.unit(),
        FailedToTransactAsset: sts.unit(),
        InvalidLocation: sts.unit(),
        LocationCannotHold: sts.unit(),
        MultiLocationFull: sts.unit(),
        MultiLocationNotInvertible: sts.unit(),
        NotHoldingFees: sts.unit(),
        NotWithdrawable: sts.unit(),
        Overflow: sts.unit(),
        TooExpensive: sts.unit(),
        TooMuchWeightRequired: sts.unit(),
        Transport: sts.unit(),
        Trap: Type_8,
        UnhandledXcmVersion: sts.unit(),
        Unimplemented: sts.unit(),
        UnknownClaim: sts.unit(),
        Unroutable: sts.unit(),
        UntrustedReserveLocation: sts.unit(),
        UntrustedTeleportLocation: sts.unit(),
        WeightLimitReached: Type_8,
        WeightNotComputable: sts.unit(),
    }
})

export const V2Response = sts.closedEnum(() => {
    return  {
        Assets: V1MultiAssets,
        ExecutionResult: Type_127,
        Null: sts.unit(),
        Version: Type_4,
    }
})

export const V2Instruction = sts.closedEnum(() => {
    return  {
        BuyExecution: sts.enumStruct({
            fees: V1MultiAsset,
            weightLimit: V2WeightLimit,
        }),
        ClaimAsset: sts.enumStruct({
            assets: V1MultiAssets,
            ticket: V1MultiLocation,
        }),
        ClearError: sts.unit(),
        ClearOrigin: sts.unit(),
        DepositAsset: sts.enumStruct({
            assets: V1MultiAssetFilter,
            maxAssets: Type_111,
            beneficiary: V1MultiLocation,
        }),
        DepositReserveAsset: sts.enumStruct({
            assets: V1MultiAssetFilter,
            maxAssets: Type_111,
            dest: V1MultiLocation,
            xcm: V2Xcm,
        }),
        DescendOrigin: V1Junctions,
        ExchangeAsset: sts.enumStruct({
            give: V1MultiAssetFilter,
            receive: V1MultiAssets,
        }),
        HrmpChannelAccepted: sts.enumStruct({
            recipient: Type_111,
        }),
        HrmpChannelClosing: sts.enumStruct({
            initiator: Type_111,
            sender: Type_111,
            recipient: Type_111,
        }),
        HrmpNewChannelOpenRequest: sts.enumStruct({
            sender: Type_111,
            maxMessageSize: Type_111,
            maxCapacity: Type_111,
        }),
        InitiateReserveWithdraw: sts.enumStruct({
            assets: V1MultiAssetFilter,
            reserve: V1MultiLocation,
            xcm: V2Xcm,
        }),
        InitiateTeleport: sts.enumStruct({
            assets: V1MultiAssetFilter,
            dest: V1MultiLocation,
            xcm: V2Xcm,
        }),
        QueryHolding: sts.enumStruct({
            queryId: Type_113,
            dest: V1MultiLocation,
            assets: V1MultiAssetFilter,
            maxResponseWeight: Type_113,
        }),
        QueryResponse: sts.enumStruct({
            queryId: Type_113,
            response: V2Response,
            maxWeight: Type_113,
        }),
        ReceiveTeleportedAsset: V1MultiAssets,
        RefundSurplus: sts.unit(),
        ReportError: sts.enumStruct({
            queryId: Type_113,
            dest: V1MultiLocation,
            maxResponseWeight: Type_113,
        }),
        ReserveAssetDeposited: V1MultiAssets,
        SetAppendix: V2Xcm,
        SetErrorHandler: V2Xcm,
        SubscribeVersion: sts.enumStruct({
            queryId: Type_113,
            maxResponseWeight: Type_113,
        }),
        Transact: sts.enumStruct({
            originType: V0OriginKind,
            requireWeightAtMost: Type_113,
            call: DoubleEncoded,
        }),
        TransferAsset: sts.enumStruct({
            assets: V1MultiAssets,
            beneficiary: V1MultiLocation,
        }),
        TransferReserveAsset: sts.enumStruct({
            assets: V1MultiAssets,
            dest: V1MultiLocation,
            xcm: V2Xcm,
        }),
        Trap: Type_113,
        UnsubscribeVersion: sts.unit(),
        WithdrawAsset: V1MultiAssets,
    }
})

export const V2Xcm = sts.array(V2Instruction)

export const V1CandidateReceipt = sts.struct(() => {
    return  {
        descriptor: V1CandidateDescriptor,
        commitmentsHash: H256,
    }
})

export const HeadData = sts.bytes()

export const V1CoreIndex = sts.number()

export const V1GroupIndex = sts.number()

export const V2Outcome = sts.closedEnum(() => {
    return  {
        Complete: Type_8,
        Error: V2Error,
        Incomplete: sts.tuple(Type_8, V2Error),
    }
})

export const HrmpChannelId = sts.struct(() => {
    return  {
        sender: Id,
        recipient: Id,
    }
})

export const ArithmeticError = sts.closedEnum(() => {
    return  {
        DivisionByZero: sts.unit(),
        Overflow: sts.unit(),
        Underflow: sts.unit(),
    }
})

export const TokenError = sts.closedEnum(() => {
    return  {
        BelowMinimum: sts.unit(),
        CannotCreate: sts.unit(),
        Frozen: sts.unit(),
        NoFunds: sts.unit(),
        UnknownAsset: sts.unit(),
        Unsupported: sts.unit(),
        WouldDie: sts.unit(),
    }
})

export const DispatchClass = sts.closedEnum(() => {
    return  {
        Mandatory: sts.unit(),
        Normal: sts.unit(),
        Operational: sts.unit(),
    }
})

export const Pays = sts.closedEnum(() => {
    return  {
        No: sts.unit(),
        Yes: sts.unit(),
    }
})

export const V1Junctions = sts.closedEnum(() => {
    return  {
        Here: sts.unit(),
        X1: V1Junction,
        X2: sts.tuple(V1Junction, V1Junction),
        X3: sts.tuple(V1Junction, V1Junction, V1Junction),
        X4: sts.tuple(V1Junction, V1Junction, V1Junction, V1Junction),
        X5: sts.tuple(V1Junction, V1Junction, V1Junction, V1Junction, V1Junction),
        X6: sts.tuple(V1Junction, V1Junction, V1Junction, V1Junction, V1Junction, V1Junction),
        X7: sts.tuple(V1Junction, V1Junction, V1Junction, V1Junction, V1Junction, V1Junction, V1Junction),
        X8: sts.tuple(V1Junction, V1Junction, V1Junction, V1Junction, V1Junction, V1Junction, V1Junction, V1Junction),
    }
})

export const V0MultiAsset = sts.closedEnum(() => {
    return  {
        AbstractFungible: sts.enumStruct({
            id: Type_10,
            amount: Type_46,
        }),
        AbstractNonFungible: sts.enumStruct({
            class: Type_10,
            instance: V1AssetInstance,
        }),
        All: sts.unit(),
        AllAbstractFungible: sts.enumStruct({
            id: Type_10,
        }),
        AllAbstractNonFungible: sts.enumStruct({
            class: Type_10,
        }),
        AllConcreteFungible: sts.enumStruct({
            id: V0MultiLocation,
        }),
        AllConcreteNonFungible: sts.enumStruct({
            class: V0MultiLocation,
        }),
        AllFungible: sts.unit(),
        AllNonFungible: sts.unit(),
        ConcreteFungible: sts.enumStruct({
            id: V0MultiLocation,
            amount: Type_46,
        }),
        ConcreteNonFungible: sts.enumStruct({
            class: V0MultiLocation,
            instance: V1AssetInstance,
        }),
        None: sts.unit(),
    }
})

export const Type_137 = sts.array(V0MultiAsset)

export const V1MultiAsset = sts.struct(() => {
    return  {
        id: V1AssetId,
        fun: V1Fungibility,
    }
})

export const V1MultiAssets = sts.array(V1MultiAsset)

export const V0MultiLocation = sts.closedEnum(() => {
    return  {
        Null: sts.unit(),
        X1: V0Junction,
        X2: sts.tuple(V0Junction, V0Junction),
        X3: sts.tuple(V0Junction, V0Junction, V0Junction),
        X4: sts.tuple(V0Junction, V0Junction, V0Junction, V0Junction),
        X5: sts.tuple(V0Junction, V0Junction, V0Junction, V0Junction, V0Junction),
        X6: sts.tuple(V0Junction, V0Junction, V0Junction, V0Junction, V0Junction, V0Junction),
        X7: sts.tuple(V0Junction, V0Junction, V0Junction, V0Junction, V0Junction, V0Junction, V0Junction),
        X8: sts.tuple(V0Junction, V0Junction, V0Junction, V0Junction, V0Junction, V0Junction, V0Junction, V0Junction),
    }
})

export const Type_128 = sts.tuple(Type_4, V2Error)

export const Type_127 = sts.option(() => Type_128)

export const V2WeightLimit = sts.closedEnum(() => {
    return  {
        Limited: Type_113,
        Unlimited: sts.unit(),
    }
})

export const V1MultiAssetFilter = sts.closedEnum(() => {
    return  {
        Definite: V1MultiAssets,
        Wild: V1WildMultiAsset,
    }
})

export const Type_111 = number

export const Type_113 = bigint

export const V0OriginKind = sts.closedEnum(() => {
    return  {
        Native: sts.unit(),
        SovereignAccount: sts.unit(),
        Superuser: sts.unit(),
        Xcm: sts.unit(),
    }
})

export const DoubleEncoded = sts.struct(() => {
    return  {
        encoded: Type_10,
    }
})

export const V1CandidateDescriptor = sts.struct(() => {
    return  {
        paraId: Id,
        relayParent: H256,
        collator: V0Public,
        persistedValidationDataHash: H256,
        povHash: H256,
        erasureRoot: H256,
        signature: V0Signature,
        paraHead: H256,
        validationCodeHash: ValidationCodeHash,
    }
})

export const V1Junction = sts.closedEnum(() => {
    return  {
        AccountId32: sts.enumStruct({
            network: V0NetworkId,
            id: Type_1,
        }),
        AccountIndex64: sts.enumStruct({
            network: V0NetworkId,
            index: Type_113,
        }),
        AccountKey20: sts.enumStruct({
            network: V0NetworkId,
            key: Type_64,
        }),
        GeneralIndex: Type_46,
        GeneralKey: Type_10,
        OnlyChild: sts.unit(),
        PalletInstance: Type_2,
        Parachain: Type_111,
        Plurality: sts.enumStruct({
            id: V0BodyId,
            part: V0BodyPart,
        }),
    }
})

export const Type_46 = bigint

export const V1AssetInstance = sts.closedEnum(() => {
    return  {
        Array16: Type_33,
        Array32: Type_1,
        Array4: Type_14,
        Array8: Type_125,
        Blob: Type_10,
        Index: Type_46,
        Undefined: sts.unit(),
    }
})

export const V1AssetId = sts.closedEnum(() => {
    return  {
        Abstract: Type_10,
        Concrete: V1MultiLocation,
    }
})

export const V1Fungibility = sts.closedEnum(() => {
    return  {
        Fungible: Type_46,
        NonFungible: V1AssetInstance,
    }
})

export const V0Junction = sts.closedEnum(() => {
    return  {
        AccountId32: sts.enumStruct({
            network: V0NetworkId,
            id: Type_1,
        }),
        AccountIndex64: sts.enumStruct({
            network: V0NetworkId,
            index: Type_113,
        }),
        AccountKey20: sts.enumStruct({
            network: V0NetworkId,
            key: Type_64,
        }),
        GeneralIndex: Type_46,
        GeneralKey: Type_10,
        OnlyChild: sts.unit(),
        PalletInstance: Type_2,
        Parachain: Type_111,
        Parent: sts.unit(),
        Plurality: sts.enumStruct({
            id: V0BodyId,
            part: V0BodyPart,
        }),
    }
})

export const V1WildMultiAsset = sts.closedEnum(() => {
    return  {
        All: sts.unit(),
        AllOf: sts.enumStruct({
            id: V1AssetId,
            fun: V1WildFungibility,
        }),
    }
})

export const V0Public = sts.bytes()

export const V0Signature = sts.bytes()

export const ValidationCodeHash = sts.bytes()

export const V0NetworkId = sts.closedEnum(() => {
    return  {
        Any: sts.unit(),
        Kusama: sts.unit(),
        Named: Type_10,
        Polkadot: sts.unit(),
    }
})

export const Type_64 = sts.bytes()

export const V0BodyId = sts.closedEnum(() => {
    return  {
        Executive: sts.unit(),
        Index: Type_111,
        Judicial: sts.unit(),
        Legislative: sts.unit(),
        Named: Type_10,
        Technical: sts.unit(),
        Unit: sts.unit(),
    }
})

export const V0BodyPart = sts.closedEnum(() => {
    return  {
        AtLeastProportion: sts.enumStruct({
            nom: Type_111,
            denom: Type_111,
        }),
        Fraction: sts.enumStruct({
            nom: Type_111,
            denom: Type_111,
        }),
        Members: sts.enumStruct({
            count: Type_111,
        }),
        MoreThanProportion: sts.enumStruct({
            nom: Type_111,
            denom: Type_111,
        }),
        Voice: sts.unit(),
    }
})

export const Type_33 = sts.bytes()

export const Type_14 = sts.bytes()

export const Type_125 = sts.bytes()

export const V1WildFungibility = sts.closedEnum(() => {
    return  {
        Fungible: sts.unit(),
        NonFungible: sts.unit(),
    }
})
