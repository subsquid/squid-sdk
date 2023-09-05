import {Primitive, TypeKind} from '@subsquid/scale-codec'
import {assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import assert from 'assert'
import {ScaleType, Ti} from '../type-checker'
import {DCGHasher, Hasher} from './dcg-hasher'


export class TypeHasher {
    private dcg: DCGHasher<ScaleType>

    constructor(types: ScaleType[]) {
        this.dcg = new DCGHasher(types, computeHash)
    }

    getHash(ti: Ti): string {
        return this.dcg.getHash(ti)
    }
}


export function computeHash(types: ScaleType[], hasher: Hasher, ty: ScaleType): object {
    switch(ty.kind) {
        case TypeKind.Primitive:
            return {primitive: toJsPrimitive(ty.primitive)}
        case TypeKind.Compact: {
            let composite = types[ty.type]
            assert(composite.kind == TypeKind.Primitive)
            return {primitive: toJsPrimitive(composite.primitive)}
        }
        case TypeKind.HexBytesArray:
        case TypeKind.HexBytes:
            return {bytes: true}
        case TypeKind.BitSequence:
        case TypeKind.Bytes:
        case TypeKind.BytesArray:
            return {binary: true}
        case TypeKind.Array:
        case TypeKind.Sequence:
            return {array: hasher.getHash(ty.type)}
        case TypeKind.Tuple:
            return {tuple: ty.tuple.map(ti => hasher.getHash(ti))}
        case TypeKind.Composite:
            if (ty.fields.length == 0 || ty.fields[0].name == null) {
                return {tuple: ty.fields.map(f => hasher.getHash(f.type))}
            } else {
                let fields = ty.fields.slice().sort(byName)
                return {struct: fields.map(f => {
                    return {name: f.name, type: hasher.getHash(f.type)}
                })}
            }
        case TypeKind.Variant:
            return {
                variant: ty.variants.sort(byName).map(v => {
                    if (v.fields.length == 0 || v.fields[0].name == null) {
                        if (v.fields.length == 1) {
                            return {
                                name: v.name,
                                type: hasher.getHash(v.fields[0].type)
                            }
                        } else {
                            return {
                                name: v.name,
                                type: computeHash(types, hasher, {
                                    kind: TypeKind.Tuple,
                                    tuple: v.fields.map(f => f.type)
                                })
                            }
                        }
                    } else {
                        let fields = v.fields.slice().sort(byName)
                        return {
                            name: v.name,
                            type: fields.map(f => ({name: f.name, type: hasher.getHash(f.type)}))
                        }
                    }
                })
            }
        case TypeKind.Option:
            return {option: hasher.getHash(ty.type)}
        case TypeKind.DoNotConstruct:
            return {doNotConstruct: true}
        default:
            throw unexpectedCase()
    }
}


function toJsPrimitive(primitive: Primitive): string {
    switch(primitive) {
        case 'I8':
        case 'U8':
        case 'I16':
        case 'U16':
        case 'I32':
        case 'U32':
            return 'number'
        case 'I64':
        case 'U64':
        case 'I128':
        case 'U128':
        case 'I256':
        case 'U256':
            return 'bigint'
        case 'Bool':
            return 'boolean'
        case 'Str':
            return 'string'
        default:
            throw unexpectedCase(primitive)
    }
}


function byName(a: {name?: string}, b: {name?: string}): number {
    let an = assertNotNull(a.name)
    let bn = assertNotNull(b.name)
    if (an < bn) {
        return -1
    } else if (an == bn) {
        return 0
    } else {
        return 1
    }
}
