import {struct, u64} from '@subsquid/borsh'
import {instruction} from './abi.support'


export const transfer = instruction(
    {
        d1: '0x03',
    },
    {
        source: 0,
        destination: 1,
        signer: 2,
    },
    struct({
        amount: u64
    })
)
