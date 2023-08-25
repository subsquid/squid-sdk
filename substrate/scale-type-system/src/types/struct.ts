import {TypeKind} from '@subsquid/scale-codec'
import {def} from '@subsquid/util-internal'
import assert from 'assert'
import {BaseType, ScaleType, Type, TypeChecker} from '../type-checker'
import {GetType, Simplify} from '../type-util'


type UseOptionForUndefinedProps<T> = {
    [K in keyof T as unknown extends T[K] ? K : undefined extends T[K] ? never : K]: T[K]
} & {
    [K in keyof T as unknown extends T[K] ? never : undefined extends T[K] ? K : never]+?: T[K]
}


export type GetStructType<F> = Simplify<UseOptionForUndefinedProps<{
    [K in keyof F]: GetType<F[K]>
}>>


export class StructType<F extends Record<string, Type>> extends BaseType<GetStructType<F>> {
    constructor(private fields: () => F) {
        super()
    }

    match(typeChecker: TypeChecker, ty: ScaleType): boolean {
        if (ty.kind != TypeKind.Composite) return false
        if (ty.fields.length == 0 || ty.fields[0].name == null) return false
        for (let f of ty.fields) {
            assert(f.name != null)
            let type = this.getFields()[f.name]
            if (type && typeChecker.match(f.type, type)) return false
        }
        return true
    }

    @def
    private getFields(): F {
        return this.fields()
    }
}
