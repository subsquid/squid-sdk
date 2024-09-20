import assert from 'assert'
import base58 from 'bs58'
import {Base58Bytes} from './type-util'


export class Sink {
    private pos = 0
    private buf: Buffer
    private view: DataView

    // Small default initial capacity for a client side,
    // but a maximum of what we can pass to Solana
    constructor(capacity: number = 1280) {
        this.buf = Buffer.alloc(capacity)
        this.view = new DataView(this.buf.buffer, this.buf.byteOffset, this.buf.byteLength)
    }

    result(): Uint8Array {
        return this.buf.subarray(0, this.pos)
    }

    reserve(additional: number): void {
        if (this.buf.length - this.pos < additional) {
            this._allocate(this.pos + additional)
        }
    }

    private _allocate(cap: number): void {
        cap = Math.max(cap, this.buf.length * 2)
        let buf = Buffer.alloc(cap)
        buf.set(this.buf)
        this.buf = buf
        this.view = new DataView(this.buf.buffer, this.buf.byteOffset, this.buf.byteLength)
    }

    u8(val: number): void {
        this.reserve(1)
        this.view.setUint8(this.pos, val)
        this.pos += 1
    }

    i8(val: number): void {
        this.reserve(1)
        this.view.setInt8(this.pos, val)
        this.pos += 1
    }

    u16(val: number): void {
        this.reserve(2)
        this.view.setUint16(this.pos, val, true)
        this.pos += 2
    }

    i16(val: number): void {
        this.reserve(2)
        this.view.setInt16(this.pos, val, true)
        this.pos += 2
    }

    u32(val: number): void {
        this.reserve(4)
        this.view.setUint32(this.pos, val, true)
        this.pos += 4
    }

    i32(val: number): void {
        this.reserve(4)
        this.view.setInt32(this.pos, val, true)
        this.pos += 4
    }

    u64(val: bigint): void {
        this.reserve(8)
        this.view.setBigUint64(this.pos, val, true)
        this.pos += 8
    }

    i64(val: bigint): void {
        this.reserve(8)
        this.view.setBigInt64(this.pos, val, true)
        this.pos += 8
    }

    u128(val: bigint): void {
        this.u64(val & 0xffffffffffffffffn)
        this.u64(val >> 64n)
    }

    i128(val: bigint): void {
        let base = 2n ** 128n
        val = (val + base) % base
        this.u128(val)
    }

    f32(val: number): void {
        this.reserve(4)
        this.view.setFloat32(this.pos, val)
        this.pos += 4
    }

    f64(val: number): void {
        this.reserve(8)
        this.view.setFloat64(this.pos, val)
        this.pos += 8
    }

    bytes(val: Uint8Array): void {
        this.reserve(val.length)
        this.buf.set(val, this.pos)
        this.pos += val.length
    }

    base58(val: Base58Bytes): void {
        this.bytes(base58.decode(val))
    }

    string(val: string): void {
        let size = Buffer.byteLength(val)
        this.u32(size)
        this.reserve(size)
        let written = this.buf.write(val, this.pos)
        assert(written === size)
        this.pos += size
    }

    bool(val: boolean): void {
        this.u8(val ? 1 : 0)
    }
}
