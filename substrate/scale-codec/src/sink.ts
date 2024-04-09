import assert from 'assert'
import {
    checkSignedBigInt,
    checkSignedInt,
    checkUnsignedBigInt,
    checkUnsignedInt,
    unsignedIntByteLength,
    UTF8_ENCODER
} from './util'


export abstract class Sink {
    protected abstract write(byte: number): void

    abstract bytes(b: Uint8Array): void

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
        this.uncheckedU128(val & (2n ** 128n) - 1n)
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

    str(val: string): void {
        assert(typeof val == 'string')
        let bytes = UTF8_ENCODER.encode(val)
        this.compact(bytes.length)
        this.bytes(bytes)
    }

    bool(val: boolean): void {
        assert(typeof val == 'boolean')
        this.write(Number(val))
    }

    compact(val: number | bigint): void {
        assert((typeof val == 'number' || typeof val == 'bigint') && val >= 0, 'invalid compact')
        if (val < 64) {
            this.write(Number(val) * 4)
        } else if (val < 2 ** 14) {
            val = Number(val)
            this.write((val & 63) * 4 + 1)
            this.write(val >>> 6)
        } else if (val < 2 ** 30) {
            val = Number(val)
            this.write((val & 63) * 4 + 2)
            this.write((val >>> 6) & 0xff)
            this.uncheckedU16(val >>> 14)
        } else if (val < 2n ** 536n) {
            val = BigInt(val)
            this.write(unsignedIntByteLength(val) * 4 - 13)
            while (val > 0) {
                this.write(Number(val & 0xffn))
                val = val >> 8n
            }
        } else {
            throw new Error(`${val.toString(16)} is too large for a compact`)
        }
    }
}


export class HexSink extends Sink {
    private out = '0x'

    protected write(byte: number): void {
        this.out += (byte >>> 4).toString(16)
        this.out += (byte & 15).toString(16)
    }

    bytes(b: Uint8Array): void {
        if (Buffer.isBuffer(b)) {
            this.out += b.toString('hex')
        } else {
            this.out += Buffer.from(b.buffer, b.byteOffset, b.byteLength).toString('hex')
        }
    }

    toHex(): string {
        return this.out
    }
}


export class ByteSink extends Sink {
    private buf = Buffer.allocUnsafe(128)
    private pos = 0

    private alloc(size: number): void {
        if (this.buf.length - this.pos < size) {
            let buf = Buffer.allocUnsafe(Math.max(size, this.buf.length) * 2)
            buf.set(this.buf)
            this.buf = buf
        }
    }

    protected write(byte: number): void {
        this.alloc(1)
        this.buf[this.pos] = byte
        this.pos += 1
    }

    bytes(b: Uint8Array): void {
        this.alloc(b.length)
        this.buf.set(b, this.pos)
        this.pos += b.length
    }

    toBytes(): Uint8Array {
        return this.buf.subarray(0, this.pos)
    }
}
