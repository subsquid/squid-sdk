import assert from "assert"
import {Primitive, Ti, Type, TypeKind, Variant} from "./types"
import baseX from "base-x"


export function normalizeTypes(types: Type[]): Type[] {
    function isPrimitive(primitive: Primitive, ti: Ti): boolean {
        let type = types[ti]
        return type.kind == TypeKind.Primitive && type.primitive == primitive
    }

    return types.map((type, ti) => {
        switch(type.kind) {
            case TypeKind.Sequence:
                if (isPrimitive('U8', type.type)) {
                    return {kind: TypeKind.Bytes}
                } else {
                    return type
                }
            case TypeKind.Array:
                if (isPrimitive('U8', type.type)) {
                    return {kind: TypeKind.BytesArray, len: type.len}
                } else {
                    return type
                }
            case TypeKind.Option:
                if (isPrimitive('Bool', type.type)) {
                    return {kind: TypeKind.BooleanOption}
                } else {
                    return type
                }
            case TypeKind.Variant: {
                let variants = type.variants.filter(v => v != null) as Variant[]
                let uniqueIndexes = new Set(variants.map(v => v.index))
                if (uniqueIndexes.size != variants.length) {
                    throw new Error(`Variant type ${ti} has duplicate case indexes`)
                }
                let len = variants.reduce((len, v) => Math.max(len, v.index), 0) + 1
                let placedVariants: (Variant | undefined)[] = new Array(len)
                let variantsByName: Record<string, Variant> = {}
                variants.forEach(v => {
                    placedVariants[v.index] = v
                    variantsByName[v.name] = v
                })
                return {
                    kind: TypeKind.Variant,
                    variants: placedVariants,
                    variantsByName
                }
            }
            default:
                return type
        }
    })
}


export function assertNotNull<T>(val: T | undefined | null, msg?: string): T {
    assert(val != null, msg)
    return val
}


export function unexpectedCase(val?: unknown): Error {
    return new Error(val ? `Unexpected case: ${val}` : `Unexpected case`)
}


export const base58 = baseX(
    '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
)
