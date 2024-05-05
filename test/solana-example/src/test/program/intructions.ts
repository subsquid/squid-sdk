import {unit, struct, bool, u8, i8, u16, i16, u32, i32, f32, u64, i64, f64, u128, i128, binary, string, address, array, ref, option, fixedArray} from '@subsquid/borsh'
import {instruction} from '../idl.support'
import {FooStructType, FooEnumType, FooStruct, FooEnum} from './types'

export type CauseErrorType = {
}

export const cause_error = instruction(
    {
        d8: '0x43682511029b4411',
    },
    {
    },
    unit
)

export type InitializeType = {
}

export const initialize = instruction(
    {
        d8: '0xafaf6d1f0d989bed',
    },
    {
        /**
         * State account
         */
        state: 0,
        /**
         * Sysvar clock
         */
        nested_clock: 1,
        nested_rent: 2,
        zc_account: 3,
        token_account: 4,
        mint_account: 5,
        token_interface_account: 6,
        mint_interface_account: 7,
        payer: 8,
        system_program: 9,
    },
    unit
)

/**
 * Initializes an account with specified values
 */
export type InitializeWithValuesType = {
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
 * Initializes an account with specified values
 */
export const initialize_with_values = instruction(
    {
        d8: '0xdc4908d5b245b58d',
    },
    {
        /**
         * State account
         */
        state: 0,
        /**
         * Sysvar clock
         */
        nested_clock: 1,
        nested_rent: 2,
        zc_account: 3,
        token_account: 4,
        mint_account: 5,
        token_interface_account: 6,
        mint_interface_account: 7,
        payer: 8,
        system_program: 9,
    },
    struct({
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
        vec_struct_field: array(FooStruct),
        option_field: option(bool),
        option_struct_field: option(FooStruct),
        struct_field: FooStruct,
        array_field: fixedArray(bool, 3),
        enum_field_1: FooEnum,
        enum_field_2: FooEnum,
        enum_field_3: FooEnum,
        enum_field_4: FooEnum,
    }),
)

/**
 * a separate instruction due to initialize_with_values having too many arguments
 * https://github.com/solana-labs/solana/issues/23978
 */
export type InitializeWithValues2Type = {
    vec_of_option: Array<bigint | undefined>
    box_field: boolean
}

/**
 * a separate instruction due to initialize_with_values having too many arguments
 * https://github.com/solana-labs/solana/issues/23978
 */
export const initialize_with_values2 = instruction(
    {
        d8: '0xf8be1561ef9427b5',
    },
    {
        state: 0,
        payer: 1,
        system_program: 2,
    },
    struct({
        vec_of_option: array(option(u64)),
        box_field: bool,
    }),
)
