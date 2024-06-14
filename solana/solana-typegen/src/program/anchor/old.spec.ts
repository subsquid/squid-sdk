import {unexpectedCase} from '@subsquid/util-internal'
import {toHex} from '@subsquid/util-internal-hex'
import {toSnakeCase, toCamelCase} from '@subsquid/util-naming'
import {
    Program,
    InstructionArg,
    TypeDef,
    InstructionAccount,
    Instruction,
    Account,
    Event,
    Error,
    Const,
} from '../description'
import {Field, Type, TypeKind, Variant} from '../types'
import * as crypto from 'crypto'
import {Sink} from '@subsquid/borsh'

// ref https://github.com/coral-xyz/anchor/blob/8ffb22d936f0f6468d8f00a1e8a3c24b07e5490e/ts/src/idl.ts

export type Idl = {
    version: string
    name: string
    instructions: IdlInstruction[]
    state?: IdlState
    accounts?: IdlTypeDef[]
    types?: IdlTypeDef[]
    events?: IdlEvent[]
    errors?: IdlErrorCode[]
    constants?: IdlConstant[]
    metadata?: IdlMetadata
}

export type IdlMetadata = any

export type IdlConstant = {
    name: string
    type: IdlType
    value: string
}

export type IdlEvent = {
    name: string
    fields: IdlEventField[]
}

export type IdlEventField = {
    name: string
    type: IdlType
    docs?: string[]
    index: boolean
}

export type IdlInstruction = {
    name: string
    docs?: string[]
    accounts: IdlAccountItem[]
    args: IdlField[]
    /**
     * Shank compatibility
     */
    discriminant?: IdlInstructionDiscriminant
}

export type IdlInstructionDiscriminant = {
    type: 'u8' | 'u16' | 'u32'
    value: number
}

export type IdlState = {
    struct: IdlTypeDef
    methods: IdlStateMethod[]
}

export type IdlStateMethod = IdlInstruction

export type IdlAccountItem = IdlAccount | IdlAccounts

export type IdlAccount = {
    name: string
    docs?: string[]
    isMut: boolean
    isSigner: boolean
    pda?: IdlPda
}

export type IdlPda = {
    seeds: IdlSeed[]
    programId?: IdlSeed
}

export type IdlSeed = any

export type IdlAccounts = {
    name: string
    docs?: string[]
    accounts: IdlAccountItem[]
}

export type IdlField = {
    name: string
    docs?: string[]
    type: IdlType
}

export type IdlTypeDef = {
    name: string
    type: IdlTypeDefTy
}

export type IdlTypeDefTyStruct = {
    kind: 'struct'
    fields: IdlTypeDefStruct
}

export type IdlTypeDefTyEnum = {
    kind: 'enum'
    variants: IdlEnumVariant[]
}

type IdlTypeDefTy = IdlTypeDefTyEnum | IdlTypeDefTyStruct

type IdlTypeDefStruct = Array<IdlField>

export type IdlType =
    | 'bool'
    | 'u8'
    | 'i8'
    | 'u16'
    | 'i16'
    | 'u32'
    | 'i32'
    | 'f32'
    | 'u64'
    | 'i64'
    | 'f64'
    | 'u128'
    | 'i128'
    | 'bytes'
    | 'string'
    | 'publicKey'
    | IdlTypeDefined
    | IdlTypeOption
    | IdlTypeCOption
    | IdlTypeVec
    | IdlTypeArray

export type IdlTypeDefined = {
    defined: string
}

export type IdlTypeOption = {
    option: IdlType
}

export type IdlTypeCOption = {
    prefix: 'u8' | 'u16' | 'u32' | 'u64'
    coption: IdlType
}

export type IdlTypeVec = {
    vec: IdlType
}

export type IdlTypeArray = {
    array: [idlType: IdlType, size: number]
}

export type IdlEnumVariant = {
    name: string
    fields?: IdlEnumFields
}

type IdlEnumFields = IdlEnumFieldsNamed | IdlEnumFieldsTuple

type IdlEnumFieldsNamed = IdlField[]

