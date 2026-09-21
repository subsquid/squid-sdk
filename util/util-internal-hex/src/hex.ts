import assert from "assert"


export function toHex(data: Uint8Array, offset = 0, size = data.length - offset): string {
    return `0x${Buffer.from(data.buffer, data.byteOffset + offset, size).toString('hex')}`
}


export function isHex(value: unknown): value is string {
    return typeof value == 'string' && value.length % 2 == 0 && /^0x[a-f\d]*$/i.test(value)
}


export function decodeHex(value: string): Buffer {
    assert(isHex(value))
    return Buffer.from(value.slice(2), 'hex')
}
