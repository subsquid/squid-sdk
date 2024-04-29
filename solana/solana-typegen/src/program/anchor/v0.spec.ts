import {unexpectedCase} from '@subsquid/util-internal'
import {
    Program,
    Instruction,
    InstructionAccount,
    InstructionArg,
    TypeDef,
    Account,
    Const,
    Event,
    Error,
    TypeDefGeneric,
} from '../description'
import {TypeKind, Field, Type, GenericArg, GenericArgKind, Variant} from '../types'
import {toHex} from '@subsquid/util-internal-hex'

// ref https://github.com/coral-xyz/anchor/blob/c96846fce27b1eccd30c810546cd9daf4be2cbbf/ts/packages/anchor/src/idl.ts
// about IDL change https://github.com/coral-xyz/anchor/pull/2824

export type Idl = {
    address: string
    metadata: IdlMetadata
    docs?: string[]
    instructions: IdlInstruction[]
    accounts?: IdlAccount[]
    events?: IdlEvent[]
    errors?: IdlErrorCode[]
    types?: IdlTypeDef[]
    constants?: IdlConst[]
}

export type IdlMetadata = {
    name: string
    version: string
    spec: string
    description?: string
    repository?: string
    dependencies?: IdlDependency[]
    contact?: string
    deployments?: IdlDeployments
}

export type IdlDependency = {
    name: string
    version: string
}

export type IdlDeployments = {
    mainnet?: string
    testnet?: string
    devnet?: string
    localnet?: string
}

export type IdlInstruction = {
    name: string
    docs?: string[]
    discriminator: IdlDiscriminator
    accounts: IdlInstructionAccountItem[]
    args: IdlField[]
    returns?: IdlType
}

export type IdlInstructionAccountItem = IdlInstructionAccount | IdlInstructionAccounts

export type IdlInstructionAccount = {
    name: string
    docs?: string[]
    writable?: boolean
    signer?: boolean
    optional?: boolean
    address?: string
    pda?: IdlPda
    relations?: string[]
}

export type IdlInstructionAccounts = {
    name: string
    accounts: IdlInstructionAccount[]
}

export type IdlPda = {
    seeds: IdlSeed[]
    program?: IdlSeed
}

export type IdlSeed = IdlSeedConst | IdlSeedArg | IdlSeedAccount

export type IdlSeedConst = {
    kind: 'const'
    value: number[]
}

export type IdlSeedArg = {
    kind: 'arg'
    path: string
}

export type IdlSeedAccount = {
    kind: 'account'
    path: string
    account?: string
}

export type IdlAccount = {
    name: string
    discriminator: IdlDiscriminator
}

export type IdlEvent = {
    name: string
    discriminator: IdlDiscriminator
}

export type IdlConst = {
    name: string
    type: IdlType
    value: string
}

export type IdlErrorCode = {
    name: string
    code: number
    msg?: string
}

export type IdlField = {
    name: string
    docs?: string[]
    type: IdlType
}

export type IdlTypeDef = {
    name: string
    docs?: string[]
    serialization?: IdlSerialization
    repr?: IdlRepr
    generics?: IdlTypeDefGeneric[]
    type: IdlTypeDefTy
}

export type IdlSerialization = 'borsh' | 'bytemuck' | 'bytemuckunsafe' | {custom: string}

export type IdlRepr = IdlReprRust | IdlReprC | IdlReprTransparent

export type IdlReprRust = {
    kind: 'rust'
} & IdlReprModifier

export type IdlReprC = {
    kind: 'c'
} & IdlReprModifier

export type IdlReprTransparent = {
    kind: 'transparent'
}

export type IdlReprModifier = {
    packed?: boolean
    align?: number
}

export type IdlTypeDefGeneric = IdlTypeDefGenericType | IdlTypeDefGenericConst

export type IdlTypeDefGenericType = {
    kind: 'type'
    name: string
}

export type IdlTypeDefGenericConst = {
    kind: 'const'
    name: string
    type: string
}

export type IdlTypeDefTy = IdlTypeDefTyEnum | IdlTypeDefTyStruct | IdlTypeDefTyType

export type IdlTypeDefTyStruct = {
    kind: 'struct'
    fields?: IdlDefinedFields
}

export type IdlTypeDefTyEnum = {
    kind: 'enum'
    variants: IdlEnumVariant[]
}

export type IdlTypeDefTyType = {
    kind: 'type'
    alias: IdlType
}

export type IdlEnumVariant = {
    name: string
    fields?: IdlDefinedFields
}

export type IdlDefinedFields = IdlDefinedFieldsNamed | IdlDefinedFieldsTuple

export type IdlDefinedFieldsNamed = IdlField[]

export type IdlDefinedFieldsTuple = IdlType[]

export type IdlArrayLen = IdlArrayLenGeneric | IdlArrayLenValue

