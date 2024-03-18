import {Codec} from '../codec'
import {Sink} from '../sink'
import {Src} from '../src'


/**
 * A plug to insert self-reference to form a recursive type
 */
export class RefCodec<T> implements Codec<T> {
    #codec?: Codec<T>

    constructor(private fn: () => Codec<T>) {}

    get codec(): Codec<T> {
        if (this.#codec) {
            return this.#codec
        } else {
            return this.#codec = this.fn()
        }
    }

    encode(sink: Sink, val: T): void {
        this.codec.encode(sink, val)
    }

    decode(src: Src): T {
        return this.codec.decode(src)
    }
}
