
export const H256 = sts.bytes()

export const V1MultiLocation = sts.struct(() => {
    return  {
        parents: Type_2,
        interior: V1Junctions,
    }
})

export const VersionedMultiAssets = sts.closedEnum(() => {
    return  {
        V0: Type_393,
        V1: V1MultiAssets,
    }
})

export const Type_10 = sts.bigint()

export const Type_2 = sts.number()

export const Weight = sts.struct(() => {
    return  {
        refTime: Type_9,
        proofSize: Type_9,
    }
})

export const Id = sts.number()

export const Type_1 = sts.bytes()

export const Type_4 = sts.number()

export const AccountId32 = sts.bytes()

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
            amount: Type_52,
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
            amount: Type_52,
        }),
        ConcreteNonFungible: sts.enumStruct({
            class: V0MultiLocation,
            instance: V1AssetInstance,
        }),
        None: sts.unit(),
    }
})

export const Type_393 = sts.array(V0MultiAsset)

export const V1MultiAsset = sts.struct(() => {
    return  {
        id: V1AssetId,
        fun: V1Fungibility,
    }
})

export const V1MultiAssets = sts.array(V1MultiAsset)

export const Type_9 = bigint

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
            key: Type_92,
        }),
        GeneralIndex: Type_52,
        GeneralKey: WeakBoundedVec,
        OnlyChild: sts.unit(),
        PalletInstance: Type_2,
        Parachain: Type_81,
        Plurality: sts.enumStruct({
            id: V0BodyId,
            part: V0BodyPart,
        }),
    }
})

export const Type_12 = sts.bytes()

export const Type_52 = bigint

export const V1AssetInstance = sts.closedEnum(() => {
    return  {
        Array16: Type_39,
        Array32: Type_1,
        Array4: Type_16,
        Array8: Type_191,
        Blob: Type_12,
        Index: Type_52,
        Undefined: sts.unit(),
    }
})

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

export const V1AssetId = sts.closedEnum(() => {
    return  {
        Abstract: Type_12,
        Concrete: V1MultiLocation,
    }
})

export const V1Fungibility = sts.closedEnum(() => {
    return  {
        Fungible: Type_52,
        NonFungible: V1AssetInstance,
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

export const Type_92 = sts.bytes()

export const WeakBoundedVec = sts.bytes()

export const Type_81 = number

export const V0BodyId = sts.closedEnum(() => {
    return  {
        Executive: sts.unit(),
        Index: Type_81,
        Judicial: sts.unit(),
        Legislative: sts.unit(),
        Named: WeakBoundedVec,
        Technical: sts.unit(),
        Unit: sts.unit(),
    }
})

export const V0BodyPart = sts.closedEnum(() => {
    return  {
        AtLeastProportion: sts.enumStruct({
            nom: Type_81,
            denom: Type_81,
        }),
        Fraction: sts.enumStruct({
            nom: Type_81,
            denom: Type_81,
        }),
        Members: sts.enumStruct({
            count: Type_81,
        }),
        MoreThanProportion: sts.enumStruct({
            nom: Type_81,
            denom: Type_81,
        }),
        Voice: sts.unit(),
    }
})

export const Type_39 = sts.bytes()

export const Type_16 = sts.bytes()

export const Type_191 = sts.bytes()

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
            key: Type_92,
        }),
        GeneralIndex: Type_52,
        GeneralKey: WeakBoundedVec,
        OnlyChild: sts.unit(),
        PalletInstance: Type_2,
        Parachain: Type_81,
        Parent: sts.unit(),
        Plurality: sts.enumStruct({
            id: V0BodyId,
            part: V0BodyPart,
        }),
    }
})
