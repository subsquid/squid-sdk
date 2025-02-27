import {Codec} from '../codec'
import {Sink} from '../sink'
import {Src} from '../src'


export class HashSetCodec<T> implements Codec<Set<T>> {
    constructor(public readonly item: Codec<T>) {}

    encode(sink: Sink, val: Set<T>): void {
        sink.u32(val.size)
        for (let value of val) {
            this.item.encode(sink, value)
        }
    }

    decode(src: Src): Set<T> {
        let len = src.u32()
        let res = new Set<T>()
        for (let i = 0; i < len; i++) {
            let value = this.item.decode(src)
            res.add(value)
        }
        return res
    }
}
