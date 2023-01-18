import {assertNotNull, unexpectedCase} from "@subsquid/util-internal"
import {toCamelCase} from "@subsquid/util-naming"
import assert from "assert"
import {Field, Primitive, Ti, Type, TypeKind, Variant} from "../types"
import {normalizeMetadataTypes} from "../util"
import * as texp from "./typeExp"
import {
    OldEnumDefinition,
    OldSetDefinition,
    OldStructDefinition,
    OldTypeDefinition,
    OldTypeExp,
    OldTypes
} from "./types"


interface TypeAlias {
    kind: -1
    alias: Ti
    name: string
}


export class OldTypeRegistry {
    private types: (Type | TypeAlias)[] = []
    private lookup = new Map<OldTypeExp, Ti>()
    private definitions: Record<string, () => Type> = {}

    constructor(private oldTypes: OldTypes) {
    }

    getTypes(): Type[] {
        this.replaceAliases()
        return normalizeMetadataTypes(this.types)
    }

    private replaceAliases(): void {
        let types = this.types
        let seen = new Set<Ti>()

        function replace(ti: Ti): Type {
            let a = types[ti]
            if (a.kind != -1) return a
            if (seen.has(ti)) {
                throw new Error(`Cycle of non-constructable types involving ${a.name}`)
            } else {
                seen.add(ti)
            }
            let type = {...replace(a.alias)}
            type.path = [a.name]
            return types[ti] = type
        }

        for (let ti = 0; ti < types.length; ti++) {
            replace(ti)
        }
    }

    define(typeName: string, fn: () => Type): void {
        this.definitions[typeName] = fn
    }

    use(typeExp: OldTypeExp | texp.Type, pallet?: string): Ti {
        let type: texp.Type
        if (typeof typeExp == 'string') {
            type = texp.parse(typeExp)
            type = this.normalizeType(type, pallet)
        } else {
            type = typeExp
        }
        let key = texp.print(type)
        let ti = this.lookup.get(key)
        if (ti == null) {
            ti = this.types.push({kind: TypeKind.DoNotConstruct}) - 1
            this.lookup.set(key, ti)
            this.types[ti] = this.buildScaleType(type)
        }
        return ti
    }

    private normalizeType(type: texp.Type, pallet: string | undefined): texp.Type {
        switch(type.kind) {
            case "array":
                return {
                    kind: "array",
                    item: this.normalizeType(type.item, pallet),
                    len: type.len
                }
            case "tuple":
                return {
                    kind: "tuple",
                    params: type.params.map(item => this.normalizeType(item, pallet))
                }
            case "named":
                return this.normalizeNamedType(type, pallet)
        }
    }

    private normalizeNamedType(type: texp.NamedType, pallet: string | undefined): texp.Type {
        if (pallet != null && this.oldTypes.typesAlias) {
            let sectionAliases = this.oldTypes.typesAlias[pallet] || this.oldTypes.typesAlias[toCamelCase(pallet)]
            let alias = sectionAliases?.[type.name]
            if (alias) {
                return {kind: 'named', name: alias, params: []}
            }
        }

        if (this.oldTypes.types[type.name]) return {
            kind: 'named',
            name: type.name,
            params: []
        }

        let primitive = asPrimitive(type.name)
        if (primitive) {
            assertNoParams(type)
            return {
                kind: 'named',
                name: primitive,
                params: []
            }
        }

        switch(type.name) {
            case 'Null':
                return {
                    kind: 'tuple',
                    params: []
                }
            case 'UInt':
                return {
                    kind: 'named',
                    name: convertGenericIntegerToPrimitive('U', type),
                    params: []
                }
            case 'Int':
                return {
                    kind: 'named',
                    name: convertGenericIntegerToPrimitive('I', type),
                    params: []
                }
            case 'Box':
                return this.normalizeType(assertOneParam(type), pallet)
            case 'Bytes':
                assertNoParams(type)
                return {
                    kind: 'named',
                    name: 'Vec',
                    params: [{kind: 'named', name: 'U8', params: []}]
                }
            case 'Vec':
            case 'VecDeque':
            case 'WeakVec':
            case 'BoundedVec':
            case 'WeakBoundedVec': {
                let param = this.normalizeType(assertOneParam(type), pallet)
                return {
                    kind: 'named',
                    name: 'Vec',
                    params: [param]
                }
            }
            case 'BTreeMap':
            case 'BoundedBTreeMap': {
                let [key, val] = assertTwoParams(type)
                return this.normalizeType({
                    kind: 'named',
                    name: 'Vec',
                    params: [
                        {
                            kind: 'tuple',
                            params: [key, val]
                        }
                    ]
                }, pallet)
            }
            case 'BTreeSet':
            case 'BoundedBTreeSet':
                return this.normalizeType({
                    kind: 'named',
                    name: 'Vec',
                    params: [assertOneParam(type)]
                }, pallet)
            case 'RawAddress':
                return this.normalizeType({
                    kind: 'named',
                    name: 'Address',
                    params: []
                }, pallet)
            case 'PairOf':
            case 'Range':
            case 'RangeInclusive': {
                let param = this.normalizeType(assertOneParam(type), pallet)
                return {
                    kind: 'tuple',
                    params: [param, param]
                }
            }
            default:
                return {
                    kind: 'named',
                    name: type.name,
                    params: type.params.map(p => typeof p == 'number' ? p : this.normalizeType(p, pallet))
                }
        }
    }

