import {decodeHex, toHex} from '@subsquid/util-internal-hex'
import assert from 'assert'
import {UTF8_DECODER} from './util'

export class Src {
    private idx = 0
    private buf: Uint8Array

    get length() {
        return this.buf.length
    }

    constructor(buf: Uint8Array | string) {
        if (typeof buf == 'string') {
            this.buf = decodeHex(buf)
        } else {
            this.buf = buf
        }
        this.idx = this.buf.length - 1
    }

    private byte(): number {
        let b = this.buf[this.idx]
        if (b === undefined) {
            throw eof()
        }
        this.idx -= 1
        return b
    }

    i8(): number {
        let b = this.byte()
        return b | ((b & (2 ** 7)) * 0x1fffffe)
    }

    u8(): number {
        return this.byte()
    }

    i16(): number {
        let val = this.u16()
        return val | ((val & (2 ** 15)) * 0x1fffe)
    }

    u16(): number {
        let first = this.byte()
        let last = this.byte()
        return first + last * 2 ** 8
    }

    i32(): number {
        return this.byte() + this.byte() * 2 ** 8 + this.byte() * 2 ** 16 + (this.byte() << 24)
    }

    u32(): number {
        return this.byte() + this.byte() * 2 ** 8 + this.byte() * 2 ** 16 + this.byte() * 2 ** 24
    }

    i64(): bigint {
        let lo = this.u32()
        let hi = this.i32()
        return BigInt(lo) + (BigInt(hi) << 32n)
    }

    u64(): bigint {
        let lo = this.u32()
        let hi = this.u32()
        return BigInt(lo) + (BigInt(hi) << 32n)
    }

    i128(): bigint {
        let lo = this.u64()
        let hi = this.i64()
        return lo + (hi << 64n)
    }

    u128(): bigint {
        let lo = this.u64()
        let hi = this.u64()
        return lo + (hi << 64n)
    }

    i256(): bigint {
        let lo = this.u128()
        let hi = this.i128()
        return lo + (hi << 128n)
    }

    u256(): bigint {
        let lo = this.u128()
        let hi = this.u128()
        return lo + (hi << 128n)
    }

    address(): string {
        let bytes = this.bytes(20)
        return toHex(bytes)
    }

    str(len: number): string {
        let buf = this.bytes(len)
        return UTF8_DECODER.decode(buf)
    }

    bytes(len: number): Uint8Array {
        let end = this.idx + 1
        let beg = end - len
        if (this.buf.length < end) {
            throw eof()
        }
        this.idx -= len
        return this.buf.subarray(beg, end)
    }

    skip(len: number): void {
        this.idx -= len
    }

    bool(): boolean {
        return !!this.byte()
    }

    hasBytes(): boolean {
        return this.idx > -1
    }

    assertEOF(): void {
        if (this.hasBytes()) {
            throw new Error('Unprocessed data left')
        }
    }
}

function eof(): Error {
    return new Error('Unexpected EOF')
}
