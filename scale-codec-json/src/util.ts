import {Primitive} from "@subsquid/scale-codec"
import {throwUnexpectedCase} from "@subsquid/scale-codec/lib/util"
import * as ss58 from "@subsquid/ss58-codec"
import assert from "assert"


export function decodePrimitive(type: Primitive, value: unknown): string | boolean | number | bigint {
    // TODO: more validation
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
            n = val == "0x" ? 0 : Number.parseInt(val)
            break
        default:
            throw new Error(`Invalid integer: ${val}`)
    }
    assert(Number.isSafeInteger(n) && n < (2 ** len))
    return n
}


function toBigUnsignedInt(len: bigint, val: unknown): bigint {
    let n: bigint
    switch(typeof val) {
        case "number":
            assert(Number.isInteger(val))
            n = BigInt(val)
            break
        case "string":
            n = (val == "0x") ? 0n : BigInt(val)
            break
        default:
            throw new Error(`Invalid integer: ${val}`)
    }
    assert(n < (2n ** len))
    return n
}


function toBigInt(len: bigint, val: unknown): bigint {
    let n = toBigUnsignedInt(len, val)
    let base = 2n ** len
    let mask = 2n ** (len - 1n)
    let sign = (mask & n) >> (len - 1n)
    return n - sign * base
}


function toInt(len: number, val: unknown): number {
    let n = toUnsignedInt(len, val)
    let base = 2 ** len
    let mask = 2 ** (len - 1)
    let sign = (mask & n) >> (len - 1)
    return n - sign * base
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
