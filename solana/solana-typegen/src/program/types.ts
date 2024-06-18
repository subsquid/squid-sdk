export type Primitive =
    | 'unit'
    | 'bool'
    | 'u8'
    | 'i8'
    | 'u16'
    | 'i16'
    | 'u32'
    | 'i32'
    | 'f32'
    | 'u64'
    | 'i64'
    | 'f64'
    | 'u128'
    | 'i128'
    | 'u256'
    | 'i256'
    | 'binary'
    | 'string'
    | 'address'

export enum TypeKind {
    Primitive,
    Array,
    FixedArray,
    Enum,
    Option,
    Tuple,
    Struct,
    Defined,
    Generic,
}

export interface PrimitiveType {
    kind: TypeKind.Primitive
    primitive: Primitive
}

export interface ArrayType {
    kind: TypeKind.Array
    type: Type
}

export interface FixedArrayType {
    kind: TypeKind.FixedArray
    len: number
    type: Type
}

export interface TupleType {
    kind: TypeKind.Tuple
    tuple: Type[]
}

export interface StructType {
    kind: TypeKind.Struct
    fields: Field[]
}

export interface Field {
    name: string
    docs?: string[]
    type: Type
}

export interface EnumType {
    kind: TypeKind.Enum
    variants: Variant[]
    discriminatorType: number
}

export interface Variant {
    name: string
    discriminator: number
    type: Type
    
}

export interface OptionType {
    kind: TypeKind.Option
    type: Type
}

export interface GenericType {
    kind: TypeKind.Generic
    name: string
}

export enum GenericArgKind {
    Type,
    Const,
}

export type GenericArgType = {
    kind: GenericArgKind.Type
    type: Type
}

export type GenericArgConst = {
    kind: GenericArgKind.Const
    value: string
}

export type GenericArg = GenericArgType | GenericArgConst

export type DefinedType = {
    kind: TypeKind.Defined
    name: string
    generics?: GenericArg[]
}

export type Type =
    | PrimitiveType
    | ArrayType
    | FixedArrayType
    | TupleType
    | StructType
    | EnumType
    | OptionType
    | GenericType
    | DefinedType
