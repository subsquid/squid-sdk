import assert from "assert"


export function assertNotNull<T>(val: T | undefined | null, msg?: string): T {
    assert(val != null, msg)
    return val
}


export function throwUnexpectedCase(val?: unknown): never {
    throw new Error(val ? `Unexpected case: ${val}` : `Unexpected case`)
}
