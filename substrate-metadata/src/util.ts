import {toCamelCase} from "@subsquid/util-naming"
import crypto from "crypto"
import type {Metadata} from "./interfaces"
import {Field, Type, TypeKind} from "./types"


export function normalizeMetadataTypes(types: Type[]): Type[] {
    return types.map(type => {
        switch(type.kind) {
            case TypeKind.Composite:
                return  {
                    ...type,
                    fields: normalizeFieldNames(type.fields)
                }
            case TypeKind.Variant:
                if (isOptionType(type)) {
                    return {
                        kind: TypeKind.Option,
                        type: type.variants[1].fields[0].type,
                        docs: type.docs,
                        path: type.path
                    }
                } else {
                    return {
                        ...type,
                        variants: type.variants.map(v => {
                            return {
                                ...v,
                                fields: normalizeFieldNames(v.fields)
                            }
                        })
                    }
                }
            default:
                return type
        }
    })
}


function isOptionType(type: Type): boolean {
    if (type.kind !== TypeKind.Variant) return false
    if (type.variants.length != 2) return false
    let v0 = type.variants[0]
    let v1 = type.variants[1]
    return v0.name == 'None' &&
        v0.fields.length == 0 &&
        v0.index == 0 &&
        v1.name == 'Some' &&
        v1.index == 1 &&
        v1.fields.length == 1 &&
        v1.fields[0].name == null
}


function normalizeFieldNames(fields: Field[]): Field[] {
    return fields.map(f => {
        if (f.name) {
            let name = f.name
            if (name.startsWith('r#')) {
                name = name.slice(2)
            }
            name = toCamelCase(name)
            return {...f, name}
        } else {
            return f
        }
    })
}


export function sha256(obj: object | string): string {
    let content = typeof obj == 'string' ? obj : JSON.stringify(obj)
    let hash = crypto.createHash('sha256')
    hash.update(content)
    return hash.digest().toString('hex')
}


export function isPreV14(metadata: Metadata): boolean {
    switch(metadata.__kind) {
        case 'V0':
        case 'V1':
        case 'V2':
        case 'V3':
        case 'V4':
        case 'V5':
        case 'V6':
        case 'V7':
        case 'V8':
        case 'V9':
        case 'V10':
        case 'V11':
        case 'V12':
        case 'V13':
            return true
        default:
            return false
    }
}
