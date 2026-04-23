import assert from 'node:assert'
import { WORD_SIZE } from './codec'
import { bytesToHexString, writeHexInto } from './hex'

// Reused across all `Sink`s. Safe because TextEncoder is stateless.
const TEXT_ENCODER = new TextEncoder()

// Pre-computed bigint constants hoisted to module scope so they are never
// re-allocated on the hot path.
const U64_MASK = 0xffffffffffffffffn
const U128_MASK = (1n << 128n) - 1n
const U256_BASE = 1n << 256n

// Range bounds for the int/uint writers. Numeric for the 32-bit-and-smaller
// range so that `val < MIN` / `val > MAX` cannot trigger a Number↔BigInt
// comparison on the hot path.
const U8_MAX = 255
const U16_MAX = 65535
const U32_MAX = 4294967295
const I8_MIN = -128
const I8_MAX = 127
const I16_MIN = -32768
const I16_MAX = 32767
const I32_MIN = -2147483648
const I32_MAX = 2147483647
const U64_MAX_BI = 18446744073709551615n
const I64_MIN_BI = -9223372036854775808n
const I64_MAX_BI = 9223372036854775807n
const U128_MAX_BI = 340282366920938463463374607431768211455n
const I128_MIN_BI = -170141183460469231731687303715884105728n
const I128_MAX_BI = 170141183460469231731687303715884105727n
const U256_MAX_BI =
  115792089237316195423570985008687907853269984665640564039457584007913129639935n
const I256_MIN_BI =
  -57896044618658097711785492504343953926634992332820282019728792003956564819968n
const I256_MAX_BI =
  57896044618658097711785492504343953926634992332820282019728792003956564819967n

export class Sink {
  private pos = 0
  private buf: Uint8Array
  private view: DataView
  private stack: { start: number; jumpBackPtr: number; size: number }[] = []
  constructor(fields: number, capacity: number = 1280) {
    this.stack.push({
      start: 0,
      jumpBackPtr: 0,
      size: fields * WORD_SIZE,
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
    return '0x' + bytesToHexString(this.buf, 0, size)
  }

  reserve(additional: number): void {
    if (this.buf.length - this.pos < additional) {
      this._allocate(this.pos + additional)
    }
  }

  size() {
    return this.stack[this.stack.length - 1].size
  }

  private _allocate(cap: number): void {
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

  /**
   * Unchecked fast path for internal writers that already validated the
   * value. Skips bounds + reserve-on-top — callers must have reserved.
   */
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

  #u64(val: bigint) {
    this.view.setBigUint64(this.pos, val, false)
    this.pos += 8
  }

  u128(val: bigint) {
    if (val < 0n || val > U128_MAX_BI) this.#oob(val, 'uint128', 0n, U128_MAX_BI)
    this.reserve(WORD_SIZE)
    this.pos += WORD_SIZE - 16
    this.#u64(val & U64_MASK)
    this.#u64(val >> 64n)
  }

  i128(val: bigint) {
    if (val < I128_MIN_BI || val > I128_MAX_BI) this.#oob(val, 'int128', I128_MIN_BI, I128_MAX_BI)
    this.#i256(val)
  }

  /**
   * Writes a 16-byte big-endian block at `this.pos`. Caller must have
   * already reserved enough space.
   */
  #u128Raw(val: bigint) {
    this.#u64(val >> 64n)
    this.#u64(val & U64_MASK)
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

  bytes(val: Uint8Array) {
    const size = val.length
    this.u32(size)
    const wordsCount = Math.ceil(size / WORD_SIZE)
    const reservedSize = WORD_SIZE * wordsCount
    this.reserve(reservedSize)
    this.buf.set(val, this.pos)
    this.pos += reservedSize
    this.increaseCurrentDataAreaSize(reservedSize + WORD_SIZE)
  }

  staticBytes(len: number, val: Uint8Array) {
    if (len > 32) {
      throw new Error(`bytes${len} is not a valid type`)
    }
    if (val.length > len) {
      throw new Error(`invalid data size for bytes${len}`)
    }
    this.reserve(WORD_SIZE)
    this.buf.set(val, this.pos)
    this.pos += WORD_SIZE
  }

  /**
   * Write a 20-byte Ethereum address into the next word. For the common
   * case of a well-formed `0x`-prefixed 40-char hex string we decode the
   * hex directly into the target bytes; otherwise fall back to the BigInt
   * path (handles short strings, uppercase `0X`, etc).
   */
  address(val: string) {
    if (val.length === 42 && val.charCodeAt(0) === 0x30 && val.charCodeAt(1) === 0x78) {
      this.reserve(WORD_SIZE)
      // 12-byte zero prefix of the slot
      this.buf.fill(0, this.pos, this.pos + 12)
      if (writeHexInto(val, 2, 20, this.buf, this.pos + 12)) {
        this.pos += WORD_SIZE
        return
      }
    }
    this.u256(BigInt(val))
  }

  string(val: string) {
    const encoded = TEXT_ENCODER.encode(val)
    const size = encoded.length
    this.u32(size)
    const reservedSize = Math.ceil(size / WORD_SIZE) * WORD_SIZE
    this.reserve(reservedSize)
    this.buf.set(encoded, this.pos)
    this.pos += reservedSize
    this.increaseCurrentDataAreaSize(reservedSize + WORD_SIZE)
  }

  bool(val: boolean) {
    this.u8(val ? 1 : 0)
  }

  #oob(val: bigint | number, typeName: string, min: bigint | number, max: bigint | number): never {
    throw new Error(`${val} is out of bounds for ${typeName}[${min}, ${max}]`)
  }

  /**
   * @example
   * @link [Solidity docs](https://docs.soliditylang.org/en/latest/abi-spec.html#use-of-dynamic-types)
   */
  newStaticDataArea(slotsCount = 0) {
    const offset = this.size()
    this.reserve(WORD_SIZE)
    this.#u32Raw(offset)
    const dataAreaStart = this.currentDataAreaStart()
    this.pushDataArea(dataAreaStart + offset, slotsCount)
    this.pos = dataAreaStart + offset
  }

  newDynamicDataArea(slotsCount: number) {
    const offset = this.size()
    this.reserve(WORD_SIZE)
    this.#u32Raw(offset)
    const dataAreaStart = this.currentDataAreaStart()
    this.pushDataArea(dataAreaStart + offset + WORD_SIZE, slotsCount)
    this.pos = dataAreaStart + offset
    this.reserve(WORD_SIZE)
    this.#u32Raw(slotsCount)
  }

  private currentDataAreaStart() {
    return this.stack[this.stack.length - 1].start
  }

  public increaseCurrentDataAreaSize(amount: number) {
    this.stack[this.stack.length - 1].size += amount
  }

  private pushDataArea(dataAreaStart: number, slotsCount: number) {
    const size = slotsCount * WORD_SIZE
    this.reserve(dataAreaStart + size)
    this.stack.push({
      start: dataAreaStart,
      jumpBackPtr: this.pos,
      size,
    })
  }

  public endCurrentDataArea() {
    assert(this.stack.length > 1, 'No dynamic encoding started')
    const { jumpBackPtr, size } = this.stack.pop()!
    this.increaseCurrentDataAreaSize(size)
    this.pos = jumpBackPtr
  }
}
