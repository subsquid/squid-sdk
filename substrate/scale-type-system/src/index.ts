import {Ti, Type as ScaleType} from '@subsquid/scale-codec'
import {Type, TypeChecker} from './type-checker'


export * from './dsl'
export * from './type-checker'
export * from './hashing'


const typeCheckers = new WeakMap<ScaleType[], TypeChecker>()


export function getTypeChecker(types: ScaleType[]): TypeChecker {
    let tc = typeCheckers.get(types)
    if (tc == null) {
        tc = new TypeChecker(types)
        typeCheckers.set(types, tc)
    }
    return tc
}


export function match(types: ScaleType[], ti: Ti, ty: Type): boolean {
    return getTypeChecker(types).match(ti, ty)
}
