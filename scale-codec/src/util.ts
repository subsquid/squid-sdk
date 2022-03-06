import assert from "assert"


export function assertNotNull<T>(val: T | undefined | null, msg?: string): T {
    assert(val != null, msg)
    return val
}


export function throwUnexpectedCase(val?: unknown): never {
    throw new Error(val ? `Unexpected case: ${val}` : `Unexpected case`)
}


export function checkInt(val: unknown, typeName: string, min: number, max: number): asserts val is number {
    let ok = Number.isInteger(val) && min <= (val as number) && max >= (val as number)
    if (!ok) throw new Error(
        `Invalid ${typeName}: ${val}`
    )
}


export function checkBigInt(val: unknown, typeName: string, min: bigint, max: bigint): asserts val is bigint {
    let ok = typeof val == 'bigint' && min <= val && max >= val
    if (!ok) throw new Error(
        `Invalid ${typeName}: ${val}`
    )
}


export const UTF8_DECODER = new TextDecoder("utf-8", {
    fatal: true,
    ignoreBOM: false
})


export const UTF8_ENCODER = new TextEncoder()


export function unsignedIntByteLength(val: bigint): number {
    let len = 0
    while (val > 0n) {
        val = val >> 8n
        len += 1
    }
    return len
}
