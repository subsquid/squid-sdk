import {number, struct, tuple, union, unknown} from '@subsquid/substrate-runtime/lib/sts'


export const BatchInterrupted = union(
    struct({
        index: number(),
        error: unknown()
    }),
    tuple(number(), unknown())
)
