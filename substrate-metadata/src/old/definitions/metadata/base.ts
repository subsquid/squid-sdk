import type {OldTypes} from "../../types"


export const Si1Variant = {
    name: 'Text',
    fields: 'Vec<Si1Field>',
    index: 'u8',
    docs: 'Vec<Text>'
}


export const ScaleInfoTypes: OldTypes['types'] = {
    Si0Field: {
        name: 'Option<Text>',
        type: 'Si0LookupTypeId',
        typeName: 'Option<Text>',
        docs: 'Vec<Text>'
    },
    Si0LookupTypeId: 'u32',
    Si0Path: 'Vec<Text>',
    Si0Type: {
        path: 'Si0Path',
        params: 'Vec<Si0LookupTypeId>',
        def: 'Si0TypeDef'
    },
    Si0TypeDef: {
        _enum: {
            Composite: 'Si0TypeDefComposite',
            Variant: 'Si0TypeDefVariant',
            Sequence: 'Si0TypeDefSequence',
            Array: 'Si0TypeDefArray',
            Tuple: 'Si0TypeDefTuple',
            Primitive: 'Si0TypeDefPrimitive',
            Compact: 'Si0TypeDefCompact',
            Phantom: 'Si0TypeDefPhantom',
            BitSequence: 'Si0TypeDefBitSequence'
        }
    },
    Si0TypeDefArray: {
        len: 'u32',
        type: 'Si0LookupTypeId'
    },
    Si0TypeDefBitSequence: {
        bitStoreType: 'Si0LookupTypeId',
        bitOrderType: 'Si0LookupTypeId'
    },
    Si0TypeDefCompact: {
        type: 'Si0LookupTypeId'
    },
    Si0TypeDefComposite: {
        fields: 'Vec<Si0Field>'
    },
    Si0TypeDefPhantom: 'Null',
    Si0TypeDefVariant: {
        variants: 'Vec<Si0Variant>'
    },
    Si0TypeDefPrimitive: {
        _enum: ['Bool', 'Char', 'Str', 'U8', 'U16', 'U32', 'U64', 'U128', 'U256', 'I8', 'I16', 'I32', 'I64', 'I128', 'I256']
    },
    Si0TypeDefSequence: {
        type: 'Si0LookupTypeId'
    },
    Si0TypeDefTuple: 'Vec<Si0LookupTypeId>',
    Si0TypeParameter: {
        name: 'Text',
        type: 'Option<Si0LookupTypeId>'
    },
    Si0Variant: {
        name: 'Text',
        fields: 'Vec<Si0Field>',
        index: 'Option<u8>',
        discriminant: 'Option<u64>',
        docs: 'Vec<Text>'
    },
    Si1Field: {
        name: 'Option<Text>',
        type: 'Si1LookupTypeId',
        typeName: 'Option<Text>',
        docs: 'Vec<Text>'
    },
    Si1LookupTypeId: 'Compact<u32>',
    Si1Path: 'Si0Path',
    Si1Type: {
        path: 'Si1Path',
        params: 'Vec<Si1TypeParameter>',
        def: 'Si1TypeDef',
        docs: 'Vec<Text>'
    },
    Si1TypeDef: {
        _enum: {
            Composite: 'Si1TypeDefComposite',
            Variant: 'Si1TypeDefVariant',
            Sequence: 'Si1TypeDefSequence',
            Array: 'Si1TypeDefArray',
            Tuple: 'Si1TypeDefTuple',
            Primitive: 'Si1TypeDefPrimitive',
            Compact: 'Si1TypeDefCompact',
            BitSequence: 'Si1TypeDefBitSequence'
        }
    },
    Si1TypeDefArray: {
        len: 'u32',
        type: 'Si1LookupTypeId'
    },
    Si1TypeDefBitSequence: {
        bitStoreType: 'Si1LookupTypeId',
        bitOrderType: 'Si1LookupTypeId'
    },
    Si1TypeDefCompact: {
        type: 'Si1LookupTypeId'
    },
    Si1TypeDefComposite: {
        fields: 'Vec<Si1Field>'
    },
    Si1TypeDefPrimitive: 'Si0TypeDefPrimitive',
    Si1TypeDefSequence: {
        type: 'Si1LookupTypeId'
    },
    Si1TypeDefTuple: 'Vec<Si1LookupTypeId>',
    Si1TypeParameter: {
        name: 'Text',
        type: 'Option<Si1LookupTypeId>'
    },
    Si1TypeDefVariant: {
        variants: 'Vec<Si1Variant>'
    },
    Si1Variant
}
