import { Codec, NamedCodec, ParsedNamedCodecList } from "../codec";
import { Sink } from "../sink";
import { Src } from "../src";
import { slotsCount } from "../utils";

export class StructCodec<const T extends ReadonlyArray<NamedCodec<any, string>>>
  implements Codec<ParsedNamedCodecList<T>>
{
  public readonly isDynamic: boolean;
  public readonly slotsCount: number;
  private readonly childrenSlotsCount: number;
  private readonly components: T;

  constructor(...components: T) {
    this.components = components;
    this.isDynamic = components.some((p) => p.isDynamic);
    this.childrenSlotsCount = slotsCount(components);
    if (this.isDynamic) {
      this.slotsCount = 1;
    } else {
      this.slotsCount = this.childrenSlotsCount;
    }
  }

  public encode(sink: Sink, val: ParsedNamedCodecList<T>): void {
    if (this.isDynamic) {
      this.encodeDynamic(sink, val);
      return;
    }
    for (let i = 0; i < this.components.length; i++) {
      let prop = this.components[i];
      prop.encode(sink, (val as any)[prop.name ?? i]);
    }
  }

  private encodeDynamic(sink: Sink, val: ParsedNamedCodecList<T>): void {
    sink.offset();
    const tempSink = new Sink(this.childrenSlotsCount);
    for (let i = 0; i < this.components.length; i++) {
      let prop = this.components[i];
      prop.encode(tempSink, (val as any)[prop.name ?? i]);
    }
    sink.append(tempSink);
    sink.jumpBack();
  }

  public decode(src: Src): ParsedNamedCodecList<T> {
    if (this.isDynamic) {
      return this.decodeDynamic(src);
    }
    let result: any = {};
    for (let i = 0; i < this.components.length; i++) {
      let prop = this.components[i];
      result[prop.name ?? i] = prop.decode(src);
    }
    return result;
  }

  private decodeDynamic(src: Src): ParsedNamedCodecList<T> {
    let result: any = {};

    const offset = src.u32();
    src.pushSlice(offset);
    for (let i = 0; i < this.components.length; i++) {
      let prop = this.components[i];
      result[prop.name ?? i] = prop.decode(src);
    }
    src.popSlice()
    return result;
  }
}
