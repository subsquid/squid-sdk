import {TypeKind} from '@subsquid/scale-codec'
import {BaseType, ScaleType, TypeChecker} from '../type-checker'
import {matchTopExternalVariant} from './enum'


export interface ExternalEnum {
    __kind: string
    value: {
        __kind: string
    }
}


export class ExternalEnumType extends BaseType<ExternalEnum> {
    match(typeChecker: TypeChecker, ty: ScaleType): boolean {
        if (ty.kind != TypeKind.Variant) return false
        for (let v of ty.variants) {
            if (!matchTopExternalVariant(typeChecker, v)) return false
        }
        return true
    }
}
