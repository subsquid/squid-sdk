import type { Sink } from "./sink";
import type { Src } from "./src";
import type { Pretty } from "./utils";

export const WORD_SIZE = 32;

export interface Codec<T> {
  encode(sink: Sink, val: T): void;
  decode(src: Src): T;
  isDynamic: boolean;
  slotsCount?: number;
}

export type Struct = {
  [key: string]: Codec<any>;
};

export type StructTypes<T extends Struct> = Pretty<{
  [K in keyof T]: T[K] extends Codec<infer U> ? U : never;
}>;
