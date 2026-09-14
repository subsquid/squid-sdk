import type {OldTypes} from "../../types"

const ItemDeprecationInfoV16: OldTypes['types']['ItemDeprecationInfoV16'] = {
    _enum: {
        NotDeprecated: 'Null',
        DeprecatedWithoutNote: 'Null',
        Deprecated: {
            note: 'Text',
            since: 'Option<Text>'
        }
    }
}

// Note: `Nullable` first variant is never encoded,
// it's here just to align the variants' indexes with `VariantDeprecationInfo`
// which shares the codec indexes with `ItemDeprecationInfo`.
const VariantDeprecationInfoV16: OldTypes['types']['VariantDeprecationInfoV16'] = {
    _enum: {
        NotDeprecated: 'Null',
        DeprecatedWithoutNote: 'Null',
        Deprecated: {
            note: 'Text',
            since: 'Option<Text>'
        }
    }
}

export const V16: OldTypes['types'] = {
    MetadataV16: {
        lookup: 'PortableRegistryV16',
        pallets: 'Vec<PalletMetadataV16>',
        extrinsic: 'ExtrinsicMetadataV16',
        apis: 'Vec<RuntimeApiMetadataV16>',
        outerEnums: 'OuterEnumsV15',
        custom: 'CustomMetadataV15'
    },

    // registry
    PortableRegistryV16: {
        types: 'Vec<PortableTypeV15>'
    },

    ItemDeprecationInfoV16,
    VariantDeprecationInfoV16,
    EnumDeprecationInfoV16: 'Vec<(u8, VariantDeprecationInfoV16)>',

    PalletMetadataV16: {
        name: 'Text',
        storage: 'Option<PalletStorageMetadataV16>',
        calls: 'Option<PalletCallMetadataV16>',
        event: 'Option<PalletEventMetadataV16>',
        constants: 'Vec<PalletConstantMetadataV16>',
        error: 'Option<PalletErrorMetadataV16>',
        associatedTypes: 'Vec<PalletAssociatedTypeMetadataV16>',
        viewFunctions: 'Vec<PalletViewFunctionMetadataV16>',
        index: 'u8',
        docs: 'Vec<Text>',
        deprecationInfo: 'ItemDeprecationInfoV16'
    },
    PalletStorageMetadataV16: {
        prefix: 'Text',
        items: 'Vec<StorageEntryMetadataV16>'
    },
    StorageEntryMetadataV16: {
        name: 'Text',
        modifier: 'StorageEntryModifierV13',
        type: 'StorageEntryTypeV14',
        fallback: 'Bytes',
        docs: 'Vec<Text>',
        deprecationInfo: 'ItemDeprecationInfoV16'
    },
    PalletCallMetadataV16: {
        ty: 'Si1LookupTypeId',
        deprecationInfo: 'EnumDeprecationInfoV16'
    },
    PalletEventMetadataV16: {
        ty: 'Si1LookupTypeId',
        deprecationInfo: 'EnumDeprecationInfoV16'
    },
    PalletConstantMetadataV16: {
        name: 'Text',
        ty: 'Si1LookupTypeId',
        value: 'Bytes',
        docs: 'Vec<Text>',
        deprecationInfo: 'ItemDeprecationInfoV16'
    },
    PalletErrorMetadataV16: {
        ty: 'Si1LookupTypeId',
        deprecationInfo: 'EnumDeprecationInfoV16'
    },
    PalletAssociatedTypeMetadataV16: {
        name: 'Text',
        ty: 'Si1LookupTypeId',
        docs: 'Vec<Text>'
    },
    PalletViewFunctionMetadataV16: {
        id: '[u8; 32]',
        name: 'Text',
        inputs: 'Vec<RuntimeApiMethodParamMetadataV15>',
        output: 'Si1LookupTypeId',
        docs: 'Vec<Text>',
        deprecationInfo: 'ItemDeprecationInfoV16'
    },
    PalletViewFunctionParamMetadataV16: {
        name: 'Text',
        ty: 'Si1LookupTypeId'
    },

    ExtrinsicMetadataV16: {
        versions: 'Vec<u8>',
        addressTy: 'Si1LookupTypeId',
        callTy: 'Si1LookupTypeId',
        signatureTy: 'Si1LookupTypeId',
        transactionExtensionsByVersion: 'BTreeMap<u8, Vec<Compact<u32>>>',
        transactionExtensions: 'Vec<TransactionExtensionMetadataV16>'
    },
    TransactionExtensionMetadataV16: {
        identifier: 'Text',
        ty: 'Si1LookupTypeId',
        implicit: 'Si1LookupTypeId'
    },

    RuntimeApiMetadataV16: {
        name: 'Text',
        methods: 'Vec<RuntimeApiMethodMetadataV16>',
        docs: 'Vec<Text>',
        version: 'Compact<u32>',
        deprecationInfo: 'ItemDeprecationInfoV16'
    },
    RuntimeApiMethodMetadataV16: {
        name: 'Text',
        inputs: 'Vec<RuntimeApiMethodParamMetadataV15>',
        output: 'Si1LookupTypeId',
        docs: 'Vec<Text>',
        deprecationInfo: 'ItemDeprecationInfoV16'
    }
}
