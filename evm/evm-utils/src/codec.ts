import type { Sink } from "./sink";
import type { Src } from "./src";

export const WORD_SIZE = 32;

export interface Codec<T> {
  encode(sink: Sink, val: T): void;
  decode(src: Src): T;
  isDynamic: boolean;
  slotsCount?: number;
}

export type NamedCodec<T, S extends string> = { name?: S } & Codec<T>;

type Identity<T> = T extends object
  ? {
      [P in keyof T]: Identity<T[P]>;
    }
  : T;
type NameOrIndex<S, N extends number> = S extends string ? S : N;

export type ParsedNamedCodecList<T, CNT extends any[] = []> = Identity<
  T extends readonly [Readonly<NamedCodec<infer U, infer Name>>]
    ? { [K in NameOrIndex<Name, CNT["length"]>]: U }
    : T extends readonly [NamedCodec<infer U, infer Name>, ...infer R]
    ? { [K in NameOrIndex<Name, CNT["length"]>]: U } & ParsedNamedCodecList<
        R,
        [...CNT, 0]
      >
    : never
>;

type DeepReadonly<T> = Readonly<{
  [K in keyof T]: T[K] extends number | string | symbol
    ? Readonly<T[K]>
    : T[K] extends Array<infer A>
    ? Readonly<Array<DeepReadonly<A>>>
    : DeepReadonly<T[K]>;
}>;

export type NamedCodecListArgs<T> = T extends readonly [
  NamedCodec<infer U, any>
]
  ? readonly [DeepReadonly<U>]
  : T extends readonly [NamedCodec<infer U, any>, ...infer R]
  ? readonly [DeepReadonly<U>, ...NamedCodecListArgs<R>]
  : never;
