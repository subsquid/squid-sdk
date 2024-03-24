import { bytes, bytes32 } from "../codecs/primitives";
import { Src } from "../src";
import { IndexedCodec, ParsedNamedCodecList } from "../codec";

export interface EventRecord {
  topics: string[];
  data: string;
}

export type IndexedCodecs<T> = T extends readonly [
  { indexed: true; isDynamic: true; name?: string },
  ...infer R
]
  ? [
      typeof bytes32 & { indexed: true; name: T[0]["name"] },
      ...IndexedCodecs<R>
    ]
  : T extends readonly [any, ...infer R]
  ? [T[0], ...IndexedCodecs<R>]
  : T extends readonly []
  ? []
  : never;

export class AbiEvent<
  const T extends ReadonlyArray<IndexedCodec<any, string>>
> {
  public readonly params: any;
  constructor(public readonly topic: string, ...args: T) {
    this.params = args.map((arg) =>
      arg.indexed && arg.isDynamic
        ? {
            ...bytes32,
            name: arg.name,
            isDynamic: true,
            indexed: true,
          }
        : arg
    ) as IndexedCodecs<T>;
  }

  is(rec: EventRecord): boolean {
    return rec.topics[0] === this.topic;
  }

  decode(rec: EventRecord): ParsedNamedCodecList<IndexedCodecs<T>> {
    const src = new Src(Buffer.from(rec.data.slice(2), "hex"));
    const result = {} as any;
    let topicCounter = 1;
    for (let i = 0; i < this.params.length; i++) {
      if (this.params[i].indexed) {
        const topic = rec.topics[topicCounter++];
        const topicSrc = new Src(Buffer.from(topic.slice(2), "hex"));
        result[this.params[i].name ?? i] = this.params[i].decode(topicSrc);
      } else {
        result[this.params[i].name ?? i] = this.params[i].decode(src);
      }
    }
    return result;
  }
}
