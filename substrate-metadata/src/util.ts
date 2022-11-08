import {getUnwrappedType} from '@subsquid/scale-codec/lib/types-codec'
import {last, maybeLast} from '@subsquid/util-internal'
import {toCamelCase} from '@subsquid/util-naming'
import crypto from 'crypto'
import type {Metadata} from './interfaces'
import {Field, Type, TypeKind, VariantType} from './types'


export function normalizeMetadataTypes(types: Type[]): Type[] {
    types = fixWrapperKeepOpaqueTypes(types)
    types = fixU256Structs(types)
    types = introduceOptionType(types)
    types = eliminateOptionsChain(types)
    types = removeUnitFieldsFromStructs(types)
    types = replaceUnitOptionWithBoolean(types)
    types = normalizeFieldNames(types)
    return types
}


function fixWrapperKeepOpaqueTypes(types: Type[]): Type[] {
    let u8 = types.length
    let replaced = false
    types = types.map(type => {
        if (!type.path?.length) return type
        if (last(type.path) != 'WrapperKeepOpaque') return type
        if (type.kind != TypeKind.Composite) return type
        if (type.fields.length != 2) return type
        if (types[type.fields[0].type].kind != TypeKind.Compact) return type
        replaced = true
        return {
            kind: TypeKind.Sequence,
            type: u8
        }
    })
    if (replaced) {
        types.push({
            kind: TypeKind.Primitive,
            primitive: 'U8'
        })
    }
    return types
}


function fixU256Structs(types: Type[]): Type[] {
    return types.map(type => {
        let field
        let element
        let isU256 = type.path && maybeLast(type.path) == 'U256'
            && type.kind == TypeKind.Composite
            && type.fields.length == 1
            && (field = types[type.fields[0].type])
            && field.kind == TypeKind.Array
            && field.len == 4
            && (element = types[field.type])
            && element.kind == TypeKind.Primitive
            && element.primitive == 'U64'

        if (isU256) return {
            kind: TypeKind.Primitive,
            primitive: 'U256'
        }
        return type
    })
}


function introduceOptionType(types: Type[]): Type[] {
    return types.map(type => {
        if (isOptionType(type)) {
            return {
                kind: TypeKind.Option,
                type: type.variants[1].fields[0].type,
                docs: type.docs,
                path: type.path
            }
        } else {
            return type
        }
    })
}


function isOptionType(type: Type): type is VariantType {
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


function eliminateOptionsChain(types: Type[]): Type[] {
    return types.map(type => {
        if (type.kind != TypeKind.Option) return type
        let param = type.type
        if (types[param].kind != TypeKind.Option) return type
        return {
            kind: TypeKind.Variant,
            variants: [
                {
                    name: 'None',
                    index: 0,
                    fields: []
                },
                {
                    name: 'Some',
                    index: 1,
                    fields: [{type: param}]
                }
            ]
        }
    })
}


function removeUnitFieldsFromStructs(types: Type[]): Type[] {
    let changed = true
    while (changed) {
        changed = false
        types = types.map(type => {
            switch (type.kind) {
                case TypeKind.Composite: {
                    let fields = type.fields.filter(f => {
                        let fieldType = getUnwrappedType(types, f.type)
                        return !isUnitType(fieldType)
                    })
                    if (fields.length == type.fields.length) return type
                    changed = true
                    return {
                        ...type,
                        fields
                    }
                }
                case TypeKind.Variant: {
                    let variants = type.variants.map(v => {
                        let fields = v.fields.filter(f => {
                            let fieldType = getUnwrappedType(types, f.type)
                            return !isUnitType(fieldType)
                        })
                        if (fields.length == v.fields.length) return v
                        if (v.fields[0]?.name == null && fields.length > 0) return v
                        changed = true
                        return {
                            ...v,
                            fields
                        }
                    })
                    return {
                        ...type,
                        variants
                    }
                }
                default:
                    return type
            }
        })
    }
    return types
}


export function isUnitType(type: Type): boolean {
    return type.kind == TypeKind.Tuple && type.tuple.length == 0
}


function replaceUnitOptionWithBoolean(types: Type[]): Type[] {
    return types.map(type => {
        if (type.kind == TypeKind.Option && isUnitType(getUnwrappedType(types, type.type))) {
            return {
                kind: TypeKind.Primitive,
                primitive: 'Bool',
                path: type.path,
                docs: type.docs
            }
        } else {
            return type
        }
    })
}


function normalizeFieldNames(types: Type[]): Type[] {
    return types.map(type => {
        switch (type.kind) {
            case TypeKind.Composite:
                return {
                    ...type,
                    fields: convertToCamelCase(type.fields)
                }
            case TypeKind.Variant:
                return {
                    ...type,
                    variants: type.variants.map(v => {
                        return {
                            ...v,
                            fields: convertToCamelCase(v.fields)
                        }
                    })
                }
            default:
                return type
        }
    })
}


function convertToCamelCase(fields: Field[]): Field[] {
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
    switch (metadata.__kind) {
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
