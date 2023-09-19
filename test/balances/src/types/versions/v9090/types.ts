
export const EraIndex = sts.number()

export const Balance = sts.bigint()

export const AccountId = sts.bytes()

export const ReferendumIndex = sts.number()

export const DispatchResult = sts.closedEnum(() => {
    return  {
        Err: DispatchError,
        Ok: sts.unit(),
    }
})

export const CandidateReceipt = sts.struct(() => {
    return  {
        descriptor: CandidateDescriptor,
        commitmentsHash: Hash,
    }
})

export const HeadData = sts.bytes()

export const CoreIndex = sts.number()

export const GroupIndex = sts.number()

export const MessageId = sts.bytes()

export const Outcome = sts.closedEnum(() => {
    return  {
        Complete: Weight,
        Error: XcmErrorV0,
        Incomplete: Type_485,
    }
})

export const ParaId = sts.number()

export const Type_11 = sts.number()

export const Weight = sts.bigint()

export const HrmpChannelId = sts.struct(() => {
    return  {
        sender: Type_11,
        receiver: Type_11,
    }
})

export const DispatchError = sts.closedEnum(() => {
    return  {
        Arithmetic: ArithmeticError,
        BadOrigin: sts.unit(),
        CannotLookup: sts.unit(),
        ConsumerRemaining: sts.unit(),
        Module: DispatchErrorModule,
        NoProviders: sts.unit(),
        Other: sts.unit(),
        Token: TokenError,
    }
})

export const CandidateDescriptor = sts.struct(() => {
    return  {
        paraId: ParaId,
        relayParent: RelayChainHash,
        collatorId: CollatorId,
        persistedValidationDataHash: Hash,
        povHash: Hash,
        erasureRoot: Hash,
        signature: CollatorSignature,
        paraHead: Hash,
        validationCodeHash: ValidationCodeHash,
    }
})

export const Hash = sts.bytes()