type IdlEnumFieldsTuple = IdlType[]

export type IdlErrorCode = {
    code: number
    name: string
    msg?: string
}

export function build(idl: Idl): Program {
    let instructions: Instruction[] = idl.instructions.map((i): Instruction => {
        return {
            name: i.name,
            docs: i.docs,
            accounts: i.accounts.flatMap((a) => {
                if ('accounts' in a) {
                    return a.accounts.map((v): InstructionAccount => {
                        return {
                            name: a.name + '_' + v.name,
                            docs: v.docs ? a.docs?.concat(['\n', ...v.docs]) : a.docs,
                        }
                    })
                } else {
                    return {
                        name: a.name,
                        docs: a.docs,
                    }
                }
            }),
            args: i.args.map((a): InstructionArg => {
                return {
                    name: a.name,
                    docs: a.docs,
                    type: fromType(a.type),
                }
            }),
            discriminator: makeInstructionDiscriminator('global', i),
        }
    })

    let types: TypeDef[] = []

    if (idl.types) {
        types.push(...idl.types.map((t): TypeDef => fromTypeDef(t)))
    }

    if (idl.accounts) {
        types.push(...idl.accounts.map((a): TypeDef => fromTypeDef(a)))
    }

    if (idl.events) {
        types.push(
            ...idl.events.map((e): TypeDef => {
                return {
                    name: e.name,
                    type: {
                        kind: TypeKind.Struct,
                        fields: e.fields.map((f): Field => {
                            return {
                                name: f.name,
                                docs: f.docs,
                                type: fromType(f.type),
                            }
                        }),
                    },
                }
            })
        )
    }

    if (idl.state) {
        types.push(fromTypeDef(idl.state.struct))

        instructions.push(
            ...idl.state.methods.map((i): Instruction => {
                return {
                    name: i.name,
                    docs: i.docs,
                    accounts: i.accounts,
                    args: i.args.map((a): InstructionArg => {
                        return {
                            name: a.name,
                            docs: a.docs,
                            type: fromType(a.type),
                        }
                    }),
                    discriminator: makeInstructionDiscriminator('state', i),
                }
            })
        )
    }

    const res: Program = {
        programId: idl.metadata?.address,
        instructions,
        types,
        accounts:
            idl.accounts?.map((a): Account => {
                return {
                    name: a.name,
                    discriminator: makeAccountDiscriminator(a),
                }
            }) ?? [],
        events:
            idl.events?.map((e): Event => {
                return {
                    name: e.name,
                    discriminator: makeEventDiscriminator(e),
                }
            }) ?? [],
        constants:
            idl.constants?.map((c): Const => {
                return {
                    name: c.name,
                    type: fromType(c.type),
                    value: c.value,
                }
            }) ?? [],
        errors:
            idl.errors?.map((e): Error => {
                return {
                    name: e.name,
                    code: e.code,
                    msg: e.msg,
                }
            }) ?? [],
    }

    return res
}

function fromType(type: IdlType): Type {
    if (typeof type === 'string') {
        switch (type) {
            case 'bool':
            case 'f32':
            case 'f64':
            case 'i128':
            case 'i16':
            case 'i32':
            case 'i64':
            case 'i8':
            case 'string':
            case 'u128':
            case 'u16':
            case 'u32':
            case 'u64':
            case 'u8':
                return {
                    kind: TypeKind.Primitive,
                    primitive: type,
                }
            case 'bytes':
                return {
                    kind: TypeKind.Primitive,
                    primitive: 'binary',
                }
            case 'publicKey':
                return {
                    kind: TypeKind.Primitive,
                    primitive: 'address',
                }
            default:
                throw unexpectedCase(type)
        }
    } else if ('array' in type) {
        return {
            kind: TypeKind.FixedArray,
            type: fromType(type.array[0]),
            len: type.array[1],
        }
    } else if ('vec' in type) {
        return {
            kind: TypeKind.Array,
            type: fromType(type.vec),
        }
    } else if ('defined' in type) {
        return {
            kind: TypeKind.Defined,
            name: type.defined,
        }
    } else if ('option' in type) {
        return {
            kind: TypeKind.Option,
            type: fromType(type.option),
        }
    } else if ('coption' in type) {
        if (type.prefix == 'u8' ) {
            return {
                kind: TypeKind.Option,
                type: fromType(type.coption),
            }
        }
        let d = type.prefix === 'u16' ? 2 : type.prefix === 'u32' ? 4 : 8;
        return {
            kind: TypeKind.Enum,
            variants: [
            {
                name: 'None',
                discriminator: d,
                type: { kind: TypeKind.Primitive, primitive: 'unit' },
            },
            { name: 'Some', discriminator: d, type: fromType(type.coption) },
            ].map((v, i) => fromEnumVariant(v, i)),
        }
    } else {
        throw unexpectedCase(JSON.stringify(type))
    }
}

