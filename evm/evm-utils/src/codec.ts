import type { Sink } from "./sink";
import type { Src } from "./src";

export const WORD_SIZE = 32;

export interface Codec<T> {
  encode(sink: Sink, val: T): void;
  decode(src: Src): T;
  isDynamic: boolean;
}
