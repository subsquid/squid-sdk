
export const H256 = sts.bytes()

export const V3MultiLocation = sts.struct(() => {
    return  {
        parents: Type_2,
        interior: V3Junctions,
    }
})

export const VersionedMultiAssets = sts.closedEnum(() => {
    return  {
        V2: V2MultiAssets,
        V3: V3MultiAssets,
    }
})

export const V3MultiAsset = sts.struct(() => {
    return  {
        id: V3AssetId,
        fun: V3Fungibility,
    }
})

export const V3MultiAssets = sts.array(V3MultiAsset)

export const Type_10 = sts.bigint()

export const Type_433 = sts.option(() => V3MultiLocation)

export const VersionedMultiLocation = sts.closedEnum(() => {
    return  {
        V2: V2MultiLocation,
        V3: V3MultiLocation,
    }
})

export const V3Error = sts.closedEnum(() => {
    return  {
        AssetNotFound: sts.unit(),
        BadOrigin: sts.unit(),
        Barrier: sts.unit(),
        DestinationUnsupported: sts.unit(),
        ExceedsMaxMessageSize: sts.unit(),
        ExceedsStackLimit: sts.unit(),
        ExpectationFalse: sts.unit(),
        ExportError: sts.unit(),
        FailedToDecode: sts.unit(),
        FailedToTransactAsset: sts.unit(),
        FeesNotMet: sts.unit(),
        HoldingWouldOverflow: sts.unit(),
        InvalidLocation: sts.unit(),
        LocationCannotHold: sts.unit(),
        LocationFull: sts.unit(),
        LocationNotInvertible: sts.unit(),
        LockError: sts.unit(),
        MaxWeightInvalid: sts.unit(),
        NameMismatch: sts.unit(),
        NoDeal: sts.unit(),
        NoPermission: sts.unit(),
        NotDepositable: sts.unit(),
        NotHoldingFees: sts.unit(),
        NotWithdrawable: sts.unit(),
        Overflow: sts.unit(),
        PalletNotFound: sts.unit(),
        ReanchorFailed: sts.unit(),
        TooExpensive: sts.unit(),
        Transport: sts.unit(),
        Trap: Type_10,
        Unanchored: sts.unit(),
        UnhandledXcmVersion: sts.unit(),
        Unimplemented: sts.unit(),
        UnknownClaim: sts.unit(),
        Unroutable: sts.unit(),
        UntrustedReserveLocation: sts.unit(),
        UntrustedTeleportLocation: sts.unit(),
        VersionIncompatible: sts.unit(),
        WeightLimitReached: Weight,
        WeightNotComputable: sts.unit(),
    }
})

export const V3Response = sts.closedEnum(() => {
    return  {
        Assets: V3MultiAssets,
        DispatchResult: V3MaybeErrorCode,
        ExecutionResult: Type_426,
        Null: sts.unit(),
        PalletsInfo: V3VecPalletInfo,
        Version: Type_4,
    }
})

