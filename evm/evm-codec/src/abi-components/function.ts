import {
  ParsedNamedCodecList,
  NamedCodec,
  CodecListArgs,
  Codec,
} from "../codec";
import { Sink } from "../sink";
import { assert } from "vitest";
import { slotsCount } from "../utils";
import { Src } from "../src";

export class AbiFunction<
  const T extends ReadonlyArray<NamedCodec<any, any>>,
  R
> {
  readonly #selector: Buffer;
  private readonly slotsCount: number;

  constructor(
    public selector: string,
    public readonly args: T,
    public readonly returnType?: Codec<R>
  ) {
    assert(selector.startsWith("0x"), "selector must start with 0x");
    assert(selector.length === 10, "selector must be 4 bytes long");
    this.#selector = Buffer.from(selector.slice(2), "hex");
    this.args = args;
    this.slotsCount = slotsCount(args);
  }

  is(calldata: string) {
    return calldata.startsWith(this.selector);
  }

  encode(...args: CodecListArgs<T>) {
    const sink = new Sink(this.slotsCount);
    for (let i = 0; i < this.args.length; i++) {
      this.args[i].encode(sink, args[i]);
    }
    return `0x${Buffer.concat([this.#selector, sink.result()]).toString(
      "hex"
    )}`;
  }

  decode(calldata: string): ParsedNamedCodecList<T> {
    assert(
      this.is(calldata),
      `unexpected function signature: ${calldata.slice(0, 10)}`
    );
    const src = new Src(Buffer.from(calldata.slice(10), "hex"));
    const result = {} as any;
    for (let i = 0; i < this.args.length; i++) {
      result[this.args[i].name ?? i] = this.args[i].decode(src);
    }
    return result;
  }

  decodeResult(output: string): R | undefined {
    const src = new Src(Buffer.from(output.slice(2), "hex"));
    return this.returnType?.decode(src);
  }
}
