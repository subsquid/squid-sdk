import {Type} from './type-checker'
import {GetType} from './type-util'
import {EnumDefinition, EnumStruct, EnumType, GetEnumType} from './types/enum'
import {OptionType} from './types/option'
import {AnyType, BigIntType, BooleanType, NumberType, StringType, UnitType, UnknownType} from './types/primitives'
import {GetStructType, StructType} from './types/struct'
import {GetTupleType, TupleType} from './types/tuple'


export {GetType}


const numberType = new NumberType()
const bigintType = new BigIntType()
const stringType = new StringType()
const booleanType = new BooleanType()
const anyType = new AnyType()
const unknownType = new UnknownType()
const unitType = new UnitType()


export function number(): Type<number> {
    return numberType
}


export function bigint(): Type<bigint> {
    return bigintType
}


export function string(): Type<string> {
    return stringType
}


export function boolean(): Type<boolean> {
    return booleanType
}


export function any(): Type<any> {
    return anyType
}


export function unknown(): Type<unknown> {
    return unknownType
}


export function unit(): Type<null> {
    return unitType
}


export function tuple<T extends Type[]>(def: Get<T>): Type<GetTupleType<T>> {
    return new TupleType(getter(def))
}


export function struct<T extends Record<string, Type>>(def: Get<T>): Type<GetStructType<T>> {
    return new StructType(getter(def))
}


export function option<T>(type: Get<Type<T>>): Type<T | undefined> {
    return new OptionType(getter(type))
}


export function openEnum<Variants extends EnumDefinition>(variants: Get<Variants>): Type<GetEnumType<Variants, true>> {
    return new EnumType(getter(variants), true)
}


export function closedEnum<Variants extends EnumDefinition>(variants: Get<Variants>): Type<GetEnumType<Variants, false>> {
    return new EnumType(getter(variants), false)
}


export function enumStruct<T extends Record<string, Type>>(def: T): EnumStruct<GetStructType<T>> {
    return new EnumStruct(struct(def))
}


type Get<T> = T | (() => T)


function getter<T>(get: Get<T>): () => T {
    if (typeof get == 'function') {
        return get as () => T
    } else {
        return () => get
    }
}