function fromTypeDef(typeDef: IdlTypeDef): TypeDef {
    switch (typeDef.type.kind) {
        case 'enum':
            return {
                name: typeDef.name,
                type: {
                    kind: TypeKind.Enum,
                    variants: typeDef.type.variants.map((v, i) => fromEnumVariant(v, i)),
                },
            }
        case 'struct':
            return {
                name: typeDef.name,
                type: typeDef.type.fields?.length
                    ? {
                          kind: TypeKind.Struct,
                          fields: typeDef.type.fields.map((f): Field => {
                              return {
                                  name: f.name,
                                  docs: f.docs,
                                  type: fromType(f.type),
                              }
                          }),
                      }
                    : {
                          kind: TypeKind.Primitive,
                          primitive: 'unit',
                      },
            }
        default:
            throw unexpectedCase(JSON.stringify(typeDef))
    }
}

function fromEnumVariant(variant: IdlEnumVariant, index: number): Variant {
    return {
        name: variant.name,
        discriminator: index,
        type: variant.fields?.length
            ? variant.fields?.every((f) => typeof f === 'object' && 'type' in f)
                ? {
                      kind: TypeKind.Struct,
                      fields: variant.fields.map((f): Field => {
                          f = f as IdlField
                          return {
                              name: f.name,
                              docs: f.docs,
                              type: fromType(f.type),
                          }
                      }),
                  }
                : {
                      kind: TypeKind.Tuple,
                      tuple: variant.fields?.map((f): Type => fromType(f as IdlType)) || [],
                  }
            : {
                  kind: TypeKind.Primitive,
                  primitive: 'unit',
              },
    }
}

function makeDiscriminantDiscriminator(discriminant: IdlInstructionDiscriminant) {
    let sink = new Sink()

    switch (discriminant.type) {
        case 'u8':
            sink.u8(discriminant.value)
            break
        case 'u16':
            sink.u16(discriminant.value)
            break
        case 'u32':
            sink.u32(Number(discriminant.value))
            break
        default:
            throw unexpectedCase(discriminant.type)
    }

    return toHex(sink.result())
}

// ref https://github.com/coral-xyz/anchor/blob/8ffb22d936f0f6468d8f00a1e8a3c24b07e5490e/ts/src/coder/borsh/instruction.ts#L94
function makeInstructionDiscriminator(nameSpace: string, ix: IdlInstruction) {
    // make it shank compatible
    if (ix.discriminant) return makeDiscriminantDiscriminator(ix.discriminant)

    let name = toSnakeCase(ix.name)
    let preimage = `${nameSpace}:${name}`
    const hash = crypto.createHash('sha256')
    hash.update(preimage)
    return toHex(hash.digest().subarray(0, 8))
}

function makeAccountDiscriminator(a: {name: string}) {
    let name = toCamelCase(a.name)
    let preimage = `account:${name[0].toUpperCase() + name.slice(1)}`
    const hash = crypto.createHash('sha256')
    hash.update(preimage)
    return toHex(hash.digest().subarray(0, 8))
}

function makeEventDiscriminator(e: {name: string}) {
    let preimage = `event:${e.name}`
    const hash = crypto.createHash('sha256')
    hash.update(preimage)
    return toHex(hash.digest().subarray(0, 8))
}
