import {Codec, address, array, binary, bool, f32, f64, fixedArray, i128, i16, i32, i64, i8, option, ref, string, struct, sum, tuple, u128, u16, u32, u64, u8, unit} from '@subsquid/borsh'

/**
 * Bar struct type
 */
export interface BarStruct {
    someField: boolean
    otherField: number
}

/**
 * Bar struct type
 */
export const BarStruct: Codec<BarStruct> = struct({
    someField: bool,
    otherField: u8,
})

export type FooEnum_Unnamed = [
    boolean,
    number,
    BarStruct,
]

export const FooEnum_Unnamed = tuple([
    bool,
    u8,
    BarStruct,
])

export type FooEnum_UnnamedSingle = [
    BarStruct,
]

export const FooEnum_UnnamedSingle = tuple([
    BarStruct,
])

export type FooEnum_Named = {
    /**
     * A bool field inside a struct tuple kind
     */
    boolField: boolean
    u8Field: number
    nested: BarStruct
}

export const FooEnum_Named = struct({
    /**
     * A bool field inside a struct tuple kind
     */
    boolField: bool,
    u8Field: u8,
    nested: BarStruct,
})

export type FooEnum_Struct = [
    BarStruct,
]

export const FooEnum_Struct = tuple([
    BarStruct,
])

export type FooEnum_OptionStruct = [
    BarStruct | undefined,
]

export const FooEnum_OptionStruct = tuple([
    option(BarStruct),
])

export type FooEnum_VecStruct = [
    Array<BarStruct>,
]

export const FooEnum_VecStruct = tuple([
    array(BarStruct),
])

export type FooEnum_NoFields = undefined

export const FooEnum_NoFields = unit

/**
 * Enum type
 */
export type FooEnum = 
    | {
        kind: 'Unnamed'
        value: FooEnum_Unnamed
      }
    | {
        kind: 'UnnamedSingle'
        value: FooEnum_UnnamedSingle
      }
    | {
        kind: 'Named'
        value: FooEnum_Named
      }
    | {
        kind: 'Struct'
        value: FooEnum_Struct
      }
    | {
        kind: 'OptionStruct'
        value: FooEnum_OptionStruct
      }
    | {
        kind: 'VecStruct'
        value: FooEnum_VecStruct
      }
    | {
        kind: 'NoFields'
        value?: FooEnum_NoFields
      }

/**
 * Enum type
 */
export const FooEnum: Codec<FooEnum> = sum(1, {
    Unnamed: {
        discriminator: 0,
        value: FooEnum_Unnamed,
    },
    UnnamedSingle: {
        discriminator: 1,
        value: FooEnum_UnnamedSingle,
    },
    Named: {
        discriminator: 2,
        value: FooEnum_Named,
    },
    Struct: {
        discriminator: 3,
        value: FooEnum_Struct,
    },
    OptionStruct: {
        discriminator: 4,
        value: FooEnum_OptionStruct,
    },
    VecStruct: {
        discriminator: 5,
        value: FooEnum_VecStruct,
    },
    NoFields: {
        discriminator: 6,
        value: FooEnum_NoFields,
    },
})

export interface FooStruct {
    field1: number
    field2: number
    nested: BarStruct
    vecNested: Array<BarStruct>
    optionNested?: BarStruct | undefined
    enumField: FooEnum
}

export const FooStruct: Codec<FooStruct> = struct({
    field1: u8,
    field2: u16,
    nested: BarStruct,
    vecNested: array(BarStruct),
    optionNested: option(BarStruct),
    enumField: FooEnum,
})

export interface ExternalMyStruct {
    someField: number
}

export const ExternalMyStruct: Codec<ExternalMyStruct> = struct({
    someField: u8,
})

export interface IdlSomeOtherModuleMyStruct {
    someU8: number
}

export const IdlSomeOtherModuleMyStruct: Codec<IdlSomeOtherModuleMyStruct> = struct({
    someU8: u8,
})

export interface SomeEvent {
    boolField: boolean
    externalMyStruct: ExternalMyStruct
    otherModuleMyStruct: IdlSomeOtherModuleMyStruct
}

export const SomeEvent: Codec<SomeEvent> = struct({
    boolField: bool,
    externalMyStruct: ExternalMyStruct,
    otherModuleMyStruct: IdlSomeOtherModuleMyStruct,
})

export interface SomeRetStruct {
    someField: number
}

export const SomeRetStruct: Codec<SomeRetStruct> = struct({
    someField: u8,
})

export interface ZcStruct {
    someField: number
}

export const ZcStruct: Codec<ZcStruct> = struct({
    someField: u16,
})

export interface SomeZcAccount {
    field: ZcStruct
}

export const SomeZcAccount: Codec<SomeZcAccount> = struct({
    field: ZcStruct,
})

/**
 * An account containing various fields
 */
export interface State {
    boolField: boolean
    u8Field: number
    i8Field: number
    u16Field: number
    i16Field: number
    u32Field: number
    i32Field: number
    f32Field: number
    u64Field: bigint
    i64Field: bigint
    f64Field: number
    u128Field: bigint
    i128Field: bigint
    bytesField: Uint8Array
    stringField: string
    pubkeyField: string
    vecField: Array<bigint>
    vecStructField: Array<FooStruct>
    optionField?: boolean | undefined
    optionStructField?: FooStruct | undefined
    structField: FooStruct
    arrayField: Array<boolean>
    enumField1: FooEnum
    enumField2: FooEnum
    enumField3: FooEnum
    enumField4: FooEnum
}

/**
 * An account containing various fields
 */
export const State: Codec<State> = struct({
    boolField: bool,
    u8Field: u8,
    i8Field: i8,
    u16Field: u16,
    i16Field: i16,
    u32Field: u32,
    i32Field: i32,
    f32Field: f32,
    u64Field: u64,
    i64Field: i64,
    f64Field: f64,
    u128Field: u128,
    i128Field: i128,
    bytesField: binary,
    stringField: string,
    pubkeyField: address,
    vecField: array(u64),
    vecStructField: array(FooStruct),
    optionField: option(bool),
    optionStructField: option(FooStruct),
    structField: FooStruct,
    arrayField: fixedArray(bool, 3),
    enumField1: FooEnum,
    enumField2: FooEnum,
    enumField3: FooEnum,
    enumField4: FooEnum,
})

export interface State2 {
    vecOfOption: Array<bigint | undefined>
    boxField: boolean
}

export const State2: Codec<State2> = struct({
    vecOfOption: array(option(u64)),
    boxField: bool,
})

export interface RecursiveStruct {
    recursiveField: RecursiveStruct
}

export const RecursiveStruct: Codec<RecursiveStruct> = struct({
    recursiveField: ref(() => RecursiveStruct),
})

export interface CycleStructB {
    recursiveField: CycleStructA
}

export const CycleStructB: Codec<CycleStructB> = struct({
    recursiveField: ref(() => CycleStructA),
})

export interface CycleStructA {
    recursiveField: CycleStructB
}

export const CycleStructA: Codec<CycleStructA> = struct({
    recursiveField: CycleStructB,
})
