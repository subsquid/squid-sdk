import {Codec} from '../codec'
import {Sink} from '../sink'
import {Src} from '../src'


export class HashMapCodec<K, V> implements Codec<Map<K, V>> {
    constructor(public readonly key: Codec<K>, public readonly value: Codec<V>) {}

    encode(sink: Sink, val: Map<K, V>): void {
        sink.u32(val.size)
        for (let [key, value] of val) {
            this.key.encode(sink, key)
            this.value.encode(sink, value)
        }
    }

    decode(src: Src): Map<K, V> {
        let len = src.u32()
        let res = new Map<K, V>()
        for (let i = 0; i < len; i++) {
            let key = this.key.decode(src)
            let value = this.value.decode(src)
            res.set(key, value)
        }
        return res
    }
}
