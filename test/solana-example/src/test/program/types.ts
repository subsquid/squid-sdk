import {Codec, struct, bool, u8, tuple, ref, option, array, unit, sum, u16, i8, i16, u32, i32, f32, u64, i64, f64, u128, i128, binary, string, address, fixedArray} from '@subsquid/borsh'

/**
 * Bar struct type
 */
export type BarStructType = {
    some_field: boolean
    other_field: number
}

/**
 * Bar struct type
 */
export const BarStruct: Codec<BarStructType> = struct({
    some_field: bool,
    other_field: u8,
})

export type FooEnumType_Unnamed = [
    boolean,
    number,
    BarStructType,
]

export const FooEnum_Unnamed = tuple([
    bool,
    u8,
    ref(() => BarStruct),
])

export type FooEnumType_UnnamedSingle = [
    BarStructType,
]

export const FooEnum_UnnamedSingle = tuple([
    ref(() => BarStruct),
])

export type FooEnumType_Named = {
    /**
     * A bool field inside a struct tuple kind
     */
    bool_field: boolean
    u8_field: number
    nested: BarStructType
}

export const FooEnum_Named = struct({
    /**
     * A bool field inside a struct tuple kind
     */
    bool_field: bool,
    u8_field: u8,
    nested: ref(() => BarStruct),
})

export type FooEnumType_Struct = [
    BarStructType,
]

export const FooEnum_Struct = tuple([
    ref(() => BarStruct),
])

export type FooEnumType_OptionStruct = [
    BarStructType | undefined,
]

export const FooEnum_OptionStruct = tuple([
    option(ref(() => BarStruct)),
])

export type FooEnumType_VecStruct = [
    Array<BarStructType>,
]

export const FooEnum_VecStruct = tuple([
    array(ref(() => BarStruct)),
])

export type FooEnumType_NoFields = undefined

export const FooEnum_NoFields = unit

/**
 * Enum type
 */
export type FooEnumType = 
    | {
        kind: 'Unnamed'
        value: FooEnumType_Unnamed
    }
    | {
        kind: 'UnnamedSingle'
        value: FooEnumType_UnnamedSingle
    }
    | {
        kind: 'Named'
        value: FooEnumType_Named
    }
    | {
        kind: 'Struct'
        value: FooEnumType_Struct
    }
    | {
        kind: 'OptionStruct'
        value: FooEnumType_OptionStruct
    }
    | {
        kind: 'VecStruct'
        value: FooEnumType_VecStruct
    }
    | {
        kind: 'NoFields'
        value?: FooEnumType_NoFields
    }

/**
 * Enum type
 */
export const FooEnum: Codec<FooEnumType> = sum(1, {
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

export type FooStructType = {
    field1: number
    field2: number
    nested: BarStructType
    vec_nested: Array<BarStructType>
    option_nested?: BarStructType | undefined
    enum_field: FooEnumType
}

export const FooStruct: Codec<FooStructType> = struct({
    field1: u8,
    field2: u16,
    nested: ref(() => BarStruct),
    vec_nested: array(ref(() => BarStruct)),
    option_nested: option(ref(() => BarStruct)),
    enum_field: ref(() => FooEnum),
})

export type SomeEventType = {
    bool_field: boolean
    external_my_struct: ExternalMyStructType
    other_module_my_struct: IdlSomeOtherModuleMyStructType
}

export const SomeEvent: Codec<SomeEventType> = struct({
    bool_field: bool,
    external_my_struct: ref(() => external__MyStruct),
    other_module_my_struct: ref(() => idl__some_other_module__MyStruct),
})

export type SomeRetStructType = {
    some_field: number
}

export const SomeRetStruct: Codec<SomeRetStructType> = struct({
    some_field: u8,
})

export type SomeZcAccountType = {
    field: ZcStructType
}

export const SomeZcAccount: Codec<SomeZcAccountType> = struct({
    field: ref(() => ZcStruct),
})

/**
 * An account containing various fields
 */
export type StateType = {
    bool_field: boolean
    u8_field: number
    i8_field: number
    u16_field: number
    i16_field: number
    u32_field: number
    i32_field: number
    f32_field: number
    u64_field: bigint
    i64_field: bigint
    f64_field: number
    u128_field: bigint
    i128_field: bigint
    bytes_field: Uint8Array
    string_field: string
    pubkey_field: string
    vec_field: Array<bigint>
    vec_struct_field: Array<FooStructType>
    option_field?: boolean | undefined
    option_struct_field?: FooStructType | undefined
    struct_field: FooStructType
    array_field: Array<boolean>
    enum_field_1: FooEnumType
    enum_field_2: FooEnumType
    enum_field_3: FooEnumType
    enum_field_4: FooEnumType
}

/**
 * An account containing various fields
 */
export const State: Codec<StateType> = struct({
    bool_field: bool,
    u8_field: u8,
    i8_field: i8,
    u16_field: u16,
    i16_field: i16,
    u32_field: u32,
    i32_field: i32,
    f32_field: f32,
    u64_field: u64,
    i64_field: i64,
    f64_field: f64,
    u128_field: u128,
    i128_field: i128,
    bytes_field: binary,
    string_field: string,
    pubkey_field: address,
    vec_field: array(u64),
    vec_struct_field: array(ref(() => FooStruct)),
    option_field: option(bool),
    option_struct_field: option(ref(() => FooStruct)),
    struct_field: ref(() => FooStruct),
    array_field: fixedArray(bool, 3),
    enum_field_1: ref(() => FooEnum),
    enum_field_2: ref(() => FooEnum),
    enum_field_3: ref(() => FooEnum),
    enum_field_4: ref(() => FooEnum),
})

export type State2Type = {
    vec_of_option: Array<bigint | undefined>
    box_field: boolean
}

export const State2: Codec<State2Type> = struct({
    vec_of_option: array(option(u64)),
    box_field: bool,
})

export type ZcStructType = {
    some_field: number
}

export const ZcStruct: Codec<ZcStructType> = struct({
    some_field: u16,
})

export type ExternalMyStructType = {
    some_field: number
}

export const external__MyStruct: Codec<ExternalMyStructType> = struct({
    some_field: u8,
})

export type IdlSomeOtherModuleMyStructType = {
    some_u8: number
}

export const idl__some_other_module__MyStruct: Codec<IdlSomeOtherModuleMyStructType> = struct({
    some_u8: u8,
})