export const V3Instruction = sts.closedEnum(() => {
    return  {
        AliasOrigin: V3MultiLocation,
        BurnAsset: V3MultiAssets,
        BuyExecution: sts.enumStruct({
            fees: V3MultiAsset,
            weightLimit: V3WeightLimit,
        }),
        ClaimAsset: sts.enumStruct({
            assets: V3MultiAssets,
            ticket: V3MultiLocation,
        }),
        ClearError: sts.unit(),
        ClearOrigin: sts.unit(),
        ClearTopic: sts.unit(),
        ClearTransactStatus: sts.unit(),
        DepositAsset: sts.enumStruct({
            assets: V3MultiAssetFilter,
            beneficiary: V3MultiLocation,
        }),
        DepositReserveAsset: sts.enumStruct({
            assets: V3MultiAssetFilter,
            dest: V3MultiLocation,
            xcm: V3Xcm,
        }),
        DescendOrigin: V3Junctions,
        ExchangeAsset: sts.enumStruct({
            give: V3MultiAssetFilter,
            want: V3MultiAssets,
            maximal: Type_37,
        }),
        ExpectAsset: V3MultiAssets,
        ExpectError: Type_426,
        ExpectOrigin: Type_433,
        ExpectPallet: sts.enumStruct({
            index: Type_82,
            name: Type_12,
            moduleName: Type_12,
            crateMajor: Type_82,
            minCrateMinor: Type_82,
        }),
        ExpectTransactStatus: V3MaybeErrorCode,
        ExportMessage: sts.enumStruct({
            network: V3NetworkId,
            destination: V3Junctions,
            xcm: V3Xcm,
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
            assets: V3MultiAssetFilter,
            reserve: V3MultiLocation,
            xcm: V3Xcm,
        }),
        InitiateTeleport: sts.enumStruct({
            assets: V3MultiAssetFilter,
            dest: V3MultiLocation,
            xcm: V3Xcm,
        }),
        LockAsset: sts.enumStruct({
            asset: V3MultiAsset,
            unlocker: V3MultiLocation,
        }),
        NoteUnlockable: sts.enumStruct({
            asset: V3MultiAsset,
            owner: V3MultiLocation,
        }),
        QueryPallet: sts.enumStruct({
            moduleName: Type_12,
            responseInfo: V3QueryResponseInfo,
        }),
        QueryResponse: sts.enumStruct({
            queryId: Type_9,
            response: V3Response,
            maxWeight: Weight,
            querier: Type_433,
        }),
        ReceiveTeleportedAsset: V3MultiAssets,
        RefundSurplus: sts.unit(),
        ReportError: V3QueryResponseInfo,
        ReportHolding: sts.enumStruct({
            responseInfo: V3QueryResponseInfo,
            assets: V3MultiAssetFilter,
        }),
        ReportTransactStatus: V3QueryResponseInfo,
        RequestUnlock: sts.enumStruct({
            asset: V3MultiAsset,
            locker: V3MultiLocation,
        }),
        ReserveAssetDeposited: V3MultiAssets,
        SetAppendix: V3Xcm,
        SetErrorHandler: V3Xcm,
        SetFeesMode: sts.enumStruct({
            jitWithdraw: Type_37,
        }),
        SetTopic: Type_1,
        SubscribeVersion: sts.enumStruct({
            queryId: Type_9,
            maxResponseWeight: Weight,
        }),
        Transact: sts.enumStruct({
            originKind: V2OriginKind,
            requireWeightAtMost: Weight,
            call: DoubleEncoded,
        }),
        TransferAsset: sts.enumStruct({
            assets: V3MultiAssets,
            beneficiary: V3MultiLocation,
        }),
        TransferReserveAsset: sts.enumStruct({
            assets: V3MultiAssets,
            dest: V3MultiLocation,
            xcm: V3Xcm,
        }),
        Trap: Type_9,
        UniversalOrigin: V3Junction,
        UnlockAsset: sts.enumStruct({
            asset: V3MultiAsset,
            target: V3MultiLocation,
        }),
        UnpaidExecution: sts.enumStruct({
            weightLimit: V3WeightLimit,
            checkOrigin: Type_433,
        }),
        UnsubscribeVersion: sts.unit(),
        WithdrawAsset: V3MultiAssets,
    }
})

export const V3Xcm = sts.array(V3Instruction)

export const Type_4 = sts.number()

export const Type_1 = sts.bytes()

export const V3Outcome = sts.closedEnum(() => {
    return  {
        Complete: Weight,
        Error: V3Error,
        Incomplete: sts.tuple(Weight, V3Error),
    }
})

export const Type_2 = sts.number()

