import { Codec } from "../codec";
import { Sink } from "../sink";
import { Src } from "../src";

export class ArrayCodec<T> implements Codec<T[]> {
  public readonly isDynamic = true;

  constructor(public readonly item: Codec<T>) {}

  encode(sink: Sink, val: T[]) {
    sink.offset();
    sink.u32(val.length);
    const tempSink = new Sink(val.length);
    for (let i = 0; i < val.length; i++) {
      this.item.encode(tempSink, val[i]);
    }
    sink.increaseSize(32);
    sink.append(tempSink);
    sink.jumpBack();
  }

  decode(src: Src): T[] {
    const offset = src.u32();

    src.safeJump(offset);
    const len = src.u32();

    const tmpSrc = src.slice(offset + 32);
    const val = new Array(len);
    for (let i = 0; i < val.length; i++) {
      val[i] = this.item.decode(tmpSrc);
    }
    src.jumpBack();
    return val;
  }
}

export class FixedArrayCodec<T> implements Codec<T[]> {
  public isDynamic: boolean;

  constructor(public readonly item: Codec<T>, public readonly size: number) {
    this.isDynamic = item.isDynamic && size > 0;
  }

  encode(sink: Sink, val: T[]) {
    if (val.length !== this.size) {
      throw new Error(
        `invalid array length: ${val.length}. Expected: ${this.size}`
      );
    }
    if (this.isDynamic) {
      return this.encodeDynamic(sink, val);
    }
    for (let i = 0; i < this.size; i++) {
      this.item.encode(sink, val[i]);
    }
  }

  private encodeDynamic(sink: Sink, val: T[]) {
    sink.offset();
    const tempSink = new Sink(this.size);
    for (let i = 0; i < val.length; i++) {
      this.item.encode(tempSink, val[i]);
    }
    sink.append(tempSink);
    sink.jumpBack();
  }

  decode(src: Src): T[] {
    if (this.isDynamic) {
      return this.decodeDynamic(src);
    }
    let val = new Array(this.size);
    for (let i = 0; i < val.length; i++) {
      val[i] = this.item.decode(src);
    }
    return val;
  }

  private decodeDynamic(src: Src): T[] {
    const offset = src.u32();
    const tmpSrc = src.slice(offset);
    let val = new Array(this.size);
    for (let i = 0; i < val.length; i++) {
      val[i] = this.item.decode(tmpSrc);
    }
    return val;
  }
}
