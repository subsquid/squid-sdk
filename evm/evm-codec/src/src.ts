import { WORD_SIZE } from './codec'

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

  nat(): number {
    this.pos += WORD_SIZE - 4
    let val = this.view.getUint32(this.pos, false)
    this.pos += 4
    return val
  }

  #u64(): bigint {
    let val = this.view.getBigUint64(this.pos, false)
    this.pos += 8
    return val
  }

  #i64(): bigint {
    let val = this.view.getBigInt64(this.pos, false)
    this.pos += 8
    return val
  }

  #u128(): bigint {
    let hi = this.#u64()
    let lo = this.#u64()
    return lo + (hi << 64n)
  }

  #i128(): bigint {
    let hi = this.#i64()
    let lo = this.#u64()
    return lo + (hi << 64n)
  }

  u256(): bigint {
    let hi = this.#u128()
    let lo = this.#u128()
    return lo + (hi << 128n)
  }

  i256(): bigint {
    let hi = this.#i128()
    let lo = this.#u128()
    return lo + (hi << 128n)
  }

  bytes(): Uint8Array {
    const ptr = this.nat()
    this.safeJump(ptr)
    const len = this.nat()
    this.assertLength(len)
    const val = this.buf.subarray(this.pos, this.pos + len)
    this.jumpBack()
    return val
  }

  staticBytes(): Uint8Array {
    const val = this.buf.subarray(this.pos, this.pos + WORD_SIZE)
    this.pos += WORD_SIZE
    return val
  }

  string(): string {
    const ptr = this.nat()
    this.safeJump(ptr)
    const len = this.nat()
    this.assertLength(len)
    const val = Buffer.from(this.buf.buffer, this.buf.byteOffset + this.pos, len).toString('utf-8')
    this.jumpBack()
    return val
  }

  private assertLength(len: number): void {
    if (this.buf.length - this.pos < len) {
      throw new RangeError('Unexpected end of input')
    }
  }

  public safeJump(pos: number): void {
    if (pos < 0 || pos >= this.buf.length) {
      throw new RangeError(`Unexpected pointer location: 0x${pos.toString(16)}`)
    }
    this.oldPos = this.pos
    this.pos = pos
  }

  public jumpBack(): void {
    this.pos = this.oldPos
  }
}
