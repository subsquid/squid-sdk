import type { Sink } from "./sink";
import type { Src } from "./src";

export type GetCodecType<C> = C extends Codec<infer T> ? T : never;

export interface Codec<T> {
  encode(sink: Sink, val: T): void;
  decode(src: Src): T;
  isDynamic: boolean;
}
