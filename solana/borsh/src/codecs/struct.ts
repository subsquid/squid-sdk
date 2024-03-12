import {Codec, GetCodecType} from '../codec'
import {Sink} from '../sink'
import {Src} from '../src'
import {AddOptionToUndefined, Simplify} from '../type-util'


export type GetStructType<Props> = Simplify<AddOptionToUndefined<{
    [K in keyof Props]: GetCodecType<Props[K]>
}>>


type Props<S> = {
    [K in keyof S]: Codec<S>
}


export class StructCodec<S> implements Codec<S> {
    encode: (sink: Sink, val: S) => void
    decode: (src: Src) => S

    constructor(public readonly props: Props<S>) {
        this.decode = this.createDecode()
        this.encode = this.createEncode()
    }

    private createDecode(): any {
        let body = 'return {\n'
        for (let key in this.props) {
            body += `${propName(key)}: this.props${propAccess(key)}.decode(src),\n`
        }
        body += '}\n'
        return new Function('src', body)
    }

    private createEncode(): any {
        let body = ``
        for (let key in this.props) {
            let a = propAccess(key)
            body += `this.props${a}.encode(sink, val${a})\n`
        }
        return new Function('sink', 'val', body)
    }
}


function propName(prop: string): string {
    if (isValidProperty(prop)) {
        return prop
    } else {
        return '[' + JSON.stringify(prop) + ']'
    }
}


function propAccess(prop: string): string {
    if (isValidProperty(prop)) {
        return '.' + prop
    } else {
        return '[' + JSON.stringify(prop) + ']'
    }
}


function isValidProperty(s: string): boolean {
    return /^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(s)
}


// export class StructCodec<S> implements Codec<S> {
//     constructor(public readonly props: Props<S>) {}
//
//     encode(sink: Sink, val: S): void {
//         throw new Error('Method not implemented.')
//     }
//
//     decode(src: Src): S {
//         let result: any = {}
//         for (let key in this.props) {
//             result[key] = this.props[key].decode(src)
//         }
//         return result
//     }
// }
