import {TypeKind} from '@subsquid/scale-codec'
import {BaseType, ScaleType, Type, TypeChecker} from '../type-checker'
import {GetType, ValueCase} from '../type-util'


export type Result<T, E> = ValueCase<'Ok', T> | ValueCase<'Err', E>


export class ResultType<T extends Type, E extends Type> extends BaseType<Result<GetType<T>, GetType<E>>> {
    constructor(private ok: T, private err: E) {
        super()
    }

    match(typeChecker: TypeChecker, ty: ScaleType): boolean {
        if (ty.kind != TypeKind.Variant) return false
        if (ty.variants.length != 2) return false
        let v0 = ty.variants[0]
        let v1 = ty.variants[1]
        return v0.name == 'Ok'
            && v0.fields.length == 1
            && v0.fields[0].name == null
            && v1.name == 'Err'
            && v1.fields.length == 1
            && v1.fields[0].name == null
            && typeChecker.match(v0.fields[0].type, this.ok)
            && typeChecker.match(v1.fields[0].type, this.err)
    }
}
