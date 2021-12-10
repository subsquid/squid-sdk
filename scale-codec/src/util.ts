import {Primitive, Ti, Type, TypeKind, Variant} from "./types"


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
                variants.forEach(v => {
                    placedVariants[v.index] = v
                })
                return {
                    kind: TypeKind.Variant,
                    variants: placedVariants
                }
            }
            default:
                return type
        }
    })
}
