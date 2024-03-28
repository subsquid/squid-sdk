import { Codec, Struct, StructTypes } from "../codec";
import { Sink } from "../sink";
import { Src } from "../src";
import { slotsCount } from "../utils";

export class StructCodec<const T extends Struct>
  implements Codec<StructTypes<T>>
{
  public readonly isDynamic: boolean;
  public readonly slotsCount: number;
  private readonly childrenSlotsCount: number;
  private readonly components: T;

  constructor(components: T) {
    this.components = components;
    const codecs = Object.values(components);
    this.isDynamic = codecs.some((codec) => codec.isDynamic);
    this.childrenSlotsCount = slotsCount(codecs);
    if (this.isDynamic) {
      this.slotsCount = 1;
    } else {
      this.slotsCount = this.childrenSlotsCount;
    }
  }

  public encode(sink: Sink, val: StructTypes<T>): void {
    if (this.isDynamic) {
      this.encodeDynamic(sink, val);
      return;
    }
    for (let i in this.components) {
      let prop = this.components[i];
      prop.encode(sink, val[i]);
    }
  }

  private encodeDynamic(sink: Sink, val: StructTypes<T>): void {
    sink.offset(this.childrenSlotsCount);
    for (let i in this.components) {
      let prop = this.components[i];
      prop.encode(sink, val[i]);
    }
    sink.endDynamic();
  }

  public decode(src: Src): StructTypes<T> {
    if (this.isDynamic) {
      return this.decodeDynamic(src);
    }
    let result: any = {};
    for (let i in this.components) {
      let prop = this.components[i];
      result[i] = prop.decode(src);
    }
    return result;
  }

  private decodeDynamic(src: Src): StructTypes<T> {
    let result: any = {};

    const offset = src.u32();
    const tmpSrc = src.slice(offset);
    for (let i in this.components) {
      let prop = this.components[i];
      result[i] = prop.decode(tmpSrc);
    }
    return result;
  }
}
