import {Codec} from '../codec'
import {Sink} from '../sink'
import {Src} from '../src'


export class OptionCodec<T> implements Codec<T | undefined> {
    constructor(public readonly item: Codec<T>) {}

    encode(sink: Sink, val: T | undefined): void {
        if (val === undefined) {
            sink.u8(0)
        } else {
            sink.u8(1)
            this.item.encode(sink, val)
        }
    }

    decode(src: Src): T | undefined {
        let d = src.u8()
        switch (d) {
            case 0:
                return undefined
            case 1:
                return this.item.decode(src)
            default:
                throw new Error(`Got unexpected discriminator value: ${d}`)
        }
    }
}
