import assert from 'node:assert'
import {isHex} from '@subsquid/util-internal-hex'
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

const HEX_BYTE = 2
const WORD_HEX = WORD_SIZE * HEX_BYTE

const CODE_0 = 48 // '0'
const CODE_A_UPPER = 65 // 'A'
const CODE_F_UPPER = 70 // 'F'

// Precomputed ASCII codes for hex nibbles 0–15 ('0'–'9', 'a'–'f').
const NIBBLE_CODE = new Uint8Array(16)
for (let i = 0; i < 10; i++) NIBBLE_CODE[i] = 48 + i
for (let i = 10; i < 16; i++) NIBBLE_CODE[i] = 87 + i

// At or above this many input bytes the native Buffer.toString('hex') path
// is cheaper than a per-byte JS loop.
const BUFFER_HEX_CUTOFF = 64

export class HexSink implements Sink {
    private pos = 0
    private buf: Buffer
    private stack: {start: number; jumpBackPtr: number; size: number; countWord: boolean}[] = []

    constructor(fields: number, capacity = Math.max(fields * WORD_SIZE, 1280)) {
        this.buf = Buffer.alloc(capacity * HEX_BYTE, CODE_0)
        this.stack.push({
            start: 0,
            jumpBackPtr: 0,
            size: fields * WORD_SIZE,
            countWord: false,
        })
    }

    result(): string {
        assert(this.stack.length === 1, 'Cannot get result during dynamic encoding')
        const chars = this.size() * HEX_BYTE
        return `0x${this.buf.toString('latin1', 0, chars)}`
    }

    toString(): string {
        return this.result()
    }

    reserve(additional: number): void {
        const needed = (this.pos + additional) * HEX_BYTE
        if (this.buf.length < needed) {
            this.#allocate(needed)
        }
    }

    size() {
        return this.stack[this.stack.length - 1].size
    }

