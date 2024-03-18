import {Codec, GetCodecType} from './codec'
import {ArrayCodec} from './codecs/array'
import {SumCodec, Variant} from './codecs/enum'
import {RefCodec} from './codecs/ref'
import {GetStructType, StructCodec} from './codecs/struct'


export * from './codecs/primitives'


/**
 * Dynamically sized array of elements
 */
export function array<IC extends Codec<any>>(item: IC): ArrayCodec<GetCodecType<IC>> {
    return new ArrayCodec(item)
}


export function struct<Props extends Record<string, Codec<any>>>(
    props: Props
): StructCodec<GetStructType<Props>> {
    return new StructCodec(props as any)
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
