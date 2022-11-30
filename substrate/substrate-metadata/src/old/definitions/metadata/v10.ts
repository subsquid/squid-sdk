import {OldTypes} from "../../types"


export const V10: OldTypes['types'] = {
    ErrorMetadataV10: 'ErrorMetadataV9',
    EventMetadataV10: 'EventMetadataV9',
    FunctionArgumentMetadataV10: 'FunctionArgumentMetadataV9',
    FunctionMetadataV10: 'FunctionMetadataV9',
    MetadataV10: {
        modules: 'Vec<ModuleMetadataV10>'
    },
    ModuleConstantMetadataV10: 'ModuleConstantMetadataV9',
    ModuleMetadataV10: {
        name: 'Text',
        storage: 'Option<StorageMetadataV10>',
        calls: 'Option<Vec<FunctionMetadataV10>>',
        events: 'Option<Vec<EventMetadataV10>>',
        constants: 'Vec<ModuleConstantMetadataV10>',
        errors: 'Vec<ErrorMetadataV10>'
    },
    StorageEntryModifierV10: 'StorageEntryModifierV9',
    StorageEntryMetadataV10: {
        name: 'Text',
        modifier: 'StorageEntryModifierV10',
        type: 'StorageEntryTypeV10',
        fallback: 'Bytes',
        docs: 'Vec<Text>'
    },
    StorageEntryTypeV10: {
        _enum: {
            Plain: 'Type',
            Map: {
                hasher: 'StorageHasherV10',
                key: 'Type',
                value: 'Type',
                linked: 'bool'
            },
            DoubleMap: {
                hasher: 'StorageHasherV10',
                key1: 'Type',
                key2: 'Type',
                value: 'Type',
                key2Hasher: 'StorageHasherV10'
            }
        }
    },
    StorageMetadataV10: {
        prefix: 'Text',
        items: 'Vec<StorageEntryMetadataV10>'
    },
    StorageHasherV10: {
        _enum: {
            Blake2_128: null, // eslint-disable-line camelcase
            Blake2_256: null, // eslint-disable-line camelcase
            Blake2_128Concat: null, // eslint-disable-line camelcase
            Twox128: null,
            Twox256: null,
            Twox64Concat: null
        }
    }
}
