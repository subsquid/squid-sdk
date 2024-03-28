import type { Sink } from "./sink";
import type { Src } from "./src";
import type { Pretty } from "./utils";

export const WORD_SIZE = 32;

export interface Codec<TIn, TOut = TIn> {
  encode(sink: Sink, val: TIn): void;
  decode(src: Src): TOut;
  isDynamic: boolean;
  slotsCount?: number;
}

export type Struct = {
  [key: string]: Codec<any>;
};

export type StructTypes<T extends Struct> = Pretty<{
  [K in keyof T]: T[K] extends Codec<any, infer U> ? U : never;
}>;
