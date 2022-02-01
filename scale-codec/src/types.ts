export type Ti = number


export type Primitive =
    'I8' | 'U8' |
    'I16' | 'U16' |
    'I32' | 'U32' |
    'I64' | 'U64' |
    'I128' | 'U128' |
    'I256' | 'U256' |
    'Bool' |
    'Str' |
    'Char'


export enum TypeKind {
    Primitive,
    Compact,
    Sequence,
    BitSequence,
    Array,
    Tuple,
    Composite,
    Variant,
    Option,
    DoNotConstruct,
    /**
     * @internal
     */
    BooleanOption,
    /**
     * @internal
     */
    Bytes,
    /**
     * @internal
     */
    BytesArray,
    /**
     * @internal
     */
    Struct
}


export interface PrimitiveType {
    kind: TypeKind.Primitive
    primitive: Primitive
}


export interface CompactType {
    kind: TypeKind.Compact
    type: Ti
}


export interface SequenceType {
    kind: TypeKind.Sequence
    type: Ti
}


export interface BitSequenceType {
    kind: TypeKind.BitSequence
    bitStoreType: Ti
    bitOrderType: Ti
}


export interface ArrayType {
    kind: TypeKind.Array
    len: number
    type: Ti
}


export interface TupleType {
    kind: TypeKind.Tuple
    tuple: Ti[]
}


export interface CompositeType {
    kind: TypeKind.Composite
    fields: Field[]
}


export interface Field {
    name?: string | undefined
    type: Ti
}


export interface VariantType {
    kind: TypeKind.Variant
    variants: Variant[]
}


export interface Variant {
    index: number
    name: string
    fields: Field[]
}


export interface OptionType {
    kind: TypeKind.Option
    type: Ti
}


export interface DoNotConstructType {
    kind: TypeKind.DoNotConstruct
}


export type Type =
    PrimitiveType |
    CompactType |
    SequenceType |
    BitSequenceType |
    ArrayType |
    TupleType |
    CompositeType |
    VariantType |
    OptionType |
    DoNotConstructType
