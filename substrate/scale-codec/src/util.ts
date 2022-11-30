import assert from "assert"


export function assertNotNull<T>(val: T | undefined | null, msg?: string): T {
    assert(val != null, msg)
    return val
}


export function throwUnexpectedCase(val?: unknown): never {
    throw new Error(val ? `Unexpected case: ${val}` : `Unexpected case`)
}


function checkInt(val: unknown, sign: string, bitSize: number, min: number, max: number): asserts val is number {
    let ok = Number.isInteger(val) && min <= (val as number) && max >= (val as number)
    if (!ok) throw new Error(
        `Invalid ${sign}${bitSize}: ${val}`
    )
}


function checkBigInt(val: unknown, sign: string, bitSize: number, min: bigint, max: bigint): asserts val is bigint {
    let ok = typeof val == 'bigint' && min <= val && max >= val
    if (!ok) throw new Error(
        `Invalid ${sign}${bitSize}: ${val}`
    )
}


export function checkSignedInt(val: unknown, bitSize: number): asserts val is number {
    let min: number
    let max: number
    switch(bitSize) {
        case 8:
            min = -0x80
            max = 0x7f
            break
        case 16:
            min = -0x8000
            max = 0x7fff
            break
        case 32:
            min = -0x80000000
            max = 0x7fffffff
            break
        default:
            throwUnexpectedCase(bitSize)
    }
    checkInt(val, 'I', bitSize, min, max)
}


export function checkSignedBigInt(val: unknown, bitSize: number): asserts val is bigint {
    let min: bigint
    let max: bigint
    switch(bitSize) {
        case 64:
            min = -(2n ** 63n)
            max = 2n ** 63n - 1n
            break
        case 128:
            min = -(2n ** 127n)
            max = 2n ** 127n - 1n
            break
        case 256:
            min = -(2n ** 255n)
            max = 2n ** 255n - 1n
            break
        default:
            throwUnexpectedCase(bitSize)
    }
    checkBigInt(val, 'I', bitSize, min, max)
}


export function checkUnsignedInt(val: unknown, bitSize: number): asserts val is number {
    let max: number
    switch(bitSize) {
        case 8:
            max = 0xff
            break
        case 16:
            max = 0xffff
            break
        case 32:
            max = 0xffffffff
            break
        default:
            throwUnexpectedCase(bitSize)
    }
    checkInt(val, 'U', bitSize, 0, max)
}


export function checkUnsignedBigInt(val: unknown, bitSize: number): asserts val is bigint {
    let max: bigint
    switch(bitSize) {
        case 64:
            max = 0xffffffffffffffffn
            break
        case 128:
            max = 2n ** 128n - 1n
            break
        case 256:
            max = 2n ** 256n - 1n
            break
        default:
            throwUnexpectedCase(bitSize)
    }
    checkBigInt(val, 'U', bitSize, 0n, max)
}


export function toSignedBigInt(val: unknown, bitSize: number): bigint {
    assert(typeof val == 'string' || typeof val == 'number')
    val = BigInt(val)
    checkSignedBigInt(val, bitSize)
    return val
}


export function toUnsignedBigInt(val: unknown, bitSize: number): bigint {
    assert(typeof val == 'string' || typeof val == 'number')
    val = BigInt(val)
    checkUnsignedBigInt(val, bitSize)
    return val
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


export function isObject(value: unknown): boolean {
    return value != null && typeof value == 'object'
}
