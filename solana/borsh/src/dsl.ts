import {Codec, GetCodecType} from './codec'
import {ArrayCodec, FixedArrayCodec} from './codecs/array'
import {SumCodec, Variant} from './codecs/enum'
import {HashMapCodec} from './codecs/hash-map'
import {HashSetCodec} from './codecs/hash-set'
import {OptionCodec} from './codecs/option'
import {RefCodec} from './codecs/ref'
import {GetStructType, StructCodec} from './codecs/struct'
import {GetTupleType, TupleCodec} from './codecs/tuple'


export * from './codecs/primitives'


/**
 * Dynamically sized array of elements
 */
export function array<IC extends Codec<any>>(item: IC): ArrayCodec<GetCodecType<IC>> {
    return new ArrayCodec(item)
}


export function fixedArray<IC extends Codec<any>>(item: IC, size: number): FixedArrayCodec<GetCodecType<IC>> {
    return new FixedArrayCodec(item, size)
}


export function struct<Props extends Record<string, Codec<any>>>(
    props: Props
): StructCodec<GetStructType<Props>> {
    return new StructCodec(props as any)
}


export function tuple(tuple: []): TupleCodec<[]>
export function tuple<T>(tuple: [T]): TupleCodec<GetTupleType<[T]>>
export function tuple<T1, T2>(tuple: [T1, T2]): TupleCodec<GetTupleType<[T1, T2]>>
export function tuple<T1, T2, T3>(tuple: [T1, T2, T3]): TupleCodec<GetTupleType<[T1, T2, T3]>>
export function tuple<T1, T2, T3, T4>(tuple: [T1, T2, T3, T4]): TupleCodec<GetTupleType<[T1, T2, T3, T4]>>
export function tuple<T1, T2, T3, T4, T5>(tuple: [T1, T2, T3, T4, T5]): TupleCodec<GetTupleType<[T1, T2, T3, T4, T5]>>
export function tuple<T1, T2, T3, T4, T5, T6>(tuple: [T1, T2, T3, T4, T5, T6]): TupleCodec<GetTupleType<[T1, T2, T3, T4, T5, T6]>>
export function tuple<T1, T2, T3, T4, T5, T6, T7>(tuple: [T1, T2, T3, T4, T5, T6, T7]): TupleCodec<GetTupleType<[T1, T2, T3, T4, T5, T6, T7]>>
export function tuple<T1, T2, T3, T4, T5, T6, T7, T8>(tuple: [T1, T2, T3, T4, T5, T6, T7, T8]): TupleCodec<GetTupleType<[T1, T2, T3, T4, T5, T6, T7, T8]>>
export function tuple<T1, T2, T3, T4, T5, T6, T7, T8, T9>(tuple: [T1, T2, T3, T4, T5, T6, T7, T8, T9]): TupleCodec<GetTupleType<[T1, T2, T3, T4, T5, T6, T7, T8, T9]>>
export function tuple<T extends any[]>(tuple: T): TupleCodec<T> {
    return new TupleCodec(tuple as any)
}


export function hashMap<KC extends Codec<any>, VC extends Codec<any>>(key: KC, value: VC): HashMapCodec<GetCodecType<KC>, GetCodecType<VC>> {
    return new HashMapCodec(key, value)
}


export function hashSet<IC extends Codec<any>>(item: IC): HashSetCodec<GetCodecType<IC>> {
    return new HashSetCodec(item)
}


export function option<IC extends Codec<any>>(item: IC): OptionCodec<GetCodecType<IC>> {
    return new OptionCodec(item)
}


export {Variant}


/**
 * Forms a rust enum type.
 *
 * Because `enum` is a reserved keyword in TypeScript we'll refer to it as [sum](https://en.wikipedia.org/wiki/Tagged_union)
 */
export function sum<Variants extends Record<string, Variant<any>>>(
    discriminatorType: 1 | 2 | 4 | 8,
    variants: Variants
): SumCodec<Variants> {
    return new SumCodec<Variants>(discriminatorType, variants)
}


/**
 * A plug to insert self-reference to form a recursive type
 */
export function ref<C extends Codec<any>>(fn: () => C): RefCodec<GetCodecType<C>> {
    return new RefCodec(fn)
}