export const XcmErrorV0 = sts.closedEnum(() => {
    return  {
        AssetNotFound: sts.unit(),
        BadOrigin: sts.unit(),
        Barrier: sts.unit(),
        CannotReachDestination: Type_487,
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

export const Type_485 = sts.tuple(Weight, XcmErrorV0)

export const ArithmeticError = sts.closedEnum(() => {
    return  {
        DivisionByZero: sts.unit(),
        Overflow: sts.unit(),
        Underflow: sts.unit(),
    }
})

export const DispatchErrorModule = sts.struct(() => {
    return  {
        index: Type_7,
        error: Type_7,
    }
})

export const TokenError = sts.closedEnum(() => {
    return  {
        BelowMinimum: sts.unit(),
        CannotCreate: sts.unit(),
        Frozen: sts.unit(),
        NoFunds: sts.unit(),
        Overflow: sts.unit(),
        Underflow: sts.unit(),
        UnknownAsset: sts.unit(),
        WouldDie: sts.unit(),
    }
})

export const RelayChainHash = sts.bytes()

export const CollatorId = sts.bytes()

export const CollatorSignature = sts.bytes()

export const ValidationCodeHash = sts.bytes()

export const MultiLocation = sts.closedEnum(() => {
    return  {
        Here: sts.unit(),
        X1: JunctionV0,
        X2: Type_395,
        X3: Type_396,
        X4: Type_397,
        X5: Type_398,
        X6: Type_399,
        X7: Type_400,
        X8: Type_401,
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
            queryId: Type_391,
            response: ResponseV0,
        }),
        ReceiveTeleportedAsset: sts.enumStruct({
            assets: Type_404,
            effects: Type_408,
        }),
        RelayedFrom: sts.enumStruct({
            who: MultiLocationV0,
            message: XcmV0,
        }),
        ReserveAssetDeposit: sts.enumStruct({
            assets: Type_404,
            effects: Type_408,
        }),
        Transact: sts.enumStruct({
            originType: XcmOriginKind,
            requireWeightAtMost: Type_35,
            call: DoubleEncodedCall,
        }),
        TransferAsset: sts.enumStruct({
            assets: Type_404,
            dest: MultiLocationV0,
        }),
        TransferReserveAsset: sts.enumStruct({
            assets: Type_404,
            dest: MultiLocationV0,
            effects: Type_408,
        }),
        WithdrawAsset: sts.enumStruct({
            assets: Type_404,
            effects: Type_408,
        }),
    }
})

export const Type_487 = sts.tuple(MultiLocation, Xcm)

export const Type_7 = sts.number()

export const JunctionV0 = sts.closedEnum(() => {
    return  {
        AccountId32: sts.enumStruct({
            network: NetworkId,
            id: AccountId,
        }),
        AccountIndex64: sts.enumStruct({
            network: NetworkId,
            index: Type_391,
        }),
        AccountKey20: sts.enumStruct({
            network: NetworkId,
            key: Type_15,
        }),
        GeneralIndex: Type_392,
        GeneralKey: Type_12,
        OnlyChild: sts.unit(),
        PalletInstance: Type_7,
        Parachain: Type_95,
        Parent: sts.unit(),
        Plurality: sts.enumStruct({
            id: BodyId,
            part: BodyPart,
        }),
    }
})

export const Type_395 = sts.tuple(JunctionV0, JunctionV0)

export const Type_396 = sts.tuple(JunctionV0, JunctionV0, JunctionV0)

export const Type_397 = sts.tuple(JunctionV0, JunctionV0, JunctionV0, JunctionV0)

export const Type_398 = sts.tuple(JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0)

export const Type_399 = sts.tuple(JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0)

export const Type_400 = sts.tuple(JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0)

export const Type_401 = sts.tuple(JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0)

export const Type_95 = number

export const Type_391 = bigint

export const ResponseV0 = sts.closedEnum(() => {
    return  {
        Assets: Type_404,
    }
})

export const MultiAssetV0 = sts.closedEnum(() => {
    return  {
        AbstractFungible: sts.enumStruct({
            id: Type_12,
            instance: Type_392,
        }),
        AbstractNonFungible: sts.enumStruct({
            class: Type_12,
            instance: AssetInstanceV0,
        }),
        All: sts.unit(),
        AllAbstractFungible: Type_12,
        AllAbstractNonFungible: Type_12,
        AllConcreteFungible: MultiLocationV0,
        AllConcreteNonFungible: MultiLocationV0,
        AllFungible: sts.unit(),
        AllNonFungible: sts.unit(),
        ConcreteFungible: sts.enumStruct({
            id: MultiLocationV0,
            amount: Type_392,
        }),
        ConcreteNonFungible: sts.enumStruct({
            class: MultiLocationV0,
            instance: AssetInstanceV0,
        }),
        None: sts.unit(),
    }
})

export const Type_404 = sts.array(MultiAssetV0)

export const XcmOrderV0 = sts.closedEnum(() => {
    return  {
        BuyExecution: sts.enumStruct({
            fees: MultiAsset,
            weight: Type_35,
            debt: Type_35,
            haltOnError: Type_82,
            xcm: Type_412,
        }),
        DepositAsset: sts.enumStruct({
            assets: Type_404,
            dest: MultiLocationV0,
        }),
        DepositReserveAsset: sts.enumStruct({
            assets: Type_404,
            dest: MultiLocationV0,
            effects: Type_408,
        }),
        ExchangeAsset: sts.enumStruct({
            give: Type_404,
            receive: Type_404,
        }),
        InitiateReserveWithdraw: sts.enumStruct({
            assets: Type_404,
            reserve: MultiLocationV0,
            effects: Type_408,
        }),
        InitiateTeleport: sts.enumStruct({
            assets: Type_410,
            dest: MultiLocationV0,
            effects: Type_408,
        }),
        Null: sts.unit(),
        QueryHolding: sts.enumStruct({
            queryId: Type_391,
            dest: MultiLocationV0,
            assets: Type_404,
        }),
    }
})

export const Type_408 = sts.array(XcmOrderV0)

export const MultiLocationV0 = sts.closedEnum(() => {
    return  {
        Here: sts.unit(),
        X1: JunctionV0,
        X2: Type_395,
        X3: Type_396,
        X4: Type_397,
        X5: Type_398,
        X6: Type_399,
        X7: Type_400,
        X8: Type_401,
    }
})

export const XcmV0 = sts.closedEnum(() => {
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
            queryId: Type_391,
            response: ResponseV0,
        }),
        ReceiveTeleportedAsset: sts.enumStruct({
            assets: Type_404,
            effects: Type_408,
        }),
        RelayedFrom: sts.enumStruct({
            who: MultiLocationV0,
            message: XcmV0,
        }),
        ReserveAssetDeposit: sts.enumStruct({
            assets: Type_404,
            effects: Type_408,
        }),
        Transact: sts.enumStruct({
            originType: XcmOriginKind,
            requireWeightAtMost: Type_35,
            call: DoubleEncodedCall,
        }),
        TransferAsset: sts.enumStruct({
            assets: Type_404,
            dest: MultiLocationV0,
        }),
        TransferReserveAsset: sts.enumStruct({
            assets: Type_404,
            dest: MultiLocationV0,
            effects: Type_408,
        }),
        WithdrawAsset: sts.enumStruct({
            assets: Type_404,
            effects: Type_408,
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

export const NetworkId = sts.closedEnum(() => {
    return  {
        Any: sts.unit(),
        Kusama: sts.unit(),
        Named: Type_12,
        Polkadot: sts.unit(),
    }
})

export const Type_15 = sts.bytes()

export const Type_392 = bigint

export const Type_12 = sts.bytes()

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

export const AssetInstanceV0 = sts.closedEnum(() => {
    return  {
        Array16: Type_179,
        Array32: Type_6,
        Array4: Type_64,
        Array8: Type_171,
        Blob: Type_12,
        Index128: Type_392,
        Index16: Type_407,
        Index32: Type_95,
        Index64: Type_391,
        Index8: Type_7,
        Undefined: sts.unit(),
    }
})

export const MultiAsset = sts.closedEnum(() => {
    return  {
        AbstractFungible: sts.enumStruct({
            id: Type_12,
            instance: Type_392,
        }),
        AbstractNonFungible: sts.enumStruct({
            class: Type_12,
            instance: AssetInstanceV0,
        }),
        All: sts.unit(),
        AllAbstractFungible: Type_12,
        AllAbstractNonFungible: Type_12,
        AllConcreteFungible: MultiLocationV0,
        AllConcreteNonFungible: MultiLocationV0,
        AllFungible: sts.unit(),
        AllNonFungible: sts.unit(),
        ConcreteFungible: sts.enumStruct({
            id: MultiLocationV0,
            amount: Type_392,
        }),
        ConcreteNonFungible: sts.enumStruct({
            class: MultiLocationV0,
            instance: AssetInstanceV0,
        }),
        None: sts.unit(),
    }
})

export const Type_82 = sts.boolean()

export const Type_412 = sts.array(XcmV0)

export const Type_410 = sts.array(MultiAsset)

export const Type_179 = sts.bytes()

export const Type_6 = sts.bytes()

export const Type_64 = sts.bytes()

export const Type_171 = sts.bytes()

export const Type_407 = number
