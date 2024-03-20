import { Codec } from "../codec";
import { Sink } from "../sink";
import { Src } from "../src";

export type Props<S> = {
  [K in keyof S]: { codec: Codec<S[K]>; index: number };
};

export class StructCodec<S> implements Codec<S> {
  public isDynamic: boolean;
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
    const tempSink = new Sink(this.sortedProps.length);
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

  // private createDecode(): any {
  //   let body = "return {\n";
  //   for (let key in this.props) {
  //     body += `${propName(key)}: this.props${propAccess(key)}.decode(src),\n`;
  //   }
  //   body += "}\n";
  //   return new Function("src", body);
  // }
  //
  //   private createEncode(): any {
  //     let body = `
  //
  // `;
  //     for (let key in this.props) {
  //       let a = propAccess(key);
  //       body += `this.props${a}.encode(sink, val${a})\n`;
  //     }
  //     return new Function("sink", "val", body);
  //   }
  // }
}
