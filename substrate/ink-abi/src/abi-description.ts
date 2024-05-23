import {Field, Primitive, Ti, Type, TypeKind} from '@subsquid/substrate-runtime/lib/metadata'
import {normalizeMetadataTypes} from '@subsquid/substrate-runtime/lib/metadata/util'
import {def, unexpectedCase} from '@subsquid/util-internal'
import {
    ConstructorSpecFor_PortableForm,
    FieldFor_PortableForm,
    MessageSpecFor_PortableForm,
    PortableType
} from './metadata/v3/interfaces'
import {InkProject} from './metadata/validator'


/**
 * Hex encoded byte string
 */
export type Bytes = string


export interface SelectorsMap {
    [selector: string]: number
}


export interface AbiEvent {
    type: Ti
    amountIndexed: number
    signatureTopic?: Bytes
}


export class AbiDescription {
    constructor(private project: InkProject) {
        this.events()
        this.constructors()
        this.messages()
    }

    @def
    messageSelectors(): SelectorsMap {
        let map: SelectorsMap = {}
        this.project.spec.messages.forEach((msg, index) => {
            map[msg.selector] = index
        })
        return map
    }

    @def
    constructorSelectors(): SelectorsMap {
        let map: SelectorsMap = {}
        this.project.spec.constructors.forEach((msg, index) => {
            map[msg.selector] = index
        })
        return map
    }

    @def
    messages(): Ti {
        return this.createMessagesType(this.project.spec.messages)
    }

    @def
    constructors(): Ti {
        return this.createMessagesType(this.project.spec.constructors)
    }

    private createMessagesType(list: (MessageSpecFor_PortableForm | ConstructorSpecFor_PortableForm)[]): Ti {
        return this.add({
            kind: TypeKind.Variant,
            variants: list.map((msg, index) => {
                return {
                    name: normalizeLabel(msg.label),
                    index,
                    fields: msg.args.map(arg => {
                        return {
                            name: normalizeLabel(arg.label),
                            type: arg.type.type
                        }
                    }),
                    docs: msg.docs
                }
            })
        })
    }

    @def
    events(): AbiEvent[] {
        return this.project.spec.events.map(e => {
            let ti = this.add({
                kind: TypeKind.Composite,
                fields: e.args.map(arg => {
                    return {
                        name: normalizeLabel(arg.label),
                        type: arg.type.type,
                        docs: arg.docs
                    }
                })
            })

            return {
                type: ti,
                amountIndexed: e.args.reduce((val, e) => e.indexed ? val + 1 : val, 0),
                signatureTopic: e.signature_topic as Bytes
            }
        })
    }

    @def
    private _types(): Type[] {
        return this.project.types.map(toType)
    }

    private add(type: Type): Ti {
        return this._types().push(type) - 1
    }

    @def
    types(): Type[] {
        return normalizeMetadataTypes(this._types())
    }
}


function toType(t: PortableType): Type {
    let info = {
        path: t.type.path,
        docs: t.type.docs
    }
    if ('primitive' in t.type.def) {
        return {
            kind: TypeKind.Primitive,
            primitive: capitalize(t.type.def.primitive) as Primitive,
            ...info
        }
    } else if ('compact' in t.type.def) {
        return {
            kind: TypeKind.Compact,
            type: t.type.def.compact.type,
            ...info
        }
    } else if ('sequence' in t.type.def) {
        return {
            kind: TypeKind.Sequence,
            type: t.type.def.sequence.type,
            ...info
        }
    } else if ('bitsequence' in t.type.def) {
        return {
            kind: TypeKind.BitSequence,
            bitStoreType: t.type.def.bitsequence.bit_store_type,
            bitOrderType: t.type.def.bitsequence.bit_order_type,
            ...info
        }
    } else if ('array' in t.type.def) {
        return {
            kind: TypeKind.Array,
            type: t.type.def.array.type,
            len: t.type.def.array.len,
            ...info
        }
    } else if ('tuple' in t.type.def) {
        return {
            kind: TypeKind.Tuple,
            tuple: t.type.def.tuple,
            ...info
        }
    } else if ('composite' in t.type.def) {
        return {
            kind: TypeKind.Composite,
            fields: t.type.def.composite.fields?.map(toField) || [],
            ...info
        }
    } else if ('variant' in t.type.def) {
        return {
            kind: TypeKind.Variant,
            variants: t.type.def.variant.variants?.map(v => {
                let {name, index, docs} = v
                return {
                    name,
                    index,
                    fields: v.fields?.map(toField) || [],
                    docs
                }
            }) || [],
            ...info
        }
    } else {
        throw unexpectedCase()
    }
}


function toField(f: FieldFor_PortableForm): Field {
    let {name, ...rest} = f
    let sf: Field = rest
    if (name) {
        sf.name = name
    }
    return sf
}


function capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1)
}


function normalizeLabel(label: string) {
    return label.replace('::', '_')
}
