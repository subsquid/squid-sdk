import assert from 'node:assert'
import {decodeHex, isHex, toHex} from '@subsquid/util-internal-hex'
import {WORD_SIZE, type Sink} from '../codec'
import {
    TEXT_ENCODER,
    U256_BASE,
    U8_MAX, U16_MAX, U32_MAX,
    I8_MIN, I8_MAX, I16_MIN, I16_MAX, I32_MIN, I32_MAX,
    U64_MAX_BI, I64_MIN_BI, I64_MAX_BI,
    U128_MAX_BI, I128_MIN_BI, I128_MAX_BI,
    U256_MAX_BI, I256_MIN_BI, I256_MAX_BI,
} from './bounds'

const U64_MASK = 0xffffffffffffffffn
const U128_MASK = (1n << 128n) - 1n

export class BytesSink implements Sink {
    protected pos = 0
    protected buf: Uint8Array
    protected view: DataView
    private stack: {start: number; jumpBackPtr: number; size: number; countWord: boolean}[] = []

    constructor(fields: number, capacity = 1280) {
        this.stack.push({
            start: 0,
            jumpBackPtr: 0,
            size: fields * WORD_SIZE,
            countWord: false,
        })
        this.buf = new Uint8Array(capacity)
        this.view = new DataView(this.buf.buffer, this.buf.byteOffset, this.buf.byteLength)
    }

    result(): Uint8Array {
        assert(this.stack.length === 1, 'Cannot get result during dynamic encoding')
        return this.buf.subarray(0, this.size())
    }

    toString() {
        const size = this.size()
        return toHex(this.buf, 0, size)
    }

    reserve(additional: number): void {
        if (this.buf.length - this.pos < additional) {
            this.allocate(this.pos + additional)
        }
    }

    written(): Uint8Array {
        return this.buf.subarray(0, this.pos)
    }

    mark(): number {
        return this.pos
    }

    raw(val: Uint8Array | string): void {
        const bytes = typeof val === 'string' ? this.#stringToBytes(val) : val
        this.reserve(bytes.length)
        this.buf.set(bytes, this.pos)
        this.pos += bytes.length
    }

    utf8(val: string): void {
        this.raw(TEXT_ENCODER.encode(val))
    }

    padFrom(pos: number): void {
        const rem = (this.pos - pos) % WORD_SIZE
        if (rem === 0) return
        const pad = WORD_SIZE - rem
        this.reserve(pad)
        this.buf.fill(0, this.pos, this.pos + pad)
        this.pos += pad
    }

    size() {
        return this.stack[this.stack.length - 1].size
    }

    protected allocate(cap: number): void {
        cap = Math.max(cap, this.buf.length * 2)
        const buf = new Uint8Array(cap)
        buf.set(this.buf)
        this.buf = buf
        this.view = new DataView(this.buf.buffer, this.buf.byteOffset, this.buf.byteLength)
    }

    u8(val: number) {
        if (val < 0 || val > U8_MAX) this.#oob(val, 'uint8', 0, U8_MAX)
        this.reserve(WORD_SIZE)
        this.pos += WORD_SIZE - 1
        this.view.setUint8(this.pos, val)
        this.pos += 1
    }

    i8(val: number) {
        if (val < I8_MIN || val > I8_MAX) this.#oob(val, 'int8', I8_MIN, I8_MAX)
        this.#i256(BigInt(val))
    }

    u16(val: number) {
        if (val < 0 || val > U16_MAX) this.#oob(val, 'uint16', 0, U16_MAX)
        this.reserve(WORD_SIZE)
        this.pos += WORD_SIZE - 2
        this.view.setUint16(this.pos, val, false)
        this.pos += 2
    }

    i16(val: number) {
        if (val < I16_MIN || val > I16_MAX) this.#oob(val, 'int16', I16_MIN, I16_MAX)
        this.#i256(BigInt(val))
    }

    u32(val: number) {
        if (val < 0 || val > U32_MAX) this.#oob(val, 'uint32', 0, U32_MAX)
        this.reserve(WORD_SIZE)
        this.pos += WORD_SIZE - 4
        this.view.setUint32(this.pos, val, false)
        this.pos += 4
    }