    private buildScaleType(type: texp.Type): Type {
        switch(type.kind) {
            case 'named':
                return this.buildNamedType(type)
            case 'array':
                return this.buildArray(type)
            case 'tuple':
                return this.buildTuple(type)
            default:
                throw unexpectedCase((type as any).kind)
        }
    }

    private buildNamedType(type: texp.NamedType): Type {
        if (this.definitions[type.name]) return this.definitions[type.name]()

        let def = this.oldTypes.types[type.name]
        if (def) return this.buildFromDefinition(type.name, def)

        let primitive = asPrimitive(type.name)
        if (primitive) {
            assertNoParams(type)
            return {
                kind: TypeKind.Primitive,
                primitive
            }
        }

        switch(type.name) {
            case 'DoNotConstruct':
                return {
                    kind: TypeKind.DoNotConstruct
                }
            case 'Vec': {
                let param = this.use(assertOneParam(type))
                return {
                    kind: TypeKind.Sequence,
                    type: param
                }
            }
            case 'BitVec':
                return {
                    kind: TypeKind.BitSequence,
                    bitStoreType: this.use('U8'),
                    bitOrderType: -1
                }
            case 'Option': {
                let param = this.use(assertOneParam(type))
                return {
                    kind: TypeKind.Option,
                    type: param
                }
            }
            case 'Result': {
                let [ok, error] = assertTwoParams(type)
                return {
                    kind: TypeKind.Variant,
                    variants: [
                        {
                            index: 0,
                            name: 'Ok',
                            fields: [
                                {type: this.use(ok)}
                            ]
                        },
                        {
                            index: 1,
                            name: 'Err',
                            fields: [
                                {type: this.use(error)}
                            ]
                        }
                    ]
                }
            }
            case 'Compact':
                return {
                    kind: TypeKind.Compact,
                    type: this.use(assertOneParam(type))
                }
        }

        throw new Error(`Type ${type.name} is not defined`)
    }

    private buildFromDefinition(typeName: string, def: OldTypeDefinition): Type | TypeAlias {
        let result: Type
        if (typeof def == 'string') {
            return {kind: -1, alias: this.use(def), name: typeName}
        } else if (def._enum) {
            result = this.buildEnum(def as OldEnumDefinition)
        } else if (def._set) {
            return this.types[this.buildSet(def as OldSetDefinition)]
        } else {
            result = this.buildStruct(def as OldStructDefinition)
        }
        result.path = [typeName]
        return result
    }

    private buildSet(def: OldSetDefinition): Ti {
        let len = def._set._bitLength || 8
        switch(len) {
            case 8:
            case 16:
            case 32:
            case 64:
            case 128:
            case 256:
                return this.use('U' + len)
            default:
                assert(len % 8 == 0, 'bit length must me aligned')
                return this.use(`[u8; ${len / 8}]`)
        }
    }