export type IdlArrayLenGeneric = {
    generic: string
}

export type IdlArrayLenValue = number

export type IdlGenericArg = IdlGenericArgType | IdlGenericArgConst

export type IdlGenericArgType = {kind: 'type'; type: IdlType}

export type IdlGenericArgConst = {kind: 'const'; value: string}

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
    | 'u256'
    | 'i256'
    | 'bytes'
    | 'string'
    | 'pubkey'
    | IdlTypeOption
    | IdlTypeCOption
    | IdlTypeVec
    | IdlTypeArray
    | IdlTypeDefined
    | IdlTypeGeneric

export type IdlTypeOption = {
    option: IdlType
}

export type IdlTypeCOption = {
    coption: IdlType
}

export type IdlTypeVec = {
    vec: IdlType
}

export type IdlTypeArray = {
    array: [idlType: IdlType, size: IdlArrayLen]
}

export type IdlTypeDefined = {
    defined: {
        name: string
        generics?: IdlGenericArg[]
    }
}

export type IdlTypeGeneric = {
    generic: string
}

export type IdlDiscriminator = number[]

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
                            docs: v.docs,
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
            discriminator: toHex(Buffer.from(i.discriminator)),
        }
    })

    let types: TypeDef[] = []

    if (idl.types) {
        types.push(...idl.types.map((t): TypeDef => fromTypeDef(t)))
    }

    const res: Program = {
        instructions,
        types,
        accounts:
            idl.accounts?.map((a): Account => {
                return {
                    name: a.name,
                    discriminator: toHex(Buffer.from(a.discriminator)),
                }
            }) ?? [],
        events:
            idl.events?.map((e): Event => {
                return {
                    name: e.name,
                    discriminator: toHex(Buffer.from(e.discriminator)),
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
            case 'pubkey':
                return {
                    kind: TypeKind.Primitive,
                    primitive: 'address',
                }
            default:
                throw unexpectedCase(type)
        }
    } else if ('array' in type) {
        if (typeof type.array[1] !== 'number') {
            throw new Error(`Generic array lengths are not supported`)
        }
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
            name: type.defined.name,
            generics: type.defined.generics?.map((g): GenericArg => {
                return g.kind === 'const'
                    ? {
                          kind: GenericArgKind.Const,
                          value: g.value,
                      }
                    : {
                          kind: GenericArgKind.Type,
                          type: fromType(g.type),
                      }
            }),
        }
    } else if ('option' in type) {
        return {
            kind: TypeKind.Option,
            type: fromType(type.option),
        }
    } else if ('generic' in type) {
        throw new Error(`Generic types are not supported`)
    } else if ('coption' in type) {
        throw new Error(`"coption" type is not supported`)
    } else {
        throw unexpectedCase(JSON.stringify(type))
    }
}

function fromTypeDef(typeDef: IdlTypeDef): TypeDef {
    switch (typeDef.type.kind) {
        case 'enum':
            return {
                name: typeDef.name,
                docs: typeDef.docs,
                type: {
                    kind: TypeKind.Enum,
                    variants: typeDef.type.variants.map((v) => fromEnumVariant(v)),
                },
                generics: typeDef.generics?.map((g): TypeDefGeneric => {
                    return g.kind === 'const'
                        ? {
                              kind: GenericArgKind.Const,
                              name: g.name,
                              type: fromType(g.type as IdlType),
                          }
                        : {
                              kind: GenericArgKind.Type,
                              name: g.name,
                          }
                }),
            }
        case 'struct':
            return {
                name: typeDef.name,
                docs: typeDef.docs,
                type: typeDef.type.fields?.length
                    ? typeDef.type.fields?.every((f) => typeof f === 'object' && 'type' in f)
                        ? {
                              kind: TypeKind.Struct,
                              fields: typeDef.type.fields.map((f): Field => {
                                  f = f as IdlField
                                  return {
                                      name: f.name,
                                      type: fromType(f.type),
                                  }
                              }),
                          }
                        : {
                              kind: TypeKind.Tuple,
                              tuple: typeDef.type.fields?.map((f): Type => fromType(f as IdlType)) || [],
                          }
                    : {
                          kind: TypeKind.Primitive,
                          primitive: 'unit',
                      },
                generics: typeDef.generics?.map((g): TypeDefGeneric => {
                    return g.kind === 'const'
                        ? {
                              kind: GenericArgKind.Const,
                              name: g.name,
                              type: fromType(g.type as IdlType),
                          }
                        : {
                              kind: GenericArgKind.Type,
                              name: g.name,
                          }
                }),
            }
        default:
            throw unexpectedCase(JSON.stringify(typeDef))
    }
}

function fromEnumVariant(variant: IdlEnumVariant): Variant {
    return {
        name: variant.name,
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
