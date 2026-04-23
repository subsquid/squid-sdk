import { WORD_SIZE } from './codec'
import { bytesToHexString } from './hex'

const I128_SIGN_BIT = 1n << 127n
const I128_RANGE = 1n << 128n
const I64_SIGN_BIT = 1n << 63n
const I64_RANGE = 1n << 64n

// `TextDecoder` is stateless under default construction, so a single shared
// instance is safe.
const TEXT_DECODER = new TextDecoder('utf-8')

export class Src {
  private view: DataView
  private pos = 0
  private oldPos = 0
  constructor(private buf: Uint8Array) {
    this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  }

  slice(start: number, end?: number): Src {
    return new Src(this.buf.subarray(start, end))
  }

  u8(): number {
    this.pos += WORD_SIZE - 1
    let val = this.view.getUint8(this.pos)
    this.pos += 1
    return val
  }

  i8(): number {
    return Number(this.i256())
  }

  u16(): number {
    this.pos += WORD_SIZE - 2
    let val = this.view.getUint16(this.pos, false)
    this.pos += 2
    return val
  }

  i16(): number {
    return Number(this.i256())
  }

  u32(): number {
    this.pos += WORD_SIZE - 4
    let val = this.view.getUint32(this.pos, false)
    this.pos += 4
    return val
  }

  i32(): number {
    return Number(this.i256())
  }

  u64(): bigint {
    this.pos += WORD_SIZE - 8
    return this.#u64()
  }

  #u64(): bigint {
    let val = this.view.getBigUint64(this.pos, false)
    this.pos += 8
    return val
  }

  i64(): bigint {
    this.pos += WORD_SIZE - 8
    // Unpack as signed: two's complement over 64 bits.
    const raw = this.#u64()
    return raw < I64_SIGN_BIT ? raw : raw - I64_RANGE
  }

  u128(): bigint {
    this.pos += WORD_SIZE - 16
    return this.#u128()
  }

  #u128(): bigint {
    const hi = this.view.getBigUint64(this.pos, false)
    const lo = this.view.getBigUint64(this.pos + 8, false)
    this.pos += 16
    return (hi << 64n) | lo
  }

  i128(): bigint {
    this.pos += WORD_SIZE - 16
    const raw = this.#u128()
    return raw < I128_SIGN_BIT ? raw : raw - I128_RANGE
  }

  u256(): bigint {
    const hi = this.#u128()
    const lo = this.#u128()
    return (hi << 128n) | lo
  }

  i256(): bigint {
    const hi = this.#u128()
    const lo = this.#u128()
    // sign-extend high 128 bits
    const raw = (hi << 128n) | lo
    return hi < I128_SIGN_BIT ? raw : raw - (1n << 256n)
  }

  /**
   * Read the next word and return its trailing 20 bytes as a lowercase hex
   * address. Avoids parsing the whole word into a BigInt just to
   * re-stringify it.
   */
  address(): string {
    const start = this.pos + WORD_SIZE - 20
    this.pos += WORD_SIZE
    return '0x' + bytesToHexString(this.buf, start, 20)
  }

  bytes(): Uint8Array {
    const ptr = this.u32()
    this.safeJump(ptr, 'bytes')
    const len = Number(this.u256())
    this.assertLength(len, 'bytes')
    const val = this.buf.subarray(this.pos, this.pos + len)
    this.jumpBack()
    return val
  }

  staticBytes(len: number): Uint8Array {
    if (len > 32) {
      throw new Error(`bytes${len} is not a valid type`)
    }
    const val = this.buf.subarray(this.pos, this.pos + len)
    this.pos += WORD_SIZE
    return val
  }

  string(): string {
    const ptr = this.u32()
    this.safeJump(ptr, 'string')
    const len = Number(this.u256())
    this.assertLength(len, 'string')
    const val = TEXT_DECODER.decode(this.buf.subarray(this.pos, this.pos + len))
    this.jumpBack()
    return val
  }

  bool(): boolean {
    return !!this.u8()
  }

  private assertLength(len: number, typeName: string): void {
    if (this.buf.length - this.pos < len) {
      throw new RangeError(
        `Unexpected end of input. Attempting to read ${typeName} of length ${len} from 0x${bytesToHexString(this.buf, 0, this.buf.length)}`,
      )
    }
  }

  public safeJump(pos: number, typeName: string): void {
    if (pos < 0 || pos >= this.buf.length) {
      throw new RangeError(
        `Unexpected pointer location: 0x${pos.toString(16)}. Attempting to read ${typeName} from 0x${bytesToHexString(this.buf, 0, this.buf.length)}`,
      )
    }
    this.oldPos = this.pos
    this.pos = pos
  }

  public jumpBack(): void {
    this.pos = this.oldPos
  }
}
