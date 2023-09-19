
export const Kind = sts.bytes()

export const OpaqueTimeSlot = sts.bytes()

export const ParaId = sts.number()

export const AccountId = sts.bytes()

export const LeasePeriod = sts.number()

export const Balance = sts.bigint()

export const Type_450 = sts.tuple(AccountId, Balance)

export const BalanceOf = sts.bigint()

export const Type_11 = sts.number()

export const ActiveIndex = sts.number()

export const BlockNumber = sts.number()

export const CandidateReceipt = sts.struct(() => {
    return  {
        descriptor: CandidateDescriptor,
        commitmentsHash: Hash,
    }
})

export const HeadData = sts.bytes()

export const CoreIndex = sts.number()

export const GroupIndex = sts.number()

export const SessionIndex = sts.number()

export const HrmpChannelId = sts.struct(() => {
    return  {
        sender: Type_11,
        receiver: Type_11,
    }
})

export const AuctionIndex = sts.number()

export const SlotRange = sts.closedEnum(() => {
    return  {
        OneOne: sts.unit(),
        OneThree: sts.unit(),
        OneTwo: sts.unit(),
        ThreeThree: sts.unit(),
        TwoThree: sts.unit(),
        TwoTwo: sts.unit(),
        ZeroOne: sts.unit(),
        ZeroThree: sts.unit(),
        ZeroTwo: sts.unit(),
        ZeroZero: sts.unit(),
    }
})

export const DispatchResult = sts.closedEnum(() => {
    return  {
        Err: DispatchError,
        Ok: sts.unit(),
    }
})

export const Type_12 = sts.bytes()

