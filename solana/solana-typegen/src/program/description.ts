export class IdlDescription {}

import {DefinedType, GenericArg, GenericArgKind, Type} from './types'

type Bytes = string

export type Program = {
    instructions: Instruction[]
    accounts: Account[]
    events: Event[]
    errors: Error[]
    types: TypeDef[]
    constants: Const[]
}

export type Instruction = {
    name: string
    docs?: string[]
    discriminator: Bytes
    accounts: InstructionAccount[]
    args: InstructionArg[]
    returns?: Type
}

export type InstructionAccount = {
    name: string
    docs?: string[]
}

export type InstructionArg = {
    name: string
    docs?: string[]
    type: Type
}

export type Account = {
    name: string
    discriminator: Bytes
}

export type Event = {
    name: string
    discriminator: Bytes
}

export type Error = {
    name: string
    code: number
    msg?: string
}

export type Const = {
    name: string
    type: Type
    value: string
}

export type TypeDef = {
    name: string
    docs?: string[]
    generics?: TypeDefGeneric[]
    type: Type
}

export type TypeDefGenericType = {
    kind: GenericArgKind.Type
    name: string
}

export type TypeDefGenericConst = {
    kind: GenericArgKind.Const
    name: string
    type: Type
}

export type TypeDefGeneric = TypeDefGenericType | TypeDefGenericConst

