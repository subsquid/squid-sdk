import {Codec, struct, bool, u8, tuple, ref, option, array, unit, sum, u16, i8, i16, u32, i32, f32, u64, i64, f64, u128, i128, binary, string, address, fixedArray} from '@subsquid/borsh'

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
    ref(() => BarStruct),
])

export type FooEnum_UnnamedSingle = [
    BarStruct,
]

export const FooEnum_UnnamedSingle = tuple([
    ref(() => BarStruct),
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
    nested: ref(() => BarStruct),
})

export type FooEnum_Struct = [
    BarStruct,
]

export const FooEnum_Struct = tuple([
    ref(() => BarStruct),
])

export type FooEnum_OptionStruct = [
    BarStruct | undefined,
]

export const FooEnum_OptionStruct = tuple([
    option(ref(() => BarStruct)),
])

export type FooEnum_VecStruct = [
    Array<BarStruct>,
]

export const FooEnum_VecStruct = tuple([
    array(ref(() => BarStruct)),
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
    nested: ref(() => BarStruct),
    vecNested: array(ref(() => BarStruct)),
    optionNested: option(ref(() => BarStruct)),
    enumField: ref(() => FooEnum),
})

export interface SomeEvent {
    boolField: boolean
    externalMyStruct: ExternalMyStruct
    otherModuleMyStruct: IdlSomeOtherModuleMyStruct
}

export const SomeEvent: Codec<SomeEvent> = struct({
    boolField: bool,
    externalMyStruct: ref(() => ExternalMyStruct),
    otherModuleMyStruct: ref(() => IdlSomeOtherModuleMyStruct),
})

export interface SomeRetStruct {
    someField: number
}

export const SomeRetStruct: Codec<SomeRetStruct> = struct({
    someField: u8,
})

export interface SomeZcAccount {
    field: ZcStruct
}

export const SomeZcAccount: Codec<SomeZcAccount> = struct({
    field: ref(() => ZcStruct),
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
    vecStructField: array(ref(() => FooStruct)),
    optionField: option(bool),
    optionStructField: option(ref(() => FooStruct)),
    structField: ref(() => FooStruct),
    arrayField: fixedArray(bool, 3),
    enumField1: ref(() => FooEnum),
    enumField2: ref(() => FooEnum),
    enumField3: ref(() => FooEnum),
    enumField4: ref(() => FooEnum),
})

export interface State2 {
    vecOfOption: Array<bigint | undefined>
    boxField: boolean
}

export const State2: Codec<State2> = struct({
    vecOfOption: array(option(u64)),
    boxField: bool,
})

export interface ZcStruct {
    someField: number
}

export const ZcStruct: Codec<ZcStruct> = struct({
    someField: u16,
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