    #u32Raw(val: number) {
        this.view.setUint32(this.pos + WORD_SIZE - 4, val, false)
        this.pos += WORD_SIZE
    }

    i32(val: number) {
        if (val < I32_MIN || val > I32_MAX) this.#oob(val, 'int32', I32_MIN, I32_MAX)
        this.#i256(BigInt(val))
    }

    u64(val: bigint) {
        if (val < 0n || val > U64_MAX_BI) this.#oob(val, 'uint64', 0n, U64_MAX_BI)
        this.reserve(WORD_SIZE)
        this.pos += WORD_SIZE - 8
        this.view.setBigUint64(this.pos, val, false)
        this.pos += 8
    }

    i64(val: bigint) {
        if (val < I64_MIN_BI || val > I64_MAX_BI) this.#oob(val, 'int64', I64_MIN_BI, I64_MAX_BI)
        this.#i256(val)
    }

    private writeU64(val: bigint) {
        this.view.setBigUint64(this.pos, val, false)
        this.pos += 8
    }

    u128(val: bigint) {
        if (val < 0n || val > U128_MAX_BI) this.#oob(val, 'uint128', 0n, U128_MAX_BI)
        this.reserve(WORD_SIZE)
        this.pos += WORD_SIZE - 16
        this.writeU64(val >> 64n)
        this.writeU64(val & U64_MASK)
    }

    i128(val: bigint) {
        if (val < I128_MIN_BI || val > I128_MAX_BI) this.#oob(val, 'int128', I128_MIN_BI, I128_MAX_BI)
        this.#i256(val)
    }

    #u128Raw(val: bigint) {
        this.writeU64(val >> 64n)
        this.writeU64(val & U64_MASK)
    }

    u256(val: bigint) {
        if (val < 0n || val > U256_MAX_BI) this.#oob(val, 'uint256', 0n, U256_MAX_BI)
        this.reserve(WORD_SIZE)
        this.#u128Raw(val >> 128n)
        this.#u128Raw(val & U128_MASK)
    }

    i256(val: bigint) {
        if (val < I256_MIN_BI || val > I256_MAX_BI) this.#oob(val, 'int256', I256_MIN_BI, I256_MAX_BI)
        this.#i256(val)
    }

    #i256(val: bigint) {
        const uval = val >= 0n ? val : val + U256_BASE
        this.reserve(WORD_SIZE)
        this.#u128Raw(uval >> 128n)
        this.#u128Raw(uval & U128_MASK)
    }

    bytes(val: Uint8Array | string) {
        const bytes = typeof val === 'string' ? this.#stringToBytes(val) : val
        const size = bytes.length
        this.u32(size)
        const reservedSize = Math.ceil(size / WORD_SIZE) * WORD_SIZE
        this.reserve(reservedSize)
        this.buf.set(bytes, this.pos)
        this.pos += reservedSize
        this.#increaseCurrentDataAreaSize(reservedSize + WORD_SIZE)
    }

    staticBytes(len: number, val: Uint8Array | string) {
        if (len > 32) {
            throw new Error(`bytes${len} is not a valid type`)
        }
        const bytes = typeof val === 'string' ? this.#stringToBytes(val) : val
        if (bytes.length > len) {
            throw new Error(`invalid data size for bytes${len}`)
        }
        this.reserve(WORD_SIZE)
        this.buf.set(bytes, this.pos)
        this.pos += WORD_SIZE
    }

    #stringToBytes(val: string): Uint8Array {
        if (!isHex(val)) {
            throw new Error(`Expected hex string or Uint8Array, got: ${val}`)
        }
        return decodeHex(val)
    }

    address(val: string) {
        if (val.length === 42 && val.charCodeAt(0) === 0x30 && val.charCodeAt(1) === 0x78) {
            this.reserve(WORD_SIZE)
            this.buf.fill(0, this.pos, this.pos + 12)
            const view = Buffer.from(this.buf.buffer, this.buf.byteOffset + this.pos + 12, 20)
            if (view.write(val.slice(2), 'hex') === 20) {
                this.pos += WORD_SIZE
                return
            }
        }
        this.u256(BigInt(val))
    }

    string(val: string) {
        this.bytes(TEXT_ENCODER.encode(val))
    }

    bool(val: boolean) {
        this.u8(val ? 1 : 0)
    }

    #oob(val: bigint | number, typeName: string, min: bigint | number, max: bigint | number): never {
        throw new Error(`${val} is out of bounds for ${typeName}[${min}, ${max}]`)
    }

    openTail(slotsCount = 0) {
        const offset = this.size()
        this.reserve(WORD_SIZE)
        this.#u32Raw(offset)
        const dataAreaStart = this.#currentDataAreaStart()
        this.#pushDataArea(dataAreaStart + offset, slotsCount, false)
        this.pos = dataAreaStart + offset
    }

    openArray(count: number) {
        const offset = this.size()
        this.reserve(WORD_SIZE)
        this.#u32Raw(offset)
        const dataAreaStart = this.#currentDataAreaStart()
        this.#pushDataArea(dataAreaStart + offset + WORD_SIZE, count, true)
        this.pos = dataAreaStart + offset
        this.reserve(WORD_SIZE)
        this.#u32Raw(count)
    }

    #currentDataAreaStart() {
        return this.stack[this.stack.length - 1].start
    }

    #increaseCurrentDataAreaSize(amount: number) {
        this.stack[this.stack.length - 1].size += amount
    }

    #pushDataArea(dataAreaStart: number, slotsCount: number, countWord: boolean) {
        const size = slotsCount * WORD_SIZE
        this.reserve(dataAreaStart + size)
        this.stack.push({
            start: dataAreaStart,
            jumpBackPtr: this.pos,
            size,
            countWord,
        })
    }

    closeTail() {
        assert(this.stack.length > 1, 'No dynamic encoding started')
        const {jumpBackPtr, size, countWord} = this.stack.pop()!
        this.#increaseCurrentDataAreaSize(size + (countWord ? WORD_SIZE : 0))
        this.pos = jumpBackPtr
    }
}