export const V3Junctions = sts.closedEnum(() => {
    return  {
        Here: sts.unit(),
        X1: V3Junction,
        X2: sts.tuple(V3Junction, V3Junction),
        X3: sts.tuple(V3Junction, V3Junction, V3Junction),
        X4: sts.tuple(V3Junction, V3Junction, V3Junction, V3Junction),
        X5: sts.tuple(V3Junction, V3Junction, V3Junction, V3Junction, V3Junction),
        X6: sts.tuple(V3Junction, V3Junction, V3Junction, V3Junction, V3Junction, V3Junction),
        X7: sts.tuple(V3Junction, V3Junction, V3Junction, V3Junction, V3Junction, V3Junction, V3Junction),
        X8: sts.tuple(V3Junction, V3Junction, V3Junction, V3Junction, V3Junction, V3Junction, V3Junction, V3Junction),
    }
})

export const V2MultiAsset = sts.struct(() => {
    return  {
        id: V2AssetId,
        fun: V2Fungibility,
    }
})

export const V2MultiAssets = sts.array(V2MultiAsset)

export const V3AssetId = sts.closedEnum(() => {
    return  {
        Abstract: Type_1,
        Concrete: V3MultiLocation,
    }
})

export const V3Fungibility = sts.closedEnum(() => {
    return  {
        Fungible: Type_53,
        NonFungible: V3AssetInstance,
    }
})

export const V2MultiLocation = sts.struct(() => {
    return  {
        parents: Type_2,
        interior: V2Junctions,
    }
})

export const Weight = sts.struct(() => {
    return  {
        refTime: Type_9,
        proofSize: Type_9,
    }
})

export const V3MaybeErrorCode = sts.closedEnum(() => {
    return  {
        Error: Type_12,
        Success: sts.unit(),
        TruncatedError: Type_12,
    }
})

export const Type_427 = sts.tuple(Type_4, V3Error)

export const Type_426 = sts.option(() => Type_427)

export const V3PalletInfo = sts.struct(() => {
    return  {
        index: Type_82,
        name: Type_12,
        moduleName: Type_12,
        major: Type_82,
        minor: Type_82,
        patch: Type_82,
    }
})

export const V3VecPalletInfo = sts.array(V3PalletInfo)

export const V3WeightLimit = sts.closedEnum(() => {
    return  {
        Limited: Weight,
        Unlimited: sts.unit(),
    }
})

export const V3MultiAssetFilter = sts.closedEnum(() => {
    return  {
        Definite: V3MultiAssets,
        Wild: V3WildMultiAsset,
    }
})

export const Type_37 = sts.boolean()

export const Type_82 = number

export const Type_12 = sts.bytes()

export const V3NetworkId = sts.closedEnum(() => {
    return  {
        BitcoinCash: sts.unit(),
        BitcoinCore: sts.unit(),
        ByFork: sts.enumStruct({
            blockNumber: Type_10,
            blockHash: Type_1,
        }),
        ByGenesis: Type_1,
        Ethereum: sts.enumStruct({
            chainId: Type_9,
        }),
        Kusama: sts.unit(),
        Polkadot: sts.unit(),
        Rococo: sts.unit(),
        Westend: sts.unit(),
        Wococo: sts.unit(),
    }
})

export const V3QueryResponseInfo = sts.struct(() => {
    return  {
        destination: V3MultiLocation,
        queryId: Type_9,
        maxWeight: Weight,
    }
})

export const Type_9 = bigint

