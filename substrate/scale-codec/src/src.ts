import {decodeHex} from '@subsquid/util-internal-hex'
import assert from 'assert'

import {Bytes} from './types'
import {UTF8_DECODER} from './util'


export class Src {
    private idx = 0
    private buf: Uint8Array

    constructor(buf: Uint8Array | Bytes) {
        if (typeof buf == 'string') {
            this.buf = decodeHex(buf)
        } else {
            this.buf = buf
        }
    }

    private byte(): number {
        let b = this.buf[this.idx]
        if (b === undefined) {
            throw eof()
        }
        this.idx += 1
        return b
    }

    i8(): number {
        let b = this.byte()
        return b | (b & 2 ** 7) * 0x1fffffe
    }

    u8(): number {
        return this.byte()
    }

    i16(): number {
        let val = this.u16()
        return val | (val & 2 ** 15) * 0x1fffe
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

    compact(): number | bigint {
        let b = this.byte()
        let mode = b & 3
        switch(mode) {
            case 0:
                return b >> 2
            case 1:
                return (b >> 2) + this.byte() * 2 ** 6
            case 2:
                return (b >> 2) + this.byte() * 2 ** 6 + this.byte() * 2 ** 14 + this.byte() * 2 ** 22
            case 3:
                return this.bigCompact(b >> 2)
            default:
                throw new Error('Reached unreachable statement')
        }
    }

    private bigCompact(len: number): bigint | number {
        let i = this.u32()
        switch(len) {
            case 0:
                return i
            case 1:
                return i + this.byte() * 2 ** 32
            case 2:
                return i + this.byte() * 2 ** 32 + this.byte() * 2 ** 40
        }
        let n = BigInt(i)
        let base = 32n
        while (len--) {
            n += BigInt(this.byte()) << base
            base += 8n
        }
        return n
    }

    compactLength(): number {
        let len = this.compact()
        assert(typeof len == 'number')
        return len
    }

    str(): string {
        let len = this.compactLength()
        let buf = this.bytes(len)
        return UTF8_DECODER.decode(buf)
    }

    bytes(len: number): Uint8Array {
        let beg = this.idx
        let end = this.idx += len
        if (this.buf.length < end) {
            throw eof()
        }
        return this.buf.subarray(beg, end)
    }

    skip(len: number): void {
        this.idx += len
    }

    bool(): boolean {
        return !!this.byte()
    }

    hasBytes(): boolean {
        return this.buf.length > this.idx
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