    private buildEnum(def: OldEnumDefinition): Type {
        let variants: Variant[] = []
        if (Array.isArray(def._enum)) {
            variants = def._enum.map((name, index) => {
                return {
                    name,
                    index,
                    fields: []
                }
            })
        } else if (isIndexedEnum(def)) {
            variants = Object.entries(def._enum).map(([name, index]) => {
                return {
                    name,
                    index,
                    fields: []
                }
            })
        } else {
            let index = 0
            for (let name in def._enum) {
                let type = def._enum[name]
                let fields: Field[] = []
                if (typeof type == 'string') {
                    fields.push({
                        type: this.use(type)
                    })
                } else if (type != null) {
                    assert(typeof type == 'object')
                    for (let key in type) {
                        fields.push({
                            name: key,
                            type: this.use(type[key])
                        })
                    }
                }
                variants.push({
                    name,
                    index,
                    fields
                })
                index += 1
            }
        }
        return {
            kind: TypeKind.Variant,
            variants
        }
    }

    private buildStruct(def: OldStructDefinition): Type {
        let fields: Field[] = []
        for (let name in def) {
            fields.push({
                name,
                type: this.use(def[name])
            })
        }
        return {
            kind: TypeKind.Composite,
            fields
        }
    }

    private buildArray(type: texp.ArrayType): Type {
        return {
            kind: TypeKind.Array,
            type: this.use(type.item),
            len: type.len
        }
    }

    private buildTuple(type: texp.TupleType): Type {
        return {
            kind: TypeKind.Tuple,
            tuple: type.params.map(p => this.use(p))
        }
    }

    add(type: Type): Ti {
        return this.types.push(type) - 1
    }

    get(ti: Ti): Type {
        return assertNotNull(this.types[ti])
    }
}


function isIndexedEnum(def: OldEnumDefinition): def is {_enum: Record<string, number>} {
    if (Array.isArray(def._enum)) return false
    for (let key in def._enum) {
        if (typeof def._enum[key] != 'number') return false
    }
    return true
}


function assertOneParam(type: texp.NamedType): texp.Type {
    if (type.params.length == 0) {
        throw new Error(`Invalid type ${texp.print(type)}: one type parameter expected`)
    }
    let param = type.params[0]
    if (typeof param == 'number') {
        throw new Error(`Invalid type ${texp.print(type)}: type parameter should refer to a type, not to bit size`)
    }
    return param
}


function assertTwoParams(type: texp.NamedType): [texp.Type, texp.Type] {
    if (type.params.length < 2) {
        throw new Error(`Invalid type ${texp.print(type)}: two type parameters expected`)
    }
    let param1 = type.params[0]
    if (typeof param1 == 'number') {
        throw new Error(`Invalid type ${texp.print(type)}: first type parameter should refer to a type, not to bit size`)
    }
    let param2 = type.params[1]
    if (typeof param2 == 'number') {
        throw new Error(`Invalid type ${texp.print(type)}: second type parameter should refer to a type, not to bit size`)
    }
    return [param1, param2]
}


function assertNoParams(type: texp.NamedType): void {
    if (type.params.length != 0) {
        throw new Error(`Invalid type ${texp.print(type)}: no type parameters expected for ${type.name}`)
    }
}


function convertGenericIntegerToPrimitive(kind: 'U' | 'I', type: texp.NamedType): string {
    if (type.params.length == 0) {
        throw new Error(`Invalid type ${texp.print(type)}: bit size is not specified`)
    }
    let size = type.params[0]
    if (typeof size != 'number') {
        throw new Error(`Invalid type ${texp.print(type)}: bit size expected as a first type parameter, e.g. ${type.name}<32>`)
    }
    switch(size) {
        case 8:
        case 16:
        case 32:
        case 64:
        case 128:
        case 256:
            return `${kind}${size}`
        default:
            throw new Error(`Invalid type ${texp.print(type)}: invalid bit size ${size}`)
    }
}


function asPrimitive(name: string): Primitive | undefined {
    switch(name.toLowerCase()) {
        case 'i8':
            return 'I8'
        case 'u8':
            return 'U8'
        case 'i16':
            return 'I16'
        case 'u16':
            return 'U16'
        case 'i32':
            return 'I32'
        case 'u32':
            return 'U32'
        case 'i64':
            return 'I64'
        case 'u64':
            return 'U64'
        case 'i128':
            return 'I128'
        case 'u128':
            return 'U128'
        case 'i256':
            return 'I256'
        case 'u256':
            return 'U256'
        case 'bool':
            return 'Bool'
        case 'str':
        case 'text':
            return 'Str'
        default:
            return undefined
    }
}
