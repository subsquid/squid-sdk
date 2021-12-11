import {assertNotNull, getCamelCase, unexpectedCase} from "@subsquid/util"
import assert from "assert"
import {Field, Primitive, Ti, Type, TypeKind, Variant} from "../types"
import {normalizeByteSequences} from "../util"
import * as texp from "./typeExp"
import {OldEnumDefinition, OldSetDefinition, OldStructDefinition, OldTypeExp, OldTypes} from "./types"


export class OldTypeRegistry {
    private types: Type[] = []
    private lookup = new Map<OldTypeExp, Ti>()

    constructor(private oldTypes: OldTypes) {
    }

    getTypes(): Type[] {
        return normalizeByteSequences(this.types)
    }

    create(typeName: string, fn: () => Type): Ti {
        assert(!this.lookup.has(typeName), `Type ${typeName} was already defined`)
        let ti = this.types.push({kind: TypeKind.DoNotConstruct}) - 1
        this.lookup.set(typeName, ti)
        this.types[ti] = fn()
        return ti
    }

    use(typeExp: OldTypeExp | texp.Type, pallet?: string): Ti {
        let type = typeof typeExp == 'string' ? texp.parse(typeExp) : typeExp
        if (pallet != null && type.kind == 'named') {
            let section = getCamelCase(pallet)
            let alias = this.oldTypes.typesAlias?.[section]?.[type.name]
            if (alias) {
                type = {kind: 'named', name: alias, params: []}
            }
        }
        let key = texp.print(type)
        let ti = this.lookup.get(key)
        if (ti == null) {
            ti = this.types.push({kind: TypeKind.DoNotConstruct}) - 1
            this.lookup.set(key, ti)
            let t = this.buildScaleType(type)
            if (typeof t == 'number') {
                this.types[ti] = this.types[t]
            } else {
                this.types[ti] = t
            }
        }
        return ti
    }

    private buildScaleType(type: texp.Type): Type | Ti {
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

    private buildNamedType(type: texp.NamedType): Type | Ti {
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
            case 'Null':
                return {
                    kind: TypeKind.Tuple,
                    tuple: []
                }
            case 'UInt':
                return convertGenericIntegerToPrimitive('U', type)
            case 'Box':
                return this.use(assertOneParam(type))
            case 'Vec':
            case 'VecDeque':
            case 'WeakVec':
            case 'BoundedVec': {
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
            case 'Bytes': {
                assertNoParams(type)
                return {
                    kind: TypeKind.Bytes
                }
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
            case 'Compact': {
                let param = this.use(assertOneParam(type))
                let paramDef = this.types[param]
                if (paramDef.kind != TypeKind.Primitive || paramDef.primitive[0] != 'U') {
                    throw new Error(`Invalid type ${texp.print(type)}: only primitive unsigned numbers can be compact`)
                }
                return {
                    kind: TypeKind.Compact,
                    type: param
                }
            }
            case 'RawAddress':
                return this.use('Address')
            case 'PairOf': {
                let param = this.use(assertOneParam(type))
                return {
                    kind: TypeKind.Tuple,
                    tuple: [param, param]
                }
            }
        }
        let def = this.oldTypes.types[type.name]
        if (def == null) {
            throw new Error(`Type ${type.name} is not defined`)
        }
        let result: Type | Ti
        if (typeof def == 'string') {
            result = this.use(def)
        } else if (def._enum) {
            result = this.buildEnum(def as OldEnumDefinition)
        } else if (def._set) {
            result = this.buildSet(def as OldSetDefinition)
        } else {
            result = this.buildStruct(def as OldStructDefinition)
        }
        if (typeof result == 'object') {
            result.path = [type.name]
        }
        return result
    }

    private buildSet(def: OldSetDefinition): Type | Ti {
        let len = def._set._bitLength
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
    let param2 = type.params[0]
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


function convertGenericIntegerToPrimitive(kind: 'U' | 'I', type: texp.NamedType): Type {
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
            return {
                kind: TypeKind.Primitive,
                primitive: `${kind}${size}` as Primitive
            }
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