export const V2OriginKind = sts.closedEnum(() => {
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

export const V3Junction = sts.closedEnum(() => {
    return  {
        AccountId32: sts.enumStruct({
            network: Type_159,
            id: Type_1,
        }),
        AccountIndex64: sts.enumStruct({
            network: Type_159,
            index: Type_9,
        }),
        AccountKey20: sts.enumStruct({
            network: Type_159,
            key: Type_93,
        }),
        GeneralIndex: Type_53,
        GeneralKey: sts.enumStruct({
            length: Type_2,
            data: Type_1,
        }),
        GlobalConsensus: V3NetworkId,
        OnlyChild: sts.unit(),
        PalletInstance: Type_2,
        Parachain: Type_82,
        Plurality: sts.enumStruct({
            id: V3BodyId,
            part: V3BodyPart,
        }),
    }
})

export const V2AssetId = sts.closedEnum(() => {
    return  {
        Abstract: Type_12,
        Concrete: V2MultiLocation,
    }
})

export const V2Fungibility = sts.closedEnum(() => {
    return  {
        Fungible: Type_53,
        NonFungible: V2AssetInstance,
    }
})

export const Type_53 = bigint

export const V3AssetInstance = sts.closedEnum(() => {
    return  {
        Array16: Type_40,
        Array32: Type_1,
        Array4: Type_16,
        Array8: Type_190,
        Index: Type_53,
        Undefined: sts.unit(),
    }
})

export const V2Junctions = sts.closedEnum(() => {
    return  {
        Here: sts.unit(),
        X1: V2Junction,
        X2: sts.tuple(V2Junction, V2Junction),
        X3: sts.tuple(V2Junction, V2Junction, V2Junction),
        X4: sts.tuple(V2Junction, V2Junction, V2Junction, V2Junction),
        X5: sts.tuple(V2Junction, V2Junction, V2Junction, V2Junction, V2Junction),
        X6: sts.tuple(V2Junction, V2Junction, V2Junction, V2Junction, V2Junction, V2Junction),
        X7: sts.tuple(V2Junction, V2Junction, V2Junction, V2Junction, V2Junction, V2Junction, V2Junction),
        X8: sts.tuple(V2Junction, V2Junction, V2Junction, V2Junction, V2Junction, V2Junction, V2Junction, V2Junction),
    }
})

export const V3WildMultiAsset = sts.closedEnum(() => {
    return  {
        All: sts.unit(),
        AllCounted: Type_82,
        AllOf: sts.enumStruct({
            id: V3AssetId,
            fun: V3WildFungibility,
        }),
        AllOfCounted: sts.enumStruct({
            id: V3AssetId,
            fun: V3WildFungibility,
            count: Type_82,
        }),
    }
})

export const Type_159 = sts.option(() => V3NetworkId)

export const Type_93 = sts.bytes()

export const V3BodyId = sts.closedEnum(() => {
    return  {
        Administration: sts.unit(),
        Defense: sts.unit(),
        Executive: sts.unit(),
        Index: Type_82,
        Judicial: sts.unit(),
        Legislative: sts.unit(),
        Moniker: Type_16,
        Technical: sts.unit(),
        Treasury: sts.unit(),
        Unit: sts.unit(),
    }
})

export const V3BodyPart = sts.closedEnum(() => {
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

export const V2AssetInstance = sts.closedEnum(() => {
    return  {
        Array16: Type_40,
        Array32: Type_1,
        Array4: Type_16,
        Array8: Type_190,
        Blob: Type_12,
        Index: Type_53,
        Undefined: sts.unit(),
    }
})

export const Type_40 = sts.bytes()

export const Type_16 = sts.bytes()

export const Type_190 = sts.bytes()

export const V2Junction = sts.closedEnum(() => {
    return  {
        AccountId32: sts.enumStruct({
            network: V2NetworkId,
            id: Type_1,
        }),
        AccountIndex64: sts.enumStruct({
            network: V2NetworkId,
            index: Type_9,
        }),
        AccountKey20: sts.enumStruct({
            network: V2NetworkId,
            key: Type_93,
        }),
        GeneralIndex: Type_53,
        GeneralKey: WeakBoundedVec,
        OnlyChild: sts.unit(),
        PalletInstance: Type_2,
        Parachain: Type_82,
        Plurality: sts.enumStruct({
            id: V2BodyId,
            part: V2BodyPart,
        }),
    }
})

export const V3WildFungibility = sts.closedEnum(() => {
    return  {
        Fungible: sts.unit(),
        NonFungible: sts.unit(),
    }
})

export const V2NetworkId = sts.closedEnum(() => {
    return  {
        Any: sts.unit(),
        Kusama: sts.unit(),
        Named: WeakBoundedVec,
        Polkadot: sts.unit(),
    }
})

export const WeakBoundedVec = sts.bytes()

export const V2BodyId = sts.closedEnum(() => {
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

export const V2BodyPart = sts.closedEnum(() => {
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
