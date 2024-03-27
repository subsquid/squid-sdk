import { WORD_SIZE } from "./codec";
import { Hex, safeToBuffer, safeToNumber } from "./utils";

type Numberish = number | bigint;
type Bufferish = Uint8Array | Hex;

export class Sink {
  private pos = 0;
  private previousPos = 0;
  private buf: Buffer;
  private view: DataView;
  public size = 0;
  constructor(fields: number, capacity: number = 1280) {
    this.size = fields * WORD_SIZE;
    this.buf = Buffer.alloc(capacity);
    this.view = new DataView(
      this.buf.buffer,
      this.buf.byteOffset,
      this.buf.byteLength
    );
  }

  result(): Buffer {
    return this.buf.subarray(0, this.size);
  }

  toString() {
    return "0x" + this.result().toString("hex");
  }

  reserve(additional: number): void {
    if (this.buf.length - this.pos < additional) {
      this._allocate(this.pos + additional);
    }
  }

  private _allocate(cap: number): void {
    cap = Math.max(cap, this.buf.length * 2);
    let buf = Buffer.alloc(cap);
    buf.set(this.buf);
    this.buf = buf;
    this.view = new DataView(
      this.buf.buffer,
      this.buf.byteOffset,
      this.buf.byteLength
    );
  }

  u8(val: Numberish) {
    this.reserve(WORD_SIZE);
    this.pos += WORD_SIZE - 1;
    this.view.setUint8(this.pos, safeToNumber(val));
    this.pos += 1;
  }

  i8(val: Numberish) {
    this.i256(val);
  }

  u16(val: Numberish) {
    this.reserve(WORD_SIZE);
    this.pos += WORD_SIZE - 2;
    this.view.setUint16(this.pos, safeToNumber(val), false);
    this.pos += 2;
  }

  i16(val: Numberish) {
    this.i256(val);
  }

  u32(val: Numberish) {
    this.reserve(WORD_SIZE);
    this.pos += WORD_SIZE - 4;
    this.view.setUint32(this.pos, safeToNumber(val), false);
    this.pos += 4;
  }

  i32(val: Numberish) {
    this.i256(val);
  }

  u64(val: Numberish) {
    this.reserve(WORD_SIZE);
    this.pos += WORD_SIZE - 8;
    this.view.setBigUint64(this.pos, BigInt(val), false);
    this.pos += 8;
  }

  i64(val: Numberish) {
    this.i256(val);
  }

  #u64(val: Numberish) {
    this.view.setBigUint64(this.pos, BigInt(val), false);
    this.pos += 8;
  }

  u128(val: Numberish) {
    val = BigInt(val);
    this.reserve(WORD_SIZE);
    this.pos += WORD_SIZE - 16;
    this.#u64(val & 0xffffffffffffffffn);
    this.#u64(val >> 64n);
  }

  i128(val: Numberish) {
    this.i256(val);
  }

  #u128(val: Numberish) {
    val = BigInt(val);
    this.reserve(WORD_SIZE);
    this.#u64(val >> 64n);
    this.#u64(val & 0xffffffffffffffffn);
  }

  u256(val: Numberish) {
    val = BigInt(val);
    this.reserve(WORD_SIZE);
    this.#u128(val >> 128n);
    this.#u128(val & (2n ** 128n - 1n));
  }

  i256(val: Numberish) {
    val = BigInt(val);
    let base = 2n ** 256n;
    val = (val + base) % base;
    this.u256(val);
  }

  bytes(val: Bufferish) {
    val = safeToBuffer(val);

    const size = Buffer.byteLength(val);
    this.u32(size);
    const wordsCount = Math.ceil(size / WORD_SIZE);
    const reservedSize = WORD_SIZE * wordsCount;
    this.reserve(reservedSize);
    this.buf.set(val, this.pos);
    this.pos += reservedSize;
    this.size += reservedSize + WORD_SIZE;
  }

  staticBytes(len: number, val: Bufferish) {
    val = safeToBuffer(val);

    if (len > 32) {
      throw new Error(`bytes${len} is not a valid type`);
    }
    const size = Buffer.byteLength(val);
    if (size > len) {
      throw new Error(`invalid data size for bytes${len}`);
    }
    this.reserve(WORD_SIZE);
    this.buf.set(val, this.pos);
    this.pos += WORD_SIZE;
  }

  address(val: Hex) {
    this.u256(BigInt(val));
  }

  string(val: string) {
    const size = Buffer.byteLength(val);
    this.u32(size);
    const wordsCount = Math.ceil(size / WORD_SIZE);
    const reservedSize = WORD_SIZE * wordsCount;
    this.reserve(reservedSize);
    this.buf.write(val, this.pos);
    this.pos += reservedSize;
    this.size += reservedSize + WORD_SIZE;
  }

  bool(val: boolean) {
    this.u8(val ? 1 : 0);
  }

  offset() {
    const ptr = this.size;
    this.u32(ptr);
    this.previousPos = this.pos;
    this.reserve(ptr);
    this.pos = ptr;
  }

  increaseSize(size: number) {
    this.size += size;
  }

  jumpBack() {
    if (this.previousPos === 0) {
      throw new Error("no jump destination found");
    }
    this.pos = this.previousPos;
  }

  append(sink: Sink) {
    this.reserve(sink.size);
    this.buf.set(sink.result(), this.pos);
    this.size += sink.size;
    this.pos += sink.pos;
  }
}