export const MultiLocation = sts.closedEnum(() => {
    return  {
        Here: sts.unit(),
        X1: JunctionV0,
        X2: Type_389,
        X3: Type_390,
        X4: Type_391,
        X5: Type_392,
        X6: Type_393,
        X7: Type_394,
        X8: Type_395,
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
            queryId: Type_385,
            response: ResponseV0,
        }),
        ReceiveTeleportedAsset: sts.enumStruct({
            assets: Type_398,
            effects: Type_402,
        }),
        RelayedFrom: sts.enumStruct({
            who: MultiLocationV0,
            message: XcmV0,
        }),
        ReserveAssetDeposit: sts.enumStruct({
            assets: Type_398,
            effects: Type_402,
        }),
        Transact: sts.enumStruct({
            originType: XcmOriginKind,
            requireWeightAtMost: Type_35,
            call: DoubleEncodedCall,
        }),
        TransferAsset: sts.enumStruct({
            assets: Type_398,
            dest: MultiLocationV0,
        }),
        TransferReserveAsset: sts.enumStruct({
            assets: Type_398,
            dest: MultiLocationV0,
            effects: Type_402,
        }),
        WithdrawAsset: sts.enumStruct({
            assets: Type_398,
            effects: Type_402,
        }),
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

export const JunctionV0 = sts.closedEnum(() => {
    return  {
        AccountId32: sts.enumStruct({
            network: NetworkId,
            id: AccountId,
        }),
        AccountIndex64: sts.enumStruct({
            network: NetworkId,
            index: Type_385,
        }),
        AccountKey20: sts.enumStruct({
            network: NetworkId,
            key: Type_15,
        }),
        GeneralIndex: Type_386,
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

export const Type_389 = sts.tuple(JunctionV0, JunctionV0)

export const Type_390 = sts.tuple(JunctionV0, JunctionV0, JunctionV0)

export const Type_391 = sts.tuple(JunctionV0, JunctionV0, JunctionV0, JunctionV0)

export const Type_392 = sts.tuple(JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0)

export const Type_393 = sts.tuple(JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0)

export const Type_394 = sts.tuple(JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0)

export const Type_395 = sts.tuple(JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0, JunctionV0)

export const Type_95 = number

export const Type_385 = bigint

export const ResponseV0 = sts.closedEnum(() => {
    return  {
        Assets: Type_398,
    }
})

export const MultiAssetV0 = sts.closedEnum(() => {
    return  {
        AbstractFungible: sts.enumStruct({
            id: Type_12,
            instance: Type_386,
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
            amount: Type_386,
        }),
        ConcreteNonFungible: sts.enumStruct({
            class: MultiLocationV0,
            instance: AssetInstanceV0,
        }),
        None: sts.unit(),
    }
})

export const Type_398 = sts.array(MultiAssetV0)

export const XcmOrderV0 = sts.closedEnum(() => {
    return  {
        BuyExecution: sts.enumStruct({
            fees: MultiAsset,
            weight: Type_35,
            debt: Type_35,
            haltOnError: Type_82,
            xcm: Type_406,
        }),
        DepositAsset: sts.enumStruct({
            assets: Type_398,
            dest: MultiLocationV0,
        }),
        DepositReserveAsset: sts.enumStruct({
            assets: Type_398,
            dest: MultiLocationV0,
            effects: Type_402,
        }),
        ExchangeAsset: sts.enumStruct({
            give: Type_398,
            receive: Type_398,
        }),
        InitiateReserveWithdraw: sts.enumStruct({
            assets: Type_398,
            reserve: MultiLocationV0,
            effects: Type_402,
        }),
        InitiateTeleport: sts.enumStruct({
            assets: Type_404,
            dest: MultiLocationV0,
            effects: Type_402,
        }),
        Null: sts.unit(),
        QueryHolding: sts.enumStruct({
            queryId: Type_385,
            dest: MultiLocationV0,
            assets: Type_398,
        }),
    }
})

export const Type_402 = sts.array(XcmOrderV0)

export const MultiLocationV0 = sts.closedEnum(() => {
    return  {
        Here: sts.unit(),
        X1: JunctionV0,
        X2: Type_389,
        X3: Type_390,
        X4: Type_391,
        X5: Type_392,
        X6: Type_393,
        X7: Type_394,
        X8: Type_395,
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
            queryId: Type_385,
            response: ResponseV0,
        }),
        ReceiveTeleportedAsset: sts.enumStruct({
            assets: Type_398,
            effects: Type_402,
        }),
        RelayedFrom: sts.enumStruct({
            who: MultiLocationV0,
            message: XcmV0,
        }),
        ReserveAssetDeposit: sts.enumStruct({
            assets: Type_398,
            effects: Type_402,
        }),
        Transact: sts.enumStruct({
            originType: XcmOriginKind,
            requireWeightAtMost: Type_35,
            call: DoubleEncodedCall,
        }),
        TransferAsset: sts.enumStruct({
            assets: Type_398,
            dest: MultiLocationV0,
        }),
        TransferReserveAsset: sts.enumStruct({
            assets: Type_398,
            dest: MultiLocationV0,
            effects: Type_402,
        }),
        WithdrawAsset: sts.enumStruct({
            assets: Type_398,
            effects: Type_402,
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

export const RelayChainHash = sts.bytes()

export const CollatorId = sts.bytes()

export const CollatorSignature = sts.bytes()

export const ValidationCodeHash = sts.bytes()

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

export const NetworkId = sts.closedEnum(() => {
    return  {
        Any: sts.unit(),
        Kusama: sts.unit(),
        Named: Type_12,
        Polkadot: sts.unit(),
    }
})

export const Type_15 = sts.bytes()

export const Type_386 = bigint

export const Type_7 = sts.number()

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
        Index128: Type_386,
        Index16: Type_401,
        Index32: Type_95,
        Index64: Type_385,
        Index8: Type_7,
        Undefined: sts.unit(),
    }
})

export const MultiAsset = sts.closedEnum(() => {
    return  {
        AbstractFungible: sts.enumStruct({
            id: Type_12,
            instance: Type_386,
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
            amount: Type_386,
        }),
        ConcreteNonFungible: sts.enumStruct({
            class: MultiLocationV0,
            instance: AssetInstanceV0,
        }),
        None: sts.unit(),
    }
})

export const Type_82 = sts.boolean()

export const Type_406 = sts.array(XcmV0)

export const Type_404 = sts.array(MultiAsset)

export const Type_179 = sts.bytes()

export const Type_6 = sts.bytes()

export const Type_64 = sts.bytes()

export const Type_171 = sts.bytes()

export const Type_401 = number
