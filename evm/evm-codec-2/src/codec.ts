import {Sink} from './sink'
import {Src} from './src'


export interface Codec<T> {
    getStaticSize(): number | undefined
    encode(sink: Sink, val: T): void
    decode(src: Src): T
}


export type GetCodecType<C> = C extends Codec<infer T> ? T : never