    #allocate(cap: number): void {
        cap = Math.max(cap, this.buf.length * 2)
        const grown = Buffer.alloc(cap, CODE_0)
        grown.set(this.buf)
        this.buf = grown
    }

    // Right-align `hex` in a 32-byte ABI word at the current position.
    // Left padding is implicit because buf is pre-filled with '0'.
    #writeWordRight(hex: string): void {
        assert(hex.length <= WORD_HEX, `hex string too long for one word: ${hex.length} chars`)
        const buf = this.buf
        const start = this.pos * HEX_BYTE + WORD_HEX - hex.length
        for (let i = 0; i < hex.length; i++) {
            buf[start + i] = hex.charCodeAt(i)
        }
        this.pos += WORD_SIZE
    }

    // Copy `len` hex chars from `hex` starting at `srcStart` into buf at
    // `dstStart`, lowercasing any A–F so output is canonical lowercase.
    #copyHexLower(hex: string, srcStart: number, dstStart: number, len: number): void {
        const buf = this.buf
        for (let i = 0; i < len; i++) {
            const c = hex.charCodeAt(srcStart + i)
            buf[dstStart + i] = c >= CODE_A_UPPER && c <= CODE_F_UPPER ? c + 32 : c
        }
    }

    // Encode binary `src` bytes as hex ASCII codes directly into buf at
    // `dstStart` using the NIBBLE_CODE lookup table.
    #encodeBytes(src: Uint8Array, srcLen: number, dstStart: number): void {
        const buf = this.buf
        for (let i = 0; i < srcLen; i++) {
            const b = src[i]
            buf[dstStart + i * 2] = NIBBLE_CODE[b >> 4]
            buf[dstStart + i * 2 + 1] = NIBBLE_CODE[b & 0xf]
        }
    }

    u8(val: number) {
        if (val < 0 || val > U8_MAX) this.#oob(val, 'uint8', 0, U8_MAX)
        this.reserve(WORD_SIZE)
        this.#writeWordRight(val.toString(16))
    }

    i8(val: number) {
        if (val < I8_MIN || val > I8_MAX) this.#oob(val, 'int8', I8_MIN, I8_MAX)
        this.#i256(BigInt(val))
    }

    u16(val: number) {
        if (val < 0 || val > U16_MAX) this.#oob(val, 'uint16', 0, U16_MAX)
        this.reserve(WORD_SIZE)
        this.#writeWordRight(val.toString(16))
    }

    i16(val: number) {
        if (val < I16_MIN || val > I16_MAX) this.#oob(val, 'int16', I16_MIN, I16_MAX)
        this.#i256(BigInt(val))
    }

    u32(val: number) {
        if (val < 0 || val > U32_MAX) this.#oob(val, 'uint32', 0, U32_MAX)
        this.reserve(WORD_SIZE)
        this.#writeWordRight(val.toString(16))
    }

    #u32Raw(val: number) {
        this.#writeWordRight(val.toString(16))
    }

    i32(val: number) {
        if (val < I32_MIN || val > I32_MAX) this.#oob(val, 'int32', I32_MIN, I32_MAX)
        this.#i256(BigInt(val))
    }

    u64(val: bigint) {
        if (val < 0n || val > U64_MAX_BI) this.#oob(val, 'uint64', 0n, U64_MAX_BI)
        this.reserve(WORD_SIZE)
        this.#writeWordRight(val.toString(16))
    }

    i64(val: bigint) {
        if (val < I64_MIN_BI || val > I64_MAX_BI) this.#oob(val, 'int64', I64_MIN_BI, I64_MAX_BI)
        this.#i256(val)
    }

    u128(val: bigint) {
        if (val < 0n || val > U128_MAX_BI) this.#oob(val, 'uint128', 0n, U128_MAX_BI)
        this.reserve(WORD_SIZE)
        this.#writeWordRight(val.toString(16))
    }

    i128(val: bigint) {
        if (val < I128_MIN_BI || val > I128_MAX_BI) this.#oob(val, 'int128', I128_MIN_BI, I128_MAX_BI)
        this.#i256(val)
    }

    u256(val: bigint) {
        if (val < 0n || val > U256_MAX_BI) this.#oob(val, 'uint256', 0n, U256_MAX_BI)
        this.reserve(WORD_SIZE)
        this.#writeWordRight(val.toString(16))
    }

    i256(val: bigint) {
        if (val < I256_MIN_BI || val > I256_MAX_BI) this.#oob(val, 'int256', I256_MIN_BI, I256_MAX_BI)
        this.#i256(val)
    }

    #i256(val: bigint) {
        const uval = val >= 0n ? val : val + U256_BASE
        this.reserve(WORD_SIZE)
        this.#writeWordRight(uval.toString(16))
    }

    bytes(val: Uint8Array | string) {
        if (typeof val === 'string') {
            if (!isHex(val)) {
                throw new Error(`Expected hex string or Uint8Array, got: ${val}`)
            }
            const nibbles = val.length - 2
            const size = nibbles >> 1
            this.u32(size)
            const wordsCount = (size + WORD_SIZE - 1) >> 5
            const reservedSize = wordsCount << 5
            this.reserve(reservedSize)
            const dst = this.pos * HEX_BYTE
            if (nibbles >= BUFFER_HEX_CUTOFF * HEX_BYTE) {
                this.buf.write(val.slice(2).toLowerCase(), dst, nibbles, 'latin1')
            } else {
                this.#copyHexLower(val, 2, dst, nibbles)
            }
            this.pos += reservedSize
            this.#increaseCurrentDataAreaSize(reservedSize + WORD_SIZE)
        } else {
            const size = val.length
            this.u32(size)
            const wordsCount = (size + WORD_SIZE - 1) >> 5
            const reservedSize = wordsCount << 5
            this.reserve(reservedSize)
            const dst = this.pos * HEX_BYTE
            if (size >= BUFFER_HEX_CUTOFF) {
                const hex = Buffer.from(val.buffer, val.byteOffset, size).toString('hex')
                this.buf.write(hex, dst, hex.length, 'latin1')
            } else {
                this.#encodeBytes(val, size, dst)
            }
            this.pos += reservedSize
            this.#increaseCurrentDataAreaSize(reservedSize + WORD_SIZE)
        }
    }

    staticBytes(len: number, val: Uint8Array | string) {
        if (len > 32) {
            throw new Error(`bytes${len} is not a valid type`)
        }
        this.reserve(WORD_SIZE)
        if (typeof val === 'string') {
            if (!isHex(val)) {
                throw new Error(`Expected hex string or Uint8Array, got: ${val}`)
            }
            const nibbles = val.length - 2
            if (nibbles > len * HEX_BYTE) {
                throw new Error(`invalid data size for bytes${len}`)
            }
            this.#copyHexLower(val, 2, this.pos * HEX_BYTE, nibbles)
            this.pos += WORD_SIZE
        } else {
            if (val.length > len) {
                throw new Error(`invalid data size for bytes${len}`)
            }
            this.#encodeBytes(val, val.length, this.pos * HEX_BYTE)
            this.pos += WORD_SIZE
        }
    }

    address(val: string) {
        if (val.length === 42 && val.charCodeAt(0) === 0x30 && val.charCodeAt(1) === 0x78) {
            this.reserve(WORD_SIZE)
            // 20-byte address right-aligned in a 32-byte word: skip 12 zero bytes (24 hex chars) of padding
            this.#copyHexLower(val, 2, this.pos * HEX_BYTE + 24, 40)
            this.pos += WORD_SIZE
            return
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
