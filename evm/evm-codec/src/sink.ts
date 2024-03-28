import assert from "node:assert";
import { WORD_SIZE } from "./codec";

export class Sink {
  private pos = 0;
  private buf: Buffer;
  private view: DataView;
  private stack: { start: number; prev: number; size: number }[] = [];
  constructor(fields: number, capacity: number = 1280) {
    this.stack.push({
      start: 0,
      prev: 0,
      size: fields * WORD_SIZE,
    });
    this.buf = Buffer.alloc(capacity);
    this.view = new DataView(
      this.buf.buffer,
      this.buf.byteOffset,
      this.buf.byteLength
    );
  }

  result(): Buffer {
    assert(
      this.stack.length === 1,
      "Cannot get result during dynamic encoding"
    );
    return this.buf.subarray(0, this.size());
  }

  toString() {
    return "0x" + this.result().toString("hex");
  }

  reserve(additional: number): void {
    if (this.buf.length - this.pos < additional) {
      this._allocate(this.pos + additional);
    }
  }

  size() {
    return this.stack.at(-1)!.size;
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

  u8(val: number) {
    this.reserve(WORD_SIZE);
    this.pos += WORD_SIZE - 1;
    this.view.setUint8(this.pos, val);
    this.pos += 1;
  }

  i8(val: number) {
    this.i256(BigInt(val));
  }

  u16(val: number) {
    this.reserve(WORD_SIZE);
    this.pos += WORD_SIZE - 2;
    this.view.setUint16(this.pos, val, false);
    this.pos += 2;
  }

  i16(val: number) {
    this.i256(BigInt(val));
  }

  u32(val: number) {
    this.reserve(WORD_SIZE);
    this.pos += WORD_SIZE - 4;
    this.view.setUint32(this.pos, val, false);
    this.pos += 4;
  }

  i32(val: number) {
    this.i256(BigInt(val));
  }

  u64(val: bigint) {
    this.reserve(WORD_SIZE);
    this.pos += WORD_SIZE - 8;
    this.view.setBigUint64(this.pos, val, false);
    this.pos += 8;
  }

  i64(val: bigint) {
    this.i256(val);
  }

  #u64(val: bigint) {
    this.view.setBigUint64(this.pos, val, false);
    this.pos += 8;
  }

  u128(val: bigint) {
    this.reserve(WORD_SIZE);
    this.pos += WORD_SIZE - 16;
    this.#u64(val & 0xffffffffffffffffn);
    this.#u64(val >> 64n);
  }

  i128(val: bigint) {
    this.i256(BigInt(val));
  }

  #u128(val: bigint) {
    this.reserve(WORD_SIZE);
    this.#u64(val >> 64n);
    this.#u64(val & 0xffffffffffffffffn);
  }

  u256(val: bigint) {
    this.reserve(WORD_SIZE);
    this.#u128(val >> 128n);
    this.#u128(val & (2n ** 128n - 1n));
  }

  i256(val: bigint) {
    let base = 2n ** 256n;
    val = (val + base) % base;
    this.u256(val);
  }

  bytes(val: Uint8Array) {
    const size = Buffer.byteLength(val);
    this.u32(size);
    const wordsCount = Math.ceil(size / WORD_SIZE);
    const reservedSize = WORD_SIZE * wordsCount;
    this.reserve(reservedSize);
    this.buf.set(val, this.pos);
    this.pos += reservedSize;
    this.increaseSize(reservedSize + WORD_SIZE);
  }

  staticBytes(len: number, val: Uint8Array) {
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

  address(val: string) {
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
    this.increaseSize(reservedSize + WORD_SIZE);
  }

  bool(val: boolean) {
    this.u8(val ? 1 : 0);
  }

  offset(slotsCount = 0) {
    const ptr = this.size();
    this.u32(ptr);
    const _start = this.start();
    this.startDynamic(_start + ptr, slotsCount);
    this.pos = _start + ptr;
  }

  dynamicOffset(slotsCount: number) {
    const ptr = this.size();
    this.u32(ptr);
    const _start = this.start();
    this.startDynamic(_start + ptr + WORD_SIZE, slotsCount);
    this.pos = _start + ptr;
    this.u32(slotsCount);
  }

  private start() {
    return this.stack.at(-1)!.start;
  }

  public increaseSize(amount: number) {
    this.stack.at(-1)!.size += amount;
  }

  private startDynamic(start: number, slotsCount: number) {
    const size = slotsCount * WORD_SIZE;
    this.reserve(start + size);
    this.stack.push({
      start,
      prev: this.pos,
      size,
    });
  }

  endDynamic() {
    assert(this.stack.length > 1, "No dynamic encoding started");
    const { prev, size } = this.stack.pop()!;
    this.increaseSize(size);
    this.pos = prev;
  }
}
