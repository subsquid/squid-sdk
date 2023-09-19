
export const ValidationCodeHash = sts.bytes()

export const Id = sts.number()

export const Type_49 = sts.closedEnum(() => {
    return  {
        Err: DispatchError,
        Ok: sts.unit(),
    }
})

export const V1MultiLocation = sts.struct(() => {
    return  {
        parents: Type_2,
        interior: V1Junctions,
    }
})

export const Type_8 = sts.bigint()

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
        ExecutionResult: Type_132,
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
            maxAssets: Type_116,
            beneficiary: V1MultiLocation,
        }),
        DepositReserveAsset: sts.enumStruct({
            assets: V1MultiAssetFilter,
            maxAssets: Type_116,
            dest: V1MultiLocation,
            xcm: V2Xcm,
        }),
        DescendOrigin: V1Junctions,
        ExchangeAsset: sts.enumStruct({
            give: V1MultiAssetFilter,
            receive: V1MultiAssets,
        }),
        HrmpChannelAccepted: sts.enumStruct({
            recipient: Type_116,
        }),
        HrmpChannelClosing: sts.enumStruct({
            initiator: Type_116,
            sender: Type_116,
            recipient: Type_116,
        }),
        HrmpNewChannelOpenRequest: sts.enumStruct({
            sender: Type_116,
            maxMessageSize: Type_116,
            maxCapacity: Type_116,
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
            queryId: Type_118,
            dest: V1MultiLocation,
            assets: V1MultiAssetFilter,
            maxResponseWeight: Type_118,
        }),
        QueryResponse: sts.enumStruct({
            queryId: Type_118,
            response: V2Response,
            maxWeight: Type_118,
        }),
        ReceiveTeleportedAsset: V1MultiAssets,
        RefundSurplus: sts.unit(),
        ReportError: sts.enumStruct({
            queryId: Type_118,
            dest: V1MultiLocation,
            maxResponseWeight: Type_118,
        }),
        ReserveAssetDeposited: V1MultiAssets,
        SetAppendix: V2Xcm,
        SetErrorHandler: V2Xcm,
        SubscribeVersion: sts.enumStruct({
            queryId: Type_118,
            maxResponseWeight: Type_118,
        }),
        Transact: sts.enumStruct({
            originType: V0OriginKind,
            requireWeightAtMost: Type_118,
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
        Trap: Type_118,
        UnsubscribeVersion: sts.unit(),
        WithdrawAsset: V1MultiAssets,
    }
})

export const V2Xcm = sts.array(V2Instruction)

export const Type_1 = sts.bytes()

export const V2Outcome = sts.closedEnum(() => {
    return  {
        Complete: Type_8,
        Error: V2Error,
        Incomplete: sts.tuple(Type_8, V2Error),
    }
})

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
        TooManyConsumers: sts.unit(),
    }
})

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

export const V1MultiAsset = sts.struct(() => {
    return  {
        id: V1AssetId,
        fun: V1Fungibility,
    }
})

export const V1MultiAssets = sts.array(V1MultiAsset)

export const Type_4 = sts.number()

export const Type_133 = sts.tuple(Type_4, V2Error)

export const Type_132 = sts.option(() => Type_133)

export const V2WeightLimit = sts.closedEnum(() => {
    return  {
        Limited: Type_118,
        Unlimited: sts.unit(),
    }
})

export const V1MultiAssetFilter = sts.closedEnum(() => {
    return  {
        Definite: V1MultiAssets,
        Wild: V1WildMultiAsset,
    }
})

export const Type_116 = number

export const Type_118 = bigint

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

export const V1Junction = sts.closedEnum(() => {
    return  {
        AccountId32: sts.enumStruct({
            network: V0NetworkId,
            id: Type_1,
        }),
        AccountIndex64: sts.enumStruct({
            network: V0NetworkId,
            index: Type_118,
        }),
        AccountKey20: sts.enumStruct({
            network: V0NetworkId,
            key: Type_63,
        }),
        GeneralIndex: Type_43,
        GeneralKey: Type_10,
        OnlyChild: sts.unit(),
        PalletInstance: Type_2,
        Parachain: Type_116,
        Plurality: sts.enumStruct({
            id: V0BodyId,
            part: V0BodyPart,
        }),
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
        Fungible: Type_43,
        NonFungible: V1AssetInstance,
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

export const Type_10 = sts.bytes()

export const V0NetworkId = sts.closedEnum(() => {
    return  {
        Any: sts.unit(),
        Kusama: sts.unit(),
        Named: Type_10,
        Polkadot: sts.unit(),
    }
})

export const Type_63 = sts.bytes()

export const Type_43 = bigint

export const V0BodyId = sts.closedEnum(() => {
    return  {
        Executive: sts.unit(),
        Index: Type_116,
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
            nom: Type_116,
            denom: Type_116,
        }),
        Fraction: sts.enumStruct({
            nom: Type_116,
            denom: Type_116,
        }),
        Members: sts.enumStruct({
            count: Type_116,
        }),
        MoreThanProportion: sts.enumStruct({
            nom: Type_116,
            denom: Type_116,
        }),
        Voice: sts.unit(),
    }
})

export const V1AssetInstance = sts.closedEnum(() => {
    return  {
        Array16: Type_30,
        Array32: Type_1,
        Array4: Type_14,
        Array8: Type_130,
        Blob: Type_10,
        Index: Type_43,
        Undefined: sts.unit(),
    }
})

export const V1WildFungibility = sts.closedEnum(() => {
    return  {
        Fungible: sts.unit(),
        NonFungible: sts.unit(),
    }
})

export const Type_30 = sts.bytes()

export const Type_14 = sts.bytes()

export const Type_130 = sts.bytes()
