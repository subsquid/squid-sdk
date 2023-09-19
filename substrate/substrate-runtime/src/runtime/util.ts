import assert from 'assert'
import {QualifiedName} from './interfaces'
import {Type, TypeKind, Variant} from '../metadata'


const qualifiedNames: Record<QualifiedName, [prefix: string, name: string]> = {}


export function parseQualifiedName(name: QualifiedName): [prefix: string, name: string] {
    let res = qualifiedNames[name]
    if (res) return res
    let parts = name.split('.')
    assert(parts.length == 2)
    return qualifiedNames[name] = parts as [string, string]
}


const scaleTypes = new WeakMap<Type[], WeakMap<Variant, Type>>()

export function createScaleType(types: Type[], def: Variant): Type {
    let map = scaleTypes.get(types)
    if (map == null) {
        map = new WeakMap()
        scaleTypes.set(types, map)
    }

    let sc = map.get(def)
    if (sc == null) {
        if (def.fields.length == 0) {
            sc = {
                kind: TypeKind.Tuple,
                docs: def.docs,
                tuple: [],
            }
        } else if (def.fields[0].name == null) {
            if (def.fields.length == 1) {
                sc = types[def.fields[0].type]
            } else {
                sc = {
                    kind: TypeKind.Tuple,
                    docs: def.docs,
                    tuple: def.fields.map((f) => {
                        assert(f.name == null)
                        return f.type
                    }),
                }
            }
        } else {
            sc = {
                kind: TypeKind.Composite,
                docs: def.docs,
                fields: def.fields,
            }
        }
        map.set(def, sc)
    }

    return sc
}