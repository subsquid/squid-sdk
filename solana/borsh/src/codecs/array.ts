import {Codec} from '../codec'
import {Sink} from '../sink'
import {Src} from '../src'


export class ArrayCodec<T> implements Codec<T[]> {
    constructor(public readonly item: Codec<T>) {}

    encode(sink: Sink, val: T[]): void {
        sink.u32(val.length)
        for (let i = 0; i < val.length; i++) {
            this.item.encode(sink, val[i])
        }
    }

    decode(src: Src): T[] {
        let len = src.u32()
        let val = new Array(len)
        for (let i = 0; i < val.length; i++) {
            val[i] = this.item.decode(src)
        }
        return val
    }
}


export class FixedArrayCodec<T> implements Codec<T[]> {
    constructor(
        public readonly item: Codec<T>,
        public readonly size: number
    ) {}

    encode(sink: Sink, val: T[]): void {
        for (let i = 0; i < this.size; i++) {
            this.item.encode(sink, val[i])
        }
    }

    decode(src: Src): T[] {
        let val = new Array(this.size)
        for (let i = 0; i < val.length; i++) {
            val[i] = this.item.decode(src)
        }
        return val
    }
}
