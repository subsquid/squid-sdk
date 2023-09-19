
export const MultiLocation = sts.struct(() => {
    return  {
        parents: Type_7,
        interior: JunctionsV1,
    }
})

export const Xcm = sts.closedEnum(() => {
    return  {
        HrmpChannelAccepted: sts.enumStruct({
            recipient: Type_95,
        }),
        HrmpChannelClosing: sts.enumStruct({
            initiator: Type_95,
            sender: Type_95,
            recipient: Type_95,
        }),
        HrmpNewChannelOpenRequest: sts.enumStruct({
            sender: Type_95,
            maxMessageSize: Type_95,
            maxCapacity: Type_95,
        }),
        QueryResponse: sts.enumStruct({
            queryId: Type_392,
            response: ResponseV1,
        }),
        ReceiveTeleportedAsset: sts.enumStruct({
            assets: MultiAssetsV1,
            effects: Type_436,
        }),
        RelayedFrom: sts.enumStruct({
            who: MultiLocationV1,
            message: XcmV1,
        }),
        ReserveAssetDeposit: sts.enumStruct({
            assets: MultiAssetsV1,
            effects: Type_436,
        }),
        Transact: sts.enumStruct({
            originType: XcmOriginKind,
            requireWeightAtMost: Type_35,
            call: DoubleEncodedCall,
        }),
        TransferAsset: sts.enumStruct({
            assets: MultiAssetsV1,
            dest: MultiLocationV1,
        }),
        TransferReserveAsset: sts.enumStruct({
            assets: MultiAssetsV1,
            dest: MultiLocationV1,
            effects: Type_436,
        }),
        WithdrawAsset: sts.enumStruct({
            assets: MultiAssetsV1,
            effects: Type_436,
        }),
    }
})

export const MessageId = sts.bytes()

export const Outcome = sts.closedEnum(() => {
    return  {
        Complete: Weight,
        Error: XcmErrorV0,
        Incomplete: Type_531,
    }
})

export const ParaId = sts.number()

export const OverweightIndex = sts.bigint()

export const Weight = sts.bigint()

export const HrmpChannelId = sts.struct(() => {
    return  {
        sender: Type_11,
        receiver: Type_11,
    }
})

export const Type_7 = sts.number()

export const JunctionsV1 = sts.closedEnum(() => {
    return  {
        Here: sts.unit(),
        X1: JunctionV1,
        X2: Type_406,
        X3: Type_407,
        X4: Type_408,
        X5: Type_409,
        X6: Type_410,
        X7: Type_411,
        X8: Type_412,
    }
})

export const Type_95 = number

export const Type_392 = bigint

export const ResponseV1 = sts.closedEnum(() => {
    return  {
        Assets: MultiAssetsV1,
    }
})

export const MultiAssetV1 = sts.struct(() => {
    return  {
        id: XcmAssetId,
        fungibility: FungibilityV1,
    }
})

export const MultiAssetsV1 = sts.array(MultiAssetV1)

export const XcmOrderV1 = sts.closedEnum(() => {
    return  {
        BuyExecution: sts.enumStruct({
            fees: MultiAssetV1,
            weight: Type_35,
            debt: Type_35,
            haltOnError: Type_82,
            instructions: Type_441,
        }),
        DepositAsset: sts.enumStruct({
            assets: MultiAssetFilterV1,
            maxAssets: Type_11,
            beneficiary: MultiLocationV1,
        }),
        DepositReserveAsset: sts.enumStruct({
            assets: MultiAssetFilterV1,
            maxAssets: Type_11,
            dest: MultiLocationV1,
            effects: Type_436,
        }),
        ExchangeAsset: sts.enumStruct({
            give: MultiAssetFilterV1,
            receive: MultiAssetsV1,
        }),
        InitiateReserveWithdraw: sts.enumStruct({
            assets: MultiAssetFilterV1,
            reserve: MultiLocationV1,
            effects: Type_436,
        }),
        InitiateTeleport: sts.enumStruct({
            assets: MultiAssetFilterV1,
            dest: MultiLocationV1,
            effects: Type_436,
        }),
        Noop: sts.unit(),
        QueryHolding: sts.enumStruct({
            queryId: Type_392,
            dest: MultiLocationV1,
            assets: MultiAssetFilterV1,
        }),
    }
})

