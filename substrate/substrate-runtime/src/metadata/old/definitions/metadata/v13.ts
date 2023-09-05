import {OldTypes} from "../../types"


export const V13: OldTypes['types'] = {
    ErrorMetadataV13: 'ErrorMetadataV12',
    EventMetadataV13: 'EventMetadataV12',
    ExtrinsicMetadataV13: 'ExtrinsicMetadataV12',
    FunctionArgumentMetadataV13: 'FunctionArgumentMetadataV12',
    FunctionMetadataV13: 'FunctionMetadataV12',
    MetadataV13: {
        modules: 'Vec<ModuleMetadataV13>',
        extrinsic: 'ExtrinsicMetadataV13'
    },
    ModuleConstantMetadataV13: 'ModuleConstantMetadataV12',
    ModuleMetadataV13: {
        name: 'Text',
        storage: 'Option<StorageMetadataV13>',
        calls: 'Option<Vec<FunctionMetadataV13>>',
        events: 'Option<Vec<EventMetadataV13>>',
        constants: 'Vec<ModuleConstantMetadataV13>',
        errors: 'Vec<ErrorMetadataV13>',
        index: 'u8'
    },
    StorageEntryModifierV13: 'StorageEntryModifierV12',
    StorageEntryMetadataV13: {
        name: 'Text',
        modifier: 'StorageEntryModifierV13',
        type: 'StorageEntryTypeV13',
        fallback: 'Bytes',
        docs: 'Vec<Text>'
    },
    StorageEntryTypeV13: {
        _enum: {
            Plain: 'Type',
            Map: {
                hasher: 'StorageHasherV13',
                key: 'Type',
                value: 'Type',
                linked: 'bool'
            },
            DoubleMap: {
                hasher: 'StorageHasherV13',
                key1: 'Type',
                key2: 'Type',
                value: 'Type',
                key2Hasher: 'StorageHasherV13'
            },
            NMap: {
                keyVec: 'Vec<Type>',
                hashers: 'Vec<StorageHasherV13>',
                value: 'Type'
            }
        }
    },
    StorageMetadataV13: {
        prefix: 'Text',
        items: 'Vec<StorageEntryMetadataV13>'
    },
    StorageHasherV13: 'StorageHasherV12'
}
