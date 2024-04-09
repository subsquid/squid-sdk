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

  nat(val: number) {
    this.reserve(WORD_SIZE)
    this.pos += WORD_SIZE - 4
    this.view.setUint32(this.pos, val, false)
    this.pos += 4
  }

  #u64(val: bigint) {
    this.view.setBigUint64(this.pos, val, false)
    this.pos += 8
  }

  #u128(val: bigint) {
    this.reserve(WORD_SIZE)
    this.#u64(val >> 64n)
    this.#u64(val & 0xffffffffffffffffn)
  }

  u256(val: bigint) {
    this.reserve(WORD_SIZE)
    this.#u128(val >> 128n)
    this.#u128(val & (2n ** 128n - 1n))
  }

  i256(val: bigint) {
    let base = 2n ** 256n
    val = (val + base) % base
    this.u256(val)
  }

  bytes(val: Uint8Array) {
    const size = Buffer.byteLength(val)
    this.nat(size)
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
    this.nat(size)
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
    this.nat(offset)
    const dataAreaStart = this.currentDataAreaStart()
    this.pushDataArea(dataAreaStart + offset, slotsCount)
    this.pos = dataAreaStart + offset
  }

  // Adds elements count before the data area in an additional slot
  newDynamicDataArea(slotsCount: number) {
    const offset = this.size()
    this.nat(offset)
    const dataAreaStart = this.currentDataAreaStart()
    this.pushDataArea(dataAreaStart + offset + WORD_SIZE, slotsCount)
    this.pos = dataAreaStart + offset
    this.nat(slotsCount)
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