export const Type_436 = sts.array(XcmOrderV1)

export const MultiLocationV1 = sts.struct(() => {
    return  {
        parents: Type_7,
        interior: JunctionsV1,
    }
})

export const XcmV1 = sts.closedEnum(() => {
    return  {
        HrmpChannelAccepted: sts.enumStruct({
            recipient: Type_95,
        }),
        HrmpChannelClosing: sts.enumStruct({
            initiator: Type_95,
            sender: Type_95,
            recipient: Type_95,
        }),
        HrmpNewChannelOpenRequest: sts.enumStruct({
            sender: Type_95,
            maxMessageSize: Type_95,
            maxCapacity: Type_95,
        }),
        QueryResponse: sts.enumStruct({
            queryId: Type_392,
            response: ResponseV1,
        }),
        ReceiveTeleportedAsset: sts.enumStruct({
            assets: MultiAssetsV1,
            effects: Type_436,
        }),
        RelayedFrom: sts.enumStruct({
            who: MultiLocationV1,
            message: XcmV1,
        }),
        ReserveAssetDeposit: sts.enumStruct({
            assets: MultiAssetsV1,
            effects: Type_436,
        }),
        Transact: sts.enumStruct({
            originType: XcmOriginKind,
            requireWeightAtMost: Type_35,
            call: DoubleEncodedCall,
        }),
        TransferAsset: sts.enumStruct({
            assets: MultiAssetsV1,
            dest: MultiLocationV1,
        }),
        TransferReserveAsset: sts.enumStruct({
            assets: MultiAssetsV1,
            dest: MultiLocationV1,
            effects: Type_436,
        }),
        WithdrawAsset: sts.enumStruct({
            assets: MultiAssetsV1,
            effects: Type_436,
        }),
    }
})

export const XcmOriginKind = sts.closedEnum(() => {
    return  {
        Native: sts.unit(),
        SovereignAccount: sts.unit(),
        Superuser: sts.unit(),
        Xcm: sts.unit(),
    }
})

export const Type_35 = sts.bigint()

export const DoubleEncodedCall = sts.struct(() => {
    return  {
        encoded: Type_12,
    }
})

export const XcmErrorV0 = sts.closedEnum(() => {
    return  {
        AssetNotFound: sts.unit(),
        BadOrigin: sts.unit(),
        Barrier: sts.unit(),
        CannotReachDestination: Type_533,
        DestinationBufferOverflow: sts.unit(),
        EscalationOfPrivilege: sts.unit(),
        ExceedsMaxMessageSize: sts.unit(),
        FailedToDecode: sts.unit(),
        FailedToTransactAsset: sts.unit(),
        LocationCannotHold: sts.unit(),
        MultiLocationFull: sts.unit(),
        NotHoldingFees: sts.unit(),
        NotWithdrawable: sts.unit(),
        Overflow: sts.unit(),
        RecursionLimitReached: sts.unit(),
        SendFailed: sts.unit(),
        TooExpensive: sts.unit(),
        TooMuchWeightRequired: sts.unit(),
        Undefined: sts.unit(),
        UnhandledEffect: sts.unit(),
        UnhandledXcmMessage: sts.unit(),
        UnhandledXcmVersion: sts.unit(),
        Unimplemented: sts.unit(),
        UntrustedReserveLocation: sts.unit(),
        UntrustedTeleportLocation: sts.unit(),
        WeightLimitReached: Weight,
        WeightNotComputable: sts.unit(),
        Wildcard: sts.unit(),
    }
})

