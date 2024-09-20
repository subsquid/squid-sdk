import {unit, struct, bool, u8, i8, u16, i16, u32, i32, f32, u64, i64, f64, u128, i128, binary, string, address, array, option, fixedArray} from '@subsquid/borsh'
import {instruction} from '../abi.support'
import {FooStruct, FooEnum} from './types'

export type CauseError = undefined

export const causeError = instruction(
    {
        d8: '0x43682511029b4411',
    },
    {
    },
    unit,
)

export type Initialize = undefined

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
        nestedClock: 1,
        nestedRent: 2,
        zcAccount: 3,
        tokenAccount: 4,
        mintAccount: 5,
        tokenInterfaceAccount: 6,
        mintInterfaceAccount: 7,
        payer: 8,
        systemProgram: 9,
    },
    unit,
)

/**
 * Initializes an account with specified values
 */
export interface InitializeWithValues {
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
 * Initializes an account with specified values
 */
export const initializeWithValues = instruction(
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
        nestedClock: 1,
        nestedRent: 2,
        zcAccount: 3,
        tokenAccount: 4,
        mintAccount: 5,
        tokenInterfaceAccount: 6,
        mintInterfaceAccount: 7,
        payer: 8,
        systemProgram: 9,
    },
    struct({
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
    }),
)

/**
 * a separate instruction due to initialize_with_values having too many arguments
 * https://github.com/solana-labs/solana/issues/23978
 */
export interface InitializeWithValues2 {
    vecOfOption: Array<bigint | undefined>
    boxField: boolean
}

/**
 * a separate instruction due to initialize_with_values having too many arguments
 * https://github.com/solana-labs/solana/issues/23978
 */
export const initializeWithValues2 = instruction(
    {
        d8: '0xf8be1561ef9427b5',
    },
    {
        state: 0,
        payer: 1,
        systemProgram: 2,
    },
    struct({
        vecOfOption: array(option(u64)),
        boxField: bool,
    }),
)
