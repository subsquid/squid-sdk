import {Type, TypeKind} from "@subsquid/scale-codec"
import {TypeDef} from "./interfaces"
import assert from "assert"


export function normalizeTypes(types: TypeDef[]): Type[] {
    return types.map(type => {
        let keys = Object.keys(type.type.def)
        assert(keys.length == 1)
        switch(keys[0]) {
            case 'primitive':
                return {
                    kind: TypeKind.Primitive,
                    primitive: type.type.def.primitive.toUpperCase(),
                }
            case 'composite':
                return {
                    kind: TypeKind.Composite,
                    fields: type.type.def.composite.fields,
                }
            case 'array':
                return {
                    kind: TypeKind.Array,
                    len: type.type.def.array.len,
                    type: type.type.def.array.type,
                }
            case 'tuple':
                return {
                    kind: TypeKind.Tuple,
                    tuple: type.type.def.tuple,
                }
            case 'variant':
                return {
                    kind: TypeKind.Variant,
                    variants: type.type.def.variant.variants.map((variant: any) => {
                        return {
                            ...variant,
                            fields: variant.fields || [],
                        }
                    }),
                }
            default:
                throw new Error(`Unexpected type '${keys[0]}'`)
        }
    })
}
