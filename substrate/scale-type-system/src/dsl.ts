import {Type} from './type-checker'
import {AnyType, BigIntType, BooleanType, NumberType, StringType, UnitType} from './types/primitives'


const numberType = new NumberType()
const bigintType = new BigIntType()
const stringType = new StringType()
const booleanType = new BooleanType()
const anyType = new AnyType()
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


export function unit(): Type<null> {
    return unitType
}


export function tuple<T extends Type[]>() {

}
