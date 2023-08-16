import {throwUnexpectedCase} from '@subsquid/scale-codec/lib/util'
import {last, maybeLast} from '@subsquid/util-internal'
import {toCamelCase} from '@subsquid/util-naming'
import assert from 'assert'
import {Field, Type, TypeInfo, TypeKind, VariantType} from './types'
import {Metadata} from './interfaces'


export function normalizeMetadataTypes(types: Type[]): Type[] {
    types = fixWrapperKeepOpaqueTypes(types)
    types = fixU256Structs(types)
    types = eliminateWrappers(types)
    types = removeUnitFieldsFromVariants(types)
    types = fixCompactTypes(types)
    types = introduceOptionType(types)
    types = replaceUnitOptionWithBoolean(types)
    types = eliminateOptionsChain(types)
    types = introduceHexBytes(types)
    types = normalizeFieldNames(types)
    return types
}


function fixWrapperKeepOpaqueTypes(types: Type[]): Type[] {
    let u8 = types.length
    let replaced = false
    types = types.map(ty => {
        if (!ty.path?.length) return ty
        if (last(ty.path) != 'WrapperKeepOpaque') return ty
        if (ty.kind != TypeKind.Composite) return ty
        if (ty.fields.length != 2) return ty
        if (types[ty.fields[0].type].kind != TypeKind.Compact) return ty
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
    return types.map(ty => {
        let field
        let element
        let isU256 = ty.path && maybeLast(ty.path) == 'U256'
            && ty.kind == TypeKind.Composite
            && ty.fields.length == 1
            && (field = types[ty.fields[0].type])
            && field.kind == TypeKind.Array
            && field.len == 4
            && (element = types[field.type])
            && element.kind == TypeKind.Primitive
            && element.primitive == 'U64'

        if (isU256) return {
            kind: TypeKind.Primitive,
            primitive: 'U256'
        }
        return ty
    })
}


function eliminateWrappers(types: Type[]): Type[] {
    let changed = true
    while (changed) {
        changed = false
        types = types.map(ty => {
            switch(ty.kind) {
                case TypeKind.Tuple:
                    if (ty.tuple.length == 1) {
                        changed = true
                        return replaceType(ty, types[ty.tuple[0]])
                    } else {
                        return ty
                    }
                case TypeKind.Composite: {
                    if (ty.fields.length == 0) {
                        changed = true
                        return replaceType(ty, {
                            kind: TypeKind.Tuple,
                            tuple: []
                        })
                    }
                    if (ty.fields[0].name == null) {
                        changed = true
                        return replaceType(ty, {
                            kind: TypeKind.Tuple,
                            tuple: ty.fields.map(f => {
                                assert(f.name == null)
                                return f.type
                            })
                        })
                    }

                    let nonUnitFields = ty.fields.filter(f => {
                        return !isUnitType(types[f.type])
                    })

                    if (nonUnitFields.length != ty.fields.length) {
                        changed = true
                        return {
                            ...ty,
                            fields: nonUnitFields
                        }
                    }

                    return ty
                }
                default:
                    return ty
            }
        })
    }
    return types
}


function replaceType(prev: Type, next: Type): Type {
    let {path, docs, ...def} = next
    let info: TypeInfo = {}
    if (prev.path) {
        info.path = prev.path
    }
    if (prev.docs) {
        info.docs = prev.docs
    }
    return {...info, ...def}
}


function removeUnitFieldsFromVariants(types: Type[]): Type[] {
    return types.map(ty => {
        if (ty.kind != TypeKind.Variant) return ty
        let variants = ty.variants.map(v => {
            let nonUnitFields = v.fields.filter(f => {
                return !isUnitType(types[f.type])
            })
            if (nonUnitFields.length == v.fields.length) return v
            if (v.fields[0]?.name == null && nonUnitFields.length > 0) return v
            return {
                ...v,
                fields: nonUnitFields
            }
        })
        return {
            ...ty,
            variants
        }
    })
}


export function isUnitType(type: Type): boolean {
    return type.kind == TypeKind.Tuple && type.tuple.length == 0
}


function fixCompactTypes(types: Type[]): Type[] {
    return types.map(ty => {
        if (ty.kind != TypeKind.Compact) return ty
        let compact = types[ty.type]
        switch(compact.kind) {
            case TypeKind.Primitive:
                assert(compact.primitive[0] == 'U')
                return ty
            case TypeKind.Tuple:
                assert(compact.tuple.length == 0)
                return replaceType(ty, {
                    kind: TypeKind.Tuple,
                    tuple: []
                })
            case TypeKind.Composite:
                assert(compact.fields.length == 1)
                let compactTi = compact.fields[0].type
                compact = types[compactTi]
                // FIXME: as far as I understand, CompactAs chain can be arbitrary long
                assert(compact.kind == TypeKind.Primitive)
                assert(compact.primitive[0] == 'U')
                return {
                    ...ty,
                    type: compactTi
                }
            default:
                throwUnexpectedCase(compact.kind)
        }
    })
}


function introduceOptionType(types: Type[]): Type[] {
    return types.map(ty => {
        if (isOptionType(ty)) {
            return replaceType(ty, {
                kind: TypeKind.Option,
                type: ty.variants[1].fields[0].type
            })
        } else {
            return ty
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
    return types.map(ty => {
        if (ty.kind != TypeKind.Option) return ty
        let param = ty.type
        if (types[param].kind != TypeKind.Option) return ty
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


function replaceUnitOptionWithBoolean(types: Type[]): Type[] {
    return types.map(ty => {
        if (ty.kind == TypeKind.Option && isUnitType(types[ty.type])) {
            return replaceType(ty, {
                kind: TypeKind.Primitive,
                primitive: 'Bool'
            })
        } else {
            return ty
        }
    })
}


function introduceHexBytes(types: Type[]): Type[] {
    return types.map(ty => {
        switch(ty.kind) {
            case TypeKind.Sequence:
                if (isU8(types[ty.type])) {
                    return replaceType(ty, {
                        kind: TypeKind.HexBytes
                    })
                }
                return ty
            case TypeKind.Array: {
                if (isU8(types[ty.type])) {
                    return replaceType(ty, {
                        kind: TypeKind.HexBytesArray,
                        len: ty.len
                    })
                }
                return ty
            }
            default:
                return ty
        }
    })
}


function isU8(type: Type): boolean {
    return type.kind == TypeKind.Primitive && type.primitive == 'U8'
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
