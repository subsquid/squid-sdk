import {TypeKind} from '@subsquid/scale-codec'
import {BaseType, ScaleType, TypeChecker} from '../type-checker'


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
            if (v.fields.length != 1) return false
            if (v.fields[0].name != null) return false
            if (typeChecker.getScaleType(v.fields[0].type).kind != TypeKind.Variant) return false
        }
        return true
    }
}
