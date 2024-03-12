import {Codec, GetCodecType} from './codec'
import {ArrayCodec} from './codecs/array'
import {GetStructType, StructCodec} from './codecs/struct'


export * from './codecs/primitives'


export function array<IC extends Codec<any>>(item: IC): ArrayCodec<GetCodecType<IC>> {
    return new ArrayCodec(item)
}


export function struct<Props extends Record<string, Codec<any>>>(
    props: Props
): StructCodec<GetStructType<Props>> {
    return new StructCodec(props as any)
}
