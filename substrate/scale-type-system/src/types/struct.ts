import {TypeKind} from '@subsquid/scale-codec'
import {def} from '@subsquid/util-internal'
import {BaseType, ScaleType, Type, TypeChecker} from '../type-checker'
import {GetType, Simplify} from '../type-util'


type UseOptionForUndefinedProps<T> = {
    [K in keyof T as [unknown] extends [T[K]] ? K : [undefined] extends [T[K]] ? never : K]: T[K]
} & {
    [K in keyof T as [unknown] extends [T[K]] ? never : [undefined] extends [T[K]] ? K : never]+?: T[K]
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

        let fields = new Map(ty.fields.map(f => [f.name, f.type]))

        for (let [name, value] of this.getFields()) {
            let ti = fields.get(name)
            if (ti == null || !typeChecker.match(ti, value)) return false
        }

        return true
    }

    @def
    private getFields(): [name: string, type: Type][] {
        return Object.entries(this.fields())
    }
}
