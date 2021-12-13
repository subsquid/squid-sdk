import {toCamelCase} from "@subsquid/util"
import crypto from "crypto"
import {Field, Ti, Type, TypeKind} from "./types"


export function normalizeTypes(types: Type[]): Type[] {
    function isU8(ti: Ti): boolean {
        let type = types[ti]
        return type.kind == TypeKind.Primitive && type.primitive == 'U8'
    }

    return types.map(type => {
        switch(type.kind) {
            case TypeKind.Sequence:
                if (isU8(type.type)) {
                    return {kind: TypeKind.Bytes, docs: type.docs, path: type.path}
                } else {
                    return type
                }
            case TypeKind.Array:
                if (isU8(type.type)) {
                    return {kind: TypeKind.BytesArray, len: type.len, docs: type.docs, path: type.path}
                } else {
                    return type
                }
            case TypeKind.Composite:
                return  {
                    ...type,
                    fields: camelCaseFields(type.fields)
                }
            case TypeKind.Variant:
                return {
                    ...type,
                    variants: type.variants.map(v => {
                        return {
                            ...v,
                            fields: camelCaseFields(v.fields)
                        }
                    })
                }
            default:
                return type
        }
    })
}


function camelCaseFields(fields: Field[]): Field[] {
    return fields.map(f => {
        if (f.name) {
            return {...f, name: toCamelCase(f.name)}
        } else {
            return f
        }
    })
}


export function getTypeByPath(types: Type[], path: string[]): Ti {
    let idx = types.findIndex(type => {
        if (type.path?.length != path.length) return false
        for (let i = 0; i < path.length; i++) {
            if (path[i] != type.path[i]) return false
        }
        return true
    })
    if (idx < 0) {
        throw new Error(`Type ${path.join('::')} not found`)
    }
    return idx
}


export function sha256(obj: object | string): string {
    let content = typeof obj == 'string' ? obj : JSON.stringify(obj)
    let hash = crypto.createHash('sha256')
    hash.update(content)
    return hash.digest().toString('hex')
}
