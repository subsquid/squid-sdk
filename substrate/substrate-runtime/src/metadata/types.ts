import * as scale from '@subsquid/scale-codec'
import {Primitive, Ti, TypeKind} from '@subsquid/scale-codec'


export {Primitive, Ti, TypeKind}


export interface TypeInfo {
    path?: string[]
    docs?: string[]
}


export interface DoNotConstructType extends scale.DoNotConstructType, TypeInfo {}
export interface PrimitiveType extends scale.PrimitiveType, TypeInfo {}
export interface CompactType extends scale.CompactType, TypeInfo {}
export interface SequenceType extends scale.SequenceType, TypeInfo {}
export interface BitSequenceType extends scale.BitSequenceType, TypeInfo {}
export interface ArrayType extends scale.ArrayType, TypeInfo {}
export interface TupleType extends scale.TupleType, TypeInfo {}
export interface OptionType extends scale.OptionType, TypeInfo {}
export interface HexBytesType extends scale.HexBytesType, TypeInfo {}
export interface HexBytesArrayType extends scale.HexBytesArrayType, TypeInfo {}


export interface Field extends scale.Field {
    docs?: string[]
}


export interface CompositeType extends scale.CompositeType, TypeInfo {
    fields: Field[]
}


export interface Variant extends scale.Variant {
    fields: Field[]
    docs?: string[]
}


export interface VariantType extends scale.VariantType, TypeInfo {
    variants: Variant[]
}


export type Type =
    PrimitiveType |
    CompactType |
    SequenceType |
    BitSequenceType |
    ArrayType |
    HexBytesType |
    HexBytesArrayType |
    TupleType |
    OptionType |
    CompositeType |
    VariantType |
    DoNotConstructType


/**
 * Hex-encoded raw bytes
 */
export type Bytes = string