export const Type_531 = sts.tuple(Weight, XcmErrorV0)

export const Type_11 = sts.number()

export const JunctionV1 = sts.closedEnum(() => {
    return  {
        AccountId32: sts.enumStruct({
            network: NetworkId,
            id: AccountId,
        }),
        AccountIndex64: sts.enumStruct({
            network: NetworkId,
            index: Type_392,
        }),
        AccountKey20: sts.enumStruct({
            network: NetworkId,
            key: Type_15,
        }),
        GeneralIndex: Type_393,
        GeneralKey: Type_12,
        OnlyChild: sts.unit(),
        PalletInstance: Type_7,
        Parachain: Type_95,
        Plurality: sts.enumStruct({
            id: BodyId,
            part: BodyPart,
        }),
    }
})

export const Type_406 = sts.tuple(JunctionV1, JunctionV1)

export const Type_407 = sts.tuple(JunctionV1, JunctionV1, JunctionV1)

export const Type_408 = sts.tuple(JunctionV1, JunctionV1, JunctionV1, JunctionV1)

export const Type_409 = sts.tuple(JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1)

export const Type_410 = sts.tuple(JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1)

export const Type_411 = sts.tuple(JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1)

export const Type_412 = sts.tuple(JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1, JunctionV1)

export const XcmAssetId = sts.closedEnum(() => {
    return  {
        Abstract: Type_12,
        Concrete: MultiLocation,
    }
})

export const FungibilityV1 = sts.closedEnum(() => {
    return  {
        Fungible: Type_393,
        NonFungible: AssetInstanceV1,
    }
})

export const Type_82 = sts.boolean()

export const Type_441 = sts.array(XcmV1)

export const MultiAssetFilterV1 = sts.closedEnum(() => {
    return  {
        Definite: MultiAssetsV1,
        Wild: WildMultiAssetV1,
    }
})

export const Type_12 = sts.bytes()

export const Type_533 = sts.tuple(MultiLocation, Xcm)

export const NetworkId = sts.closedEnum(() => {
    return  {
        Any: sts.unit(),
        Kusama: sts.unit(),
        Named: Type_12,
        Polkadot: sts.unit(),
    }
})

export const AccountId = sts.bytes()

export const Type_15 = sts.bytes()

export const Type_393 = bigint

export const BodyId = sts.closedEnum(() => {
    return  {
        Executive: sts.unit(),
        Index: Type_95,
        Judicial: sts.unit(),
        Legislative: sts.unit(),
        Named: Type_12,
        Technical: sts.unit(),
        Unit: sts.unit(),
    }
})

export const BodyPart = sts.closedEnum(() => {
    return  {
        AtLeastProportion: sts.enumStruct({
            nom: Type_95,
            denom: Type_95,
        }),
        Fraction: sts.enumStruct({
            nom: Type_95,
            denom: Type_95,
        }),
        Members: Type_95,
        MoreThanProportion: sts.enumStruct({
            nom: Type_95,
            denom: Type_95,
        }),
        Voice: sts.unit(),
    }
})

export const AssetInstanceV1 = sts.closedEnum(() => {
    return  {
        Array16: Type_179,
        Array32: Type_6,
        Array4: Type_64,
        Array8: Type_171,
        Blob: Type_12,
        Index: Type_393,
        Undefined: sts.unit(),
    }
})

export const WildMultiAssetV1 = sts.closedEnum(() => {
    return  {
        All: sts.unit(),
        AllOf: sts.enumStruct({
            id: XcmAssetId,
            fungibility: WildFungibilityV1,
        }),
    }
})

export const Type_179 = sts.bytes()

export const Type_6 = sts.bytes()

export const Type_64 = sts.bytes()

export const Type_171 = sts.bytes()

export const WildFungibilityV1 = sts.closedEnum(() => {
    return  {
        Fungible: sts.unit(),
        NonFungible: sts.unit(),
    }
})
