import {TypeKind, Variant} from '@subsquid/scale-codec'
import {def} from '@subsquid/util-internal'
import {BaseType, ScaleType, Type, TypeChecker} from '../type-checker'
import {GetType, Simplify, ValueCase} from '../type-util'


export type EnumDefinition = Record<string, Type | EnumStruct>


export class EnumStruct<T=unknown> {
    constructor(private struct: Type<T>) {}

    getStruct(): Type<T> {
        return this.struct
    }
}


export type GetEnumType<Variants> = Simplify<{
    [K in keyof Variants]: Variants[K] extends EnumStruct<infer S>
        ? Simplify<{__kind: K} & S>
        : ValueCase<K, GetType<Variants[K]>>
}[keyof Variants]>


export class EnumType<
    Variants extends EnumDefinition,
    Open extends boolean | 'external'
> extends BaseType<
    GetEnumType<Variants> |
    (Open extends [true]
        ? {__kind: '*'}
        : Open extends 'external'
            ? {__kind: '*', value: {__kind: string}}
            : never
    )
> {
    constructor(private variants: () => Variants, private open: Open) {
        super()
    }

    match(typeChecker: TypeChecker, ty: ScaleType): boolean {
        if (ty.kind != TypeKind.Variant) return false
        let variants = this.getVariants()
        if (!this.open && ty.variants.length != Object.keys(variants).length) return false
        for (let variant of ty.variants) {
            let type = variants[variant.name]
            if (type == null) {
                if (!this.open) return false
                if (this.open == 'external' && !matchTopExternalVariant(typeChecker, variant)) return false
            } else if (!matchVariant(typeChecker, variant, type)) {
                return false
            }
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


export function matchTopExternalVariant(typeChecker: TypeChecker, v: Variant): boolean {
    return v.fields.length == 1
        && v.fields[0].name == null
        && typeChecker.getScaleType(v.fields[0].type).kind == TypeKind.Variant
}
