import { Codec, Struct, StructTypes } from "../codec";
import { Sink } from "../sink";
import { slotsCount } from "../utils";
import { Src } from "../src";
import assert from "node:assert";

export class AbiFunction<const T extends Struct, R> {
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
    this.slotsCount = slotsCount(Object.values(args));
  }

  is(calldata: string) {
    return calldata.startsWith(this.selector);
  }

  encode(args: StructTypes<T>) {
    const sink = new Sink(this.slotsCount);
    for (let i in this.args) {
      this.args[i].encode(sink, args[i]);
    }
    return `0x${Buffer.concat([this.#selector, sink.result()]).toString(
      "hex"
    )}`;
  }

  decode(calldata: string): StructTypes<T> {
    assert(
      this.is(calldata),
      `unexpected function signature: ${calldata.slice(0, 10)}`
    );
    const src = new Src(Buffer.from(calldata.slice(10), "hex"));
    const result = {} as any;
    for (let i in this.args) {
      result[i] = this.args[i].decode(src);
    }
    return result;
  }

  decodeResult(output: string): R {
    const src = new Src(Buffer.from(output.slice(2), "hex"));
    return this.returnType?.decode(src) as any;
  }
}
