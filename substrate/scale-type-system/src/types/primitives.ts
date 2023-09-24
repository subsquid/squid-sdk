import {BitSequence, Bytes, Primitive, TypeKind} from '@subsquid/scale-codec'
import assert from 'assert'
import {BaseType, ScaleType, TypeChecker} from '../type-checker'


function asPrimitive(typeChecker: TypeChecker, ty: ScaleType): Primitive | undefined {
    switch(ty.kind) {
        case TypeKind.Primitive:
            return ty.primitive
        case TypeKind.Compact: {
            let item = typeChecker.getScaleType(ty.type)
            assert(item.kind == TypeKind.Primitive)
            return item.primitive
        }
    }
}


export class NumberType extends BaseType<number> {
    match(typeChecker: TypeChecker, ty: ScaleType): boolean {
        switch(asPrimitive(typeChecker, ty)) {
            case 'I8':
            case 'U8':
            case 'I16':
            case 'U16':
            case 'I32':
            case 'U32':
                return true
            default:
                return false
        }
    }
}


export class BigIntType extends BaseType<bigint> {
    match(typeChecker: TypeChecker, ty: ScaleType): boolean {
        switch(asPrimitive(typeChecker, ty)) {
            case 'I64':
            case 'U64':
            case 'I128':
            case 'U128':
            case 'I256':
            case 'U256':
                return true
            default:
                return false
        }
    }
}


export class NumericType extends BaseType<number | bigint> {
    match(typeChecker: TypeChecker, ty: ScaleType): boolean {
        switch(asPrimitive(typeChecker, ty)) {
            case 'I8':
            case 'U8':
            case 'I16':
            case 'U16':
            case 'I32':
            case 'U32':
            case 'I64':
            case 'U64':
            case 'I128':
            case 'U128':
            case 'I256':
            case 'U256':
                return true
            default:
                return false
        }
    }
}


export class BooleanType extends BaseType<boolean> {
    match(typeChecker: TypeChecker, ty: ScaleType): boolean {
        return asPrimitive(typeChecker, ty) === 'Bool'
    }
}


export class StringType extends BaseType<string> {
    match(typeChecker: TypeChecker, ty: ScaleType): boolean {
        return asPrimitive(typeChecker, ty) === 'Str'
    }
}


export class BytesType extends BaseType<Bytes> {
    match(typeChecker: TypeChecker, ty: ScaleType): boolean {
        switch(ty.kind) {
            case TypeKind.HexBytes:
            case TypeKind.HexBytesArray:
                return true
            default:
                return false
        }
    }
}


export class BitSequenceType extends BaseType<BitSequence> {
    match(typeChecker: TypeChecker, ty: ScaleType): boolean {
        return ty.kind == TypeKind.BitSequence
    }
}


export class UnitType extends BaseType<null> {
    match(typeChecker: TypeChecker, ty: ScaleType): boolean {
        switch(ty.kind) {
            case TypeKind.Tuple:
                return ty.tuple.length == 0
            case TypeKind.Composite:
                return ty.fields.length == 0
            default:
                return false
        }
    }
}


export class AnyType extends BaseType<any> {
    match(typeChecker: TypeChecker, ty: ScaleType): boolean {
        return true
    }
}


export class UnknownType extends BaseType<unknown> {
    match(typeChecker: TypeChecker, ty: ScaleType): boolean {
        return true
    }
}
