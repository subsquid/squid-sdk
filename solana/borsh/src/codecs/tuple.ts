import {Codec, GetCodecType} from '../codec'
import {Sink} from '../sink'
import {Src} from '../src'


export type GetTupleType<T> = {
    [I in keyof T]: GetCodecType<T[I]>
}


export class TupleCodec<const T extends any[]> implements Codec<T> {
    encode: (sink: Sink, val: T) => void
    decode: (src: Src) => T

    constructor(public readonly tuple: T) {
        this.decode = this.createDecode()
        this.encode = this.createEncode()
    }

    private createDecode(): any {
        let body = 'return [\n'
        for (let i = 0; i < this.tuple.length; i++) {
            body += `this.tuple[${i}].decode(src),\n`
        }
        body += ']\n'
        return new Function('src', body)
    }

    private createEncode(): any {
        let body = ``
        for (let i = 0; i < this.tuple.length; i++) {
            body += `this.tuple[${i}].encode(sink, val[${i}])\n`
        }
        return new Function('sink', 'val', body)
    }
}