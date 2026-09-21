import type {OldTypes} from "../../types"

export const V15: OldTypes['types'] = {
    MetadataV15: {
        lookup: 'PortableRegistryV15',
        pallets: 'Vec<PalletMetadataV15>',
        extrinsic: 'ExtrinsicMetadataV15',
        ty: 'Si1LookupTypeId',
        apis: 'Vec<RuntimeApiMetadataV15>',
        outerEnums: 'OuterEnumsV15',
        custom: 'CustomMetadataV15'
    },

    // registry
    PortableRegistryV15: {
        types: 'Vec<PortableTypeV15>'
    },
    PortableTypeV15: {
        id: 'Si1LookupTypeId',
        type: 'Si1Type'
    },

    PalletMetadataV15: {
        name: 'Text',
        storage: 'Option<PalletStorageMetadataV14>',
        calls: 'Option<PalletCallMetadataV14>',
        event: 'Option<PalletEventMetadataV14>',
        constants: 'Vec<PalletConstantMetadataV14>',
        error: 'Option<PalletErrorMetadataV14>',
        index: 'u8',
        docs: 'Vec<Text>'
    },

    ExtrinsicMetadataV15: {
        version: 'u8',
        addressTy: 'Si1LookupTypeId',
        callTy: 'Si1LookupTypeId',
        signatureTy: 'Si1LookupTypeId',
        extraTy: 'Si1LookupTypeId',
        signedExtensions: 'Vec<SignedExtensionMetadataV15>'
    },
    SignedExtensionMetadataV15: {
        identifier: 'Text',
        ty: 'Si1LookupTypeId',
        additionalSigned: 'Si1LookupTypeId'
    },

    RuntimeApiMetadataV15: {
        name: 'Text',
        methods: 'Vec<RuntimeApiMethodMetadataV15>',
        docs: 'Vec<Text>'
    },
    RuntimeApiMethodMetadataV15: {
        name: 'Text',
        inputs: 'Vec<RuntimeApiMethodParamMetadataV15>',
        output: 'Si1LookupTypeId',
        docs: 'Vec<Text>'
    },
    RuntimeApiMethodParamMetadataV15: {
        name: 'Text',
        ty: 'Si1LookupTypeId'
    },

    OuterEnumsV15: {
        callEnumTy: 'Si1LookupTypeId',
        eventEnumTy: 'Si1LookupTypeId',
        errorEnumTy: 'Si1LookupTypeId'
    },

    CustomMetadataV15: {
        map: 'Vec<(Text, CustomValueMetadataV15)>'
    },
    CustomValueMetadataV15: {
        ty: 'Si1LookupTypeId',
        value: 'Bytes'
    }
}
