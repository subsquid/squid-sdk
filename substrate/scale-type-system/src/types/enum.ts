import {Type as ScaleType, TypeKind, Variant} from '@subsquid/scale-codec'
import {def} from '@subsquid/util-internal'
import {string} from '../dsl'
import {BaseType, Type, TypeChecker} from '../type-checker'
import {GetType, Simplify} from '../type-util'


export type EnumDefinition = Record<string, Type | EnumStruct>


export class EnumStruct<T=unknown> {
    constructor(private struct: Type<T>) {}

    getStruct(): Type<T> {
        return this.struct
    }
}


export type GetEnumType<Variants, Open> = {
    [K in keyof Variants]: Variants[K] extends EnumStruct<infer S>
        ? Simplify<{__kind: K} & S>
        : ExcludeNulls<{__kind: K, value: GetType<Variants[K]>}>
}[keyof Variants] | (
    Open extends true ? {__kind: '*'} : never
)


type ExcludeNulls<T> = {
    [K in keyof T as T[K] extends undefined | null ? never : K]: T[K]
}


export class EnumType<
    Variants extends EnumDefinition,
    Open extends boolean
> extends BaseType<
    GetEnumType<Variants, Open>
> {
    constructor(private variants: () => Variants, private open: Open) {
        super()
    }

    match(typeChecker: TypeChecker, ty: ScaleType): boolean {
        if (ty.kind != TypeKind.Variant) return false
        if (!this.open && ty.variants.length != Object.keys(this.variants).length) return false
        for (let variant of ty.variants) {
            let type = this.getVariants()[variant.name]
            if (type == null) {
                if (this.open) {
                    continue
                } else {
                    return false
                }
            }
            if (!matchVariant(typeChecker, variant, type)) return false
        }
        return true
    }

    @def
    getVariants(): Variants {
        return this.variants()
    }
}


function matchVariant(typeChecker: TypeChecker, variant: Variant, type: Type | EnumStruct): boolean {
    if (variant.fields.length == 0) {
        if (type instanceof EnumStruct) return false
        return type.match(typeChecker, {
            kind: TypeKind.Tuple,
            tuple: []
        })
    } else if (variant.fields[0].name == null) {
        if (type instanceof EnumStruct) return false
        if (variant.fields.length == 1) {
            return typeChecker.match(variant.fields[0].type, type)
        } else {
            return type.match(typeChecker, {
                kind: TypeKind.Tuple,
                tuple: variant.fields.map(f => f.type)
            })
        }
    } else {
        return type instanceof EnumStruct && type.getStruct().match(typeChecker, {
            kind: TypeKind.Composite,
            fields: variant.fields
        })
    }
}
