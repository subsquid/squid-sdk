import type { Codec, Struct } from './codec'
import { ArrayCodec, FixedSizeArrayCodec } from './codecs/array'
import { StructCodec } from './codecs/struct'

export * from './codecs/primitives'
export { ArrayCodec, FixedSizeArrayCodec } from './codecs/array'
export { StructCodec } from './codecs/struct'

export const fixedSizeArray = <TIn, TOut>(item: Codec<TIn, TOut>, size: number): Codec<TIn[], TOut[]> =>
  new FixedSizeArrayCodec(item, size)

export const array = <TIn, TOut>(item: Codec<TIn, TOut>): Codec<TIn[], TOut[]> => new ArrayCodec(item)

export const struct = <const T extends Struct>(components: T) => new StructCodec<T>(components)

export const tuple = struct
