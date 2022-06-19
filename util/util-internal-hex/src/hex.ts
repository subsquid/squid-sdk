import assert from "assert"


export function toHex(data: Uint8Array): string {
    if (Buffer.isBuffer(data)) {
        return '0x' + data.toString('hex')
    } else {
        return '0x' + Buffer.from(data.buffer, data.byteOffset, data.byteLength).toString('hex')
    }
}


export function isHex(value: unknown): value is string {
    return typeof value == 'string' && value.length % 2 == 0 && /^0x[a-f\d]*$/i.test(value)
}


export function decodeHex(value: string): Buffer {
    assert(isHex(value))
    return Buffer.from(value.slice(2), 'hex')
}
