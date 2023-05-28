import assert from 'assert'
import {
    UTF8_ENCODER,
    checkSignedBigInt,
    checkSignedInt,
    checkUnsignedBigInt,
    checkUnsignedInt,
    unsignedIntByteLength,
} from './util'
import {decodeHex} from '@subsquid/util-internal-hex'

export abstract class Sink {
    protected abstract write(byte: number): void

    abstract bytes(b: Uint8Array, width?: number): void

    private uncheckedU16(val: number): void {
        this.write(val & 0xff)
        this.write(val >>> 8)
    }

    private uncheckedU32(val: number): void {
        this.write(val & 0xff)
        this.write((val >>> 8) & 0xff)
        this.write((val >>> 16) & 0xff)
        this.write(val >>> 24)
    }

    private uncheckedU64(val: bigint): void {
        this.uncheckedU32(Number(val & 0xffffffffn))
        this.uncheckedU32(Number(val >> 32n))
    }

    private uncheckedU128(val: bigint): void {
        this.uncheckedU64(val & 0xffffffffffffffffn)
        this.uncheckedU64(val >> 64n)
    }

    private uncheckedU256(val: bigint): void {
        this.uncheckedU128(val & (2n ** 128n - 1n))
        this.uncheckedU128(val >> 128n)
    }

    u8(val: number): void {
        checkUnsignedInt(val, 8)
        this.write(val)
    }

    u16(val: number): void {
        checkUnsignedInt(val, 16)
        this.uncheckedU16(val)
    }

    u32(val: number): void {
        checkUnsignedInt(val, 32)
        this.uncheckedU32(val)
    }

    u64(val: bigint): void {
        checkUnsignedBigInt(val, 64)
        this.uncheckedU64(val)
    }

    u128(val: bigint): void {
        checkUnsignedBigInt(val, 128)
        this.uncheckedU128(val)
    }

    u256(val: bigint): void {
        checkUnsignedBigInt(val, 256)
        this.uncheckedU256(val)
    }

    i8(val: number): void {
        checkSignedInt(val, 8)
        this.write((val + 256) % 256)
    }

    i16(val: number): void {
        checkSignedInt(val, 16)
        let base = 2 ** 16
        val = (val + base) % base
        this.uncheckedU16(val)
    }

    i32(val: number): void {
        checkSignedInt(val, 32)
        let base = 2 ** 32
        val = (val + base) % base
        this.uncheckedU32(val)
    }

    i64(val: bigint): void {
        checkSignedBigInt(val, 64)
        let base = 2n ** 64n
        val = (val + base) % base
        this.uncheckedU64(val)
    }

    i128(val: bigint): void {
        checkSignedBigInt(val, 128)
        let base = 2n ** 128n
        val = (val + base) % base
        this.uncheckedU128(val)
    }

    i256(val: bigint): void {
        checkSignedBigInt(val, 256)
        let base = 2n ** 256n
        val = (val + base) % base
        this.uncheckedU256(val)
    }

    address(val: string): void {
        let bytes = decodeHex(val)
        this.bytes(bytes)
    }

    bool(val: boolean): void {
        assert(typeof val == 'boolean')
        this.write(Number(val))
    }

    str(val: string): void {
        assert(typeof val == 'string')
        let bytes = UTF8_ENCODER.encode(val)
        this.bytes(bytes)
    }
}

export class HexSink extends Sink {
    private hex = ''

    get length() {
        return this.hex.length / 2
    }

    protected write(byte: number): void {
        this.hex = (byte & 15).toString(16) + this.hex
        this.hex = (byte >>> 4).toString(16) + this.hex
    }

    bytes(b: Uint8Array, width = 0): void {
        if (Buffer.isBuffer(b)) {
            this.hex = b.toString('hex').padEnd(width * 2, '0') + this.hex
        } else {
            this.hex =
                Buffer.from(b.buffer, b.byteOffset, b.byteLength)
                    .toString('hex')
                    .padEnd(width * 2, '0') + this.hex
        }
    }

    toHex(): string {
        return '0x' + this.hex
    }
}

export class ByteSink extends Sink {
    private buf = Buffer.allocUnsafe(128)
    private pos = 0

    get length() {
        return this.pos
    }

    private alloc(size: number): void {
        if (this.buf.length - this.pos < size) {
            let buf = Buffer.allocUnsafe(Math.max(size, this.buf.length) * 2)
            buf.set(this.buf, buf.length - this.pos - 1)
            this.buf = buf
        }
    }

    protected write(byte: number): void {
        this.alloc(1)
        this.buf[this.buf.length - this.pos - 1] = byte
        this.pos += 1
    }

    bytes(b: Uint8Array, width = 0): void {
        let len = Math.max(b.length, width)
        this.alloc(len)
        this.buf.set(b, this.buf.length - this.pos - len)
        this.pos += len
    }

    toBytes(): Uint8Array {
        return this.buf.subarray(this.buf.length - this.pos)
    }
}
