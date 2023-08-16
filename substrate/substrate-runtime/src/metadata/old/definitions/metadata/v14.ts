import type {OldTypes} from "../../types"
import {Si1Variant} from "./base"

export const V14: OldTypes['types'] = {
    MetadataV14: {
        lookup: 'PortableRegistryV14',
        pallets: 'Vec<PalletMetadataV14>',
        extrinsic: 'ExtrinsicMetadataV14',
        type: 'Si1LookupTypeId'
    },

    // registry
    PortableRegistryV14: {
        types: 'Vec<PortableTypeV14>'
    },
    PortableTypeV14: {
        id: 'Si1LookupTypeId',
        type: 'Si1Type'
    },

    // compatibility with earlier layouts, i.e. don't break previous users
    ErrorMetadataV14: {
        ...Si1Variant,
        args: 'Vec<Type>'
    },
    EventMetadataV14: {
        ...Si1Variant,
        args: 'Vec<Type>'
    },
    FunctionArgumentMetadataV14: {
        name: 'Text',
        type: 'Type',
        typeName: 'Option<Type>'
    },
    FunctionMetadataV14: {
        ...Si1Variant,
        args: 'Vec<FunctionArgumentMetadataV14>'
    },

    // V14
    ExtrinsicMetadataV14: {
        type: 'Si1LookupTypeId',
        version: 'u8',
        signedExtensions: 'Vec<SignedExtensionMetadataV14>'
    },
    PalletCallMetadataV14: {
        type: 'Si1LookupTypeId'
    },
    PalletConstantMetadataV14: {
        name: 'Text',
        type: 'Si1LookupTypeId',
        value: 'Bytes',
        docs: 'Vec<Text>'
    },
    PalletErrorMetadataV14: {
        type: 'Si1LookupTypeId'
    },
    PalletEventMetadataV14: {
        type: 'Si1LookupTypeId'
    },
    PalletMetadataV14: {
        name: 'Text',
        storage: 'Option<PalletStorageMetadataV14>',
        calls: 'Option<PalletCallMetadataV14>',
        events: 'Option<PalletEventMetadataV14>',
        constants: 'Vec<PalletConstantMetadataV14>',
        errors: 'Option<PalletErrorMetadataV14>',
        index: 'u8'
    },
    PalletStorageMetadataV14: {
        prefix: 'Text',
        // NOTE: Renamed from entries
        items: 'Vec<StorageEntryMetadataV14>'
    },
    SignedExtensionMetadataV14: {
        identifier: 'Text',
        type: 'Si1LookupTypeId',
        additionalSigned: 'Si1LookupTypeId'
    },
    StorageEntryMetadataV14: {
        name: 'Text',
        modifier: 'StorageEntryModifierV14',
        type: 'StorageEntryTypeV14',
        fallback: 'Bytes',
        docs: 'Vec<Text>'
    },
    StorageEntryModifierV14: 'StorageEntryModifierV13',
    StorageEntryTypeV14: {
        _enum: {
            Plain: 'Si1LookupTypeId',
            Map: {
                hashers: 'Vec<StorageHasherV14>',
                key: 'Si1LookupTypeId', // NOTE: Renamed from "keys"
                value: 'Si1LookupTypeId'
            }
        }
    },
    StorageHasherV14: 'StorageHasherV13'
}
