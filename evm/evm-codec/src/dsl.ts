import type {Codec, Struct} from './codec'
import {ArrayCodec, FixedSizeArrayCodec} from './codecs/array'
import {StructCodec} from './codecs/struct'

export * from './codecs/primitives'
export {ArrayCodec, FixedSizeArrayCodec} from './codecs/array'
export {StructCodec, type DecodedStruct, type EncodedStruct} from './codecs/struct'

export const fixedSizeArray = <TIn, TOut>(item: Codec<TIn, TOut>, size: number): FixedSizeArrayCodec<TIn, TOut> =>
    new FixedSizeArrayCodec(item, size)

export const array = <TIn, TOut>(item: Codec<TIn, TOut>): ArrayCodec<TIn, TOut> => new ArrayCodec(item)

export const struct = <const T extends Struct>(components: T): StructCodec<T> => new StructCodec<T>(components)

export const tuple = struct
