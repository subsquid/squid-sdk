import { Codec } from "../codec";
import { Sink } from "../sink";
import { Src } from "../src";
import { slotsCount } from "../utils";

export type Props<S> = {
  [K in keyof S]: { codec: Codec<S[K]>; index: number };
};

export class StructCodec<S> implements Codec<S> {
  public isDynamic: boolean;
  public slotsCount: number;
  private childrenSlotsCount: number;
  private readonly sortedProps: {
    name: string;
    codec: Codec<any>;
    index: number;
  }[];

  constructor(public readonly props: Props<S>) {
    this.sortedProps = Object.entries(props)
      .map(([key, value]: [string, any]) => ({
        name: key,
        ...value,
      }))
      .sort((a, b) => a.index - b.index);

    this.isDynamic = this.sortedProps.some((p) => p.codec.isDynamic);
    this.childrenSlotsCount = slotsCount(
      this.sortedProps.map(({ codec }) => codec)
    );
    if (this.isDynamic) {
      this.slotsCount = 1;
    } else {
      this.slotsCount = this.childrenSlotsCount;
    }
  }

  public encode(sink: Sink, val: S): void {
    if (this.isDynamic) {
      this.encodeDynamic(sink, val);
      return;
    }
    for (let prop of this.sortedProps) {
      prop.codec.encode(sink, (val as any)[prop.name]);
    }
  }

  private encodeDynamic(sink: Sink, val: S): void {
    sink.offset();
    const tempSink = new Sink(this.childrenSlotsCount);
    for (const prop of this.sortedProps) {
      prop.codec.encode(tempSink, (val as any)[prop.name]);
    }
    sink.append(tempSink);
    sink.jumpBack();
  }

  public decode(src: Src): S {
    if (this.isDynamic) {
      return this.decodeDynamic(src);
    }
    let result: any = {};
    for (const prop of this.sortedProps) {
      result[prop.name] = prop.codec.decode(src);
    }
    return result;
  }

  private decodeDynamic(src: Src): S {
    let result: any = {};

    const offset = src.u32();
    const tmpSrc = src.slice(offset);
    for (const prop of this.sortedProps) {
      result[prop.name] = prop.codec.decode(tmpSrc);
    }
    return result;
  }
}
