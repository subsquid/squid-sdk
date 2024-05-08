import assert from 'node:assert'
import { WORD_SIZE } from './codec'

export class Sink {
  private pos = 0
  private buf: Buffer
  private view: DataView
  private stack: { start: number; jumpBackPtr: number; size: number }[] = []
  constructor(fields: number, capacity: number = 1280) {
    this.stack.push({
      start: 0,
      jumpBackPtr: 0,
      size: fields * WORD_SIZE,
    })
    this.buf = Buffer.alloc(capacity)
    this.view = new DataView(this.buf.buffer, this.buf.byteOffset, this.buf.byteLength)
  }

  result(): Buffer {
    assert(this.stack.length === 1, 'Cannot get result during dynamic encoding')
    return this.buf.subarray(0, this.size())
  }

  toString() {
    return '0x' + this.result().toString('hex')
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
    let buf = Buffer.alloc(cap)
    buf.set(this.buf)
    this.buf = buf
    this.view = new DataView(this.buf.buffer, this.buf.byteOffset, this.buf.byteLength)
  }

  private checkNumberBounds(val: bigint | number, min: bigint, max: bigint, typeName: string) {
    if (val < min || val > max) {
      throw new Error(`${val} is out of bounds for ${typeName}[${min}, ${max}]`)
    }
  }

  u8(val: number) {
    this.checkNumberBounds(val, 0n, 255n, 'uint8')
    this.reserve(WORD_SIZE)
    this.pos += WORD_SIZE - 1
    this.view.setUint8(this.pos, val)
    this.pos += 1
  }

  i8(val: number) {
    this.checkNumberBounds(val, -128n, 127n, 'int8')
    this.#i256(BigInt(val))
  }

  u16(val: number) {
    this.checkNumberBounds(val, 0n, 65535n, 'uint16')
    this.reserve(WORD_SIZE)
    this.pos += WORD_SIZE - 2
    this.view.setUint16(this.pos, val, false)
    this.pos += 2
  }

  i16(val: number) {
    this.checkNumberBounds(val, -32768n, 32767n, 'int16')
    this.#i256(BigInt(val))
  }

  u32(val: number) {
    this.checkNumberBounds(val, 0n, 4294967295n, 'uint32')
    this.reserve(WORD_SIZE)
    this.pos += WORD_SIZE - 4
    this.view.setUint32(this.pos, val, false)
    this.pos += 4
  }

  i32(val: number) {
    this.checkNumberBounds(val, -2147483648n, 2147483647n, 'int32')
    this.#i256(BigInt(val))
  }

  u64(val: bigint) {
    this.checkNumberBounds(val, 0n, 18446744073709551615n, 'uint64')
    this.reserve(WORD_SIZE)
    this.pos += WORD_SIZE - 8
    this.view.setBigUint64(this.pos, val, false)
    this.pos += 8
  }

  i64(val: bigint) {
    this.checkNumberBounds(val, -9223372036854775808n, 9223372036854775807n, 'int64')
    this.#i256(val)
  }

  #u64(val: bigint) {
    this.view.setBigUint64(this.pos, val, false)
    this.pos += 8
  }

  u128(val: bigint) {
    this.checkNumberBounds(val, 0n, 340282366920938463463374607431768211455n, 'uint128')
    this.reserve(WORD_SIZE)
    this.pos += WORD_SIZE - 16
    this.#u64(val & 0xffffffffffffffffn)
    this.#u64(val >> 64n)
  }

  i128(val: bigint) {
    this.checkNumberBounds(val, -170141183460469231731687303715884105728n, 170141183460469231731687303715884105727n, 'int128')
    this.#i256(val)
  }

  #u128(val: bigint) {
    this.reserve(WORD_SIZE)
    this.#u64(val >> 64n)
    this.#u64(val & 0xffffffffffffffffn)
  }

  u256(val: bigint) {
    this.checkNumberBounds(val, 0n, 115792089237316195423570985008687907853269984665640564039457584007913129639935n, 'uint256')
    this.reserve(WORD_SIZE)
    this.#u128(val >> 128n)
    this.#u128(val & (2n ** 128n - 1n))
  }

  i256(val: bigint) {
    this.checkNumberBounds(val,
      -57896044618658097711785492504343953926634992332820282019728792003956564819968n,
      57896044618658097711785492504343953926634992332820282019728792003956564819967n,
      'int256'
    )
    this.#i256(val)
  }

  #i256(val: bigint) {
    let base = 2n ** 256n
    const uval = (val + base) % base
    this.reserve(WORD_SIZE)
    this.#u128(uval >> 128n)
    this.#u128(uval & (2n ** 128n - 1n))
  }

  bytes(val: Uint8Array) {
    const size = Buffer.byteLength(val)
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
    const size = Buffer.byteLength(val)
    if (size > len) {
      throw new Error(`invalid data size for bytes${len}`)
    }
    this.reserve(WORD_SIZE)
    this.buf.set(val, this.pos)
    this.pos += WORD_SIZE
  }

  address(val: string) {
    this.u256(BigInt(val))
  }

  string(val: string) {
    const size = Buffer.byteLength(val)
    this.u32(size)
    const wordsCount = Math.ceil(size / WORD_SIZE)
    const reservedSize = WORD_SIZE * wordsCount
    this.reserve(reservedSize)
    this.buf.write(val, this.pos)
    this.pos += reservedSize
    this.increaseCurrentDataAreaSize(reservedSize + WORD_SIZE)
  }

  bool(val: boolean) {
    this.u8(val ? 1 : 0)
  }

  /**
   * @example
   * @link [Solidity docs](https://docs.soliditylang.org/en/latest/abi-spec.html#use-of-dynamic-types)
   */
  newStaticDataArea(slotsCount = 0) {
    const offset = this.size()
    this.u32(offset)
    const dataAreaStart = this.currentDataAreaStart()
    this.pushDataArea(dataAreaStart + offset, slotsCount)
    this.pos = dataAreaStart + offset
  }

  // Adds elements count before the data area in an additional slot
  newDynamicDataArea(slotsCount: number) {
    const offset = this.size()
    this.u32(offset)
    const dataAreaStart = this.currentDataAreaStart()
    this.pushDataArea(dataAreaStart + offset + WORD_SIZE, slotsCount)
    this.pos = dataAreaStart + offset
    this.u32(slotsCount)
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
