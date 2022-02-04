import {Primitive} from "@subsquid/scale-codec"
import {throwUnexpectedCase} from "@subsquid/scale-codec/lib/util"
import * as ss58 from "@subsquid/ss58-codec"
import assert from "assert"


export function decodeCompact(integer: Primitive, value: unknown): number | bigint {
    let n = decodePrimitive(integer, value)
    switch(typeof n) {
        case 'number':
            return n
        case 'bigint':
            if (n < 2n ** 48n) {
                return Number(n)
            } else {
                return n
            }
        default:
            throwUnexpectedCase()
    }
}


export function decodePrimitive(type: Primitive, value: unknown): string | boolean | number | bigint {
    switch(type) {
        case "I8":
            return toInt(8, value)
        case "I16":
            return toInt(16, value)
        case "I32":
            return toInt(32, value)
        case "I64":
            return toBigInt(64n, value)
        case "I128":
            return toBigInt(128n, value)
        case "I256":
            return toBigInt(256n, value)
        case "U8":
            return toUnsignedInt(8, value)
        case "U16":
            return toUnsignedInt(16, value)
        case "U32":
            return toUnsignedInt(32, value)
        case "U64":
            return toBigUnsignedInt(64n, value)
        case "U128":
            return toBigUnsignedInt(128n, value)
        case "U256":
            return toBigUnsignedInt(256n, value)
        case "Bool":
            assert(typeof value == "boolean")
            return value
        case "Str":
            assert(typeof value == "string")
            return value
        default:
            throwUnexpectedCase(type)
    }
}


function toUnsignedInt(len: number, val: unknown): number {
    let n: number
    switch(typeof val) {
        case "number":
            n = val
            break
        case "string":
            if (val == '0x') return 0
            if (/^0x[a-fA-F0-9]+$/.test(val)) {
                n = Number(val)
            } else if (len == 32) {
                n = decodeGenericAccountIndex(val)
            } else {
                throw new Error(`Invalid U${len}: "${val}"`)
            }
            break
        default:
            throw new Error(`Invalid U${len}: ${val}`)
    }
    assert(Number.isSafeInteger(n) && n >= 0 && n < (2 ** len))
    return n
}


function decodeGenericAccountIndex(s: string): number {
    let bytes = ss58.decode(s).bytes
    assert(bytes.length <= 4)
    let val = 0
    for (let i = 0; i < bytes.length; i++) {
        val += bytes[i] * (2 ** (8 * i))
    }
    return val
}


function toBigUnsignedInt(len: bigint, val: unknown): bigint {
    let n: bigint
    switch(typeof val) {
        case "number":
            assert(Number.isInteger(val))
            n = BigInt(val)
            break
        case "string":
            if (val == '0x') return 0n
            if (/^\d+$/.test(val) || /^0x[a-fA-F0-9]+$/.test(val)) {
                n = BigInt(val)
            } else {
                throw new Error(`Invalid U${len}: "${val}"`)
            }
            break
        default:
            throw new Error(`Invalid U${len}: ${val}`)
    }
    assert(n >= 0n && n < (2n ** len))
    return n
}


function toInt(len: number, val: unknown): number {
    let n: number
    switch(typeof val) {
        case 'number':
            n = val
            break
        case 'string':
            if (val == '0x') {
                n = 0
            } else if (/^0x[a-fA-F0-9]+$/.test(val)) {
                let unsigned = Number(val)
                let base = 2 ** len
                let mask = 2 ** (len - 1)
                let sign = (mask & unsigned) >> (len - 1)
                n = unsigned - sign * base
            } else {
                throw new Error(`Invalid I${len}: "${val}"`)
            }
            break
        default:
            throw new Error(`Invalid I${len}: "${val}"`)
    }
    assert(Number.isSafeInteger(n) && Math.abs(n) < 2 ** (len - 1))
    return n
}


function toBigInt(len: bigint, val: unknown): bigint {
    let n: bigint
    switch(typeof val) {
        case 'number':
            assert(Number.isInteger(val))
            n = BigInt(val)
            break
        case 'string':
            if (val == '0x') {
                n = 0n
            } else if (/^-?\d+$/.test(val)) {
                n = BigInt(val)
            } else if (/^0x[a-fA-F0-9]+$/.test(val)) {
                let unsigned = BigInt(val)
                let base = 2n ** len
                let mask = 2n ** (len - 1n)
                let sign = (mask & unsigned) >> (len - 1n)
                n = unsigned - sign * base
            } else {
                throw new Error(`Invalid I${len}: "${val}"`)
            }
            break
        default:
            throw new Error(`Invalid I${len}: "${val}"`)
    }
    let abs = n < 0n ? -1n * n : n
    assert(abs < 2n ** (len - 1n))
    return n
}


export function isHex(value: unknown): value is string {
    return typeof value == 'string' && /^0x([a-fA-F0-9]{2})+$/.test(value)
}


export function decodeHex(value: unknown): Buffer {
    assert(typeof value == "string")
    assert(isHex(value))
    return Buffer.from(value.slice(2), "hex")
}


export function decodeBinaryArray(len: number, value: unknown): Uint8Array {
    assert(typeof value == "string")
    if (isHex(value)) {
        assert(value.length - 2 == len * 2)
        return Buffer.from(value.slice(2), "hex")
    } else {
        let bytes = ss58.decode(value).bytes
        assert(bytes.length == len, "unexpected address length")
        return bytes
    }
}


export function encodeUnsignedInt(byteLength: number, n: bigint): Uint8Array {
    let buf = Buffer.alloc(byteLength, 0)
    let pos = 0
    while (n > 0n) {
        assert(pos < byteLength)
        buf[pos] = Number(n & 0b11111111n)
        n = n >> 8n
        pos += 1
    }
    return buf
}
