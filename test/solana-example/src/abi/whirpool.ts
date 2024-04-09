import {bool, struct, u128, u64} from '@subsquid/borsh'
import {instruction} from './abi.support'


export const programId = 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc'


export const swap = instruction(
    {d8: '0xf8c69e91e17587c8'},
    {
        tokenProgram: 0,
        tokenAuthority: 1,
        whirlpool: 2,
        tokenOwnerAccountA: 3,
        tokenVaultA: 4,
        tokenOwnerAccountB: 5,
        tokenVaultB: 6,
        tickArray0: 7,
        tickArray1: 8,
        tickArray2: 9,
        oracle: 10
    },
    struct({
        amount: u64,
        otherAmountThreshold: u64,
        sqrtPriceLimit: u128,
        amountSpecifiedIsInput: bool,
        aToB: bool
    })
)
