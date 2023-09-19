
export const H256 = sts.bytes()

export const V1MultiLocation = sts.struct(() => {
    return  {
        parents: Type_2,
        interior: V1Junctions,
    }
})

export const VersionedMultiAssets = sts.closedEnum(() => {
    return  {
        V0: Type_394,
        V1: V1MultiAssets,
    }
})

export const Type_10 = sts.bigint()

export const Type_489 = sts.option(() => V1MultiLocation)

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
        MaxWeightInvalid: sts.unit(),
        MultiLocationFull: sts.unit(),
        MultiLocationNotInvertible: sts.unit(),
        NotHoldingFees: sts.unit(),
        NotWithdrawable: sts.unit(),
        Overflow: sts.unit(),
        TooExpensive: sts.unit(),
        Transport: sts.unit(),
        Trap: Type_10,
        UnhandledXcmVersion: sts.unit(),
        Unimplemented: sts.unit(),
        UnknownClaim: sts.unit(),
        Unroutable: sts.unit(),
        UntrustedReserveLocation: sts.unit(),
        UntrustedTeleportLocation: sts.unit(),
        WeightLimitReached: Type_10,
        WeightNotComputable: sts.unit(),
    }
})

export const V2Response = sts.closedEnum(() => {
    return  {
        Assets: V1MultiAssets,
        ExecutionResult: Type_420,
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
            maxAssets: Type_82,
            beneficiary: V1MultiLocation,
        }),
        DepositReserveAsset: sts.enumStruct({
            assets: V1MultiAssetFilter,
            maxAssets: Type_82,
            dest: V1MultiLocation,
            xcm: V2Xcm,
        }),
        DescendOrigin: V1Junctions,
        ExchangeAsset: sts.enumStruct({
            give: V1MultiAssetFilter,
            receive: V1MultiAssets,
        }),
        HrmpChannelAccepted: sts.enumStruct({
            recipient: Type_82,
        }),
        HrmpChannelClosing: sts.enumStruct({
            initiator: Type_82,
            sender: Type_82,
            recipient: Type_82,
        }),
        HrmpNewChannelOpenRequest: sts.enumStruct({
            sender: Type_82,
            maxMessageSize: Type_82,
            maxCapacity: Type_82,
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
            queryId: Type_9,
            dest: V1MultiLocation,
            assets: V1MultiAssetFilter,
            maxResponseWeight: Type_9,
        }),
        QueryResponse: sts.enumStruct({
            queryId: Type_9,
            response: V2Response,
            maxWeight: Type_9,
        }),
        ReceiveTeleportedAsset: V1MultiAssets,
        RefundSurplus: sts.unit(),
        ReportError: sts.enumStruct({
            queryId: Type_9,
            dest: V1MultiLocation,
            maxResponseWeight: Type_9,
        }),
        ReserveAssetDeposited: V1MultiAssets,
        SetAppendix: V2Xcm,
        SetErrorHandler: V2Xcm,
        SubscribeVersion: sts.enumStruct({
            queryId: Type_9,
            maxResponseWeight: Type_9,
        }),
        Transact: sts.enumStruct({
            originType: V0OriginKind,
            requireWeightAtMost: Type_9,
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
        Trap: Type_9,
        UnsubscribeVersion: sts.unit(),
        WithdrawAsset: V1MultiAssets,
    }
})

export const V2Xcm = sts.array(V2Instruction)

export const Type_4 = sts.number()

export const Type_2 = sts.number()

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
            id: Type_12,
            amount: Type_53,
        }),
        AbstractNonFungible: sts.enumStruct({
            class: Type_12,
            instance: V1AssetInstance,
        }),
        All: sts.unit(),
        AllAbstractFungible: sts.enumStruct({
            id: Type_12,
        }),
        AllAbstractNonFungible: sts.enumStruct({
            class: Type_12,
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
            amount: Type_53,
        }),
        ConcreteNonFungible: sts.enumStruct({
            class: V0MultiLocation,
            instance: V1AssetInstance,
        }),
        None: sts.unit(),
    }
})

export const Type_394 = sts.array(V0MultiAsset)

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

export const Type_421 = sts.tuple(Type_4, V2Error)

export const Type_420 = sts.option(() => Type_421)

export const V2WeightLimit = sts.closedEnum(() => {
    return  {
        Limited: Type_9,
        Unlimited: sts.unit(),
    }
})

export const V1MultiAssetFilter = sts.closedEnum(() => {
    return  {
        Definite: V1MultiAssets,
        Wild: V1WildMultiAsset,
    }
})

export const Type_82 = number

export const Type_9 = bigint

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
        encoded: Type_12,
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
            index: Type_9,
        }),
        AccountKey20: sts.enumStruct({
            network: V0NetworkId,
            key: Type_93,
        }),
        GeneralIndex: Type_53,
        GeneralKey: WeakBoundedVec,
        OnlyChild: sts.unit(),
        PalletInstance: Type_2,
        Parachain: Type_82,
        Plurality: sts.enumStruct({
            id: V0BodyId,
            part: V0BodyPart,
        }),
    }
})

export const Type_12 = sts.bytes()

export const Type_53 = bigint

export const V1AssetInstance = sts.closedEnum(() => {
    return  {
        Array16: Type_40,
        Array32: Type_1,
        Array4: Type_16,
        Array8: Type_192,
        Blob: Type_12,
        Index: Type_53,
        Undefined: sts.unit(),
    }
})

export const V1AssetId = sts.closedEnum(() => {
    return  {
        Abstract: Type_12,
        Concrete: V1MultiLocation,
    }
})

export const V1Fungibility = sts.closedEnum(() => {
    return  {
        Fungible: Type_53,
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
            index: Type_9,
        }),
        AccountKey20: sts.enumStruct({
            network: V0NetworkId,
            key: Type_93,
        }),
        GeneralIndex: Type_53,
        GeneralKey: WeakBoundedVec,
        OnlyChild: sts.unit(),
        PalletInstance: Type_2,
        Parachain: Type_82,
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

export const V0NetworkId = sts.closedEnum(() => {
    return  {
        Any: sts.unit(),
        Kusama: sts.unit(),
        Named: WeakBoundedVec,
        Polkadot: sts.unit(),
    }
})

export const Type_1 = sts.bytes()

export const Type_93 = sts.bytes()

export const WeakBoundedVec = sts.bytes()

export const V0BodyId = sts.closedEnum(() => {
    return  {
        Administration: sts.unit(),
        Defense: sts.unit(),
        Executive: sts.unit(),
        Index: Type_82,
        Judicial: sts.unit(),
        Legislative: sts.unit(),
        Named: WeakBoundedVec,
        Technical: sts.unit(),
        Treasury: sts.unit(),
        Unit: sts.unit(),
    }
})

export const V0BodyPart = sts.closedEnum(() => {
    return  {
        AtLeastProportion: sts.enumStruct({
            nom: Type_82,
            denom: Type_82,
        }),
        Fraction: sts.enumStruct({
            nom: Type_82,
            denom: Type_82,
        }),
        Members: sts.enumStruct({
            count: Type_82,
        }),
        MoreThanProportion: sts.enumStruct({
            nom: Type_82,
            denom: Type_82,
        }),
        Voice: sts.unit(),
    }
})

export const Type_40 = sts.bytes()

export const Type_16 = sts.bytes()

export const Type_192 = sts.bytes()

export const V1WildFungibility = sts.closedEnum(() => {
    return  {
        Fungible: sts.unit(),
        NonFungible: sts.unit(),
    }
})
