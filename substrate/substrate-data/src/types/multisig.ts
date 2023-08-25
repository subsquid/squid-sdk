import {bytes, closedEnum, struct, tuple, union, unknown} from '@subsquid/substrate-runtime/lib/sts'


const Result = closedEnum({
    Ok: unknown(),
    Err: unknown()
})


export const MultisigExecuted = union(
    struct({
        multisig: bytes(),
        callHash: bytes(),
        result: Result
    }),
    tuple(unknown(), unknown(), bytes(), bytes(), Result)
)
