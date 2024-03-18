import {Codec, GetCodecType} from '../codec'
import {Sink} from '../sink'
import {Src} from '../src'
import {propAccess} from '../util'
import {unit} from './primitives'


export interface Variant<T> {
    discriminator: number | bigint
    value: Codec<T>
}


type ValueProp<T> = [T] extends [undefined]
    ? {}
    : [undefined] extends T
        ? {value?: T}
        : {value: T}


export type GetSumType<Variants> = {
    [K in keyof Variants]: Variants[K] extends Variant<infer C>
        ? {kind: K} & ValueProp<GetCodecType<C>>
        : never
}[keyof Variants]


/**
 * Represents rust enum type.
 *
 * Because `enum` is a reserved keyword in TypeScript we'll name it as [sum](https://en.wikipedia.org/wiki/Tagged_union)
 */
export class SumCodec<Variants extends Record<string, Variant<any>>> implements Codec<GetSumType<Variants>> {
    encode: (sink: Sink, val: GetSumType<Variants>) => void
    decode: (src: Src) => GetSumType<Variants>

    constructor(
        public readonly discriminatorType: number,
        public readonly variants: Variants
    ) {
        this.generateVariantProps()
        this.encode = this.createEncode()
        this.decode = this.createDecode()
    }

    private generateVariantProps() {
        for (let name in this.variants) {
            (this as any)['_' + name] = this.variants[name].value
        }
    }

    private createEncode(): any {
        let body = `switch (val.kind) {\n`
        for (let name in this.variants) {
            let v = this.variants[name]
            body += `case ${JSON.stringify(name)}: {\n`
            body += `sink.${this.getDiscriminatorType()}(${this.getDiscLiteral(v.discriminator)})\n`
            if (v.value === unit) {
                // nothing to encode
            } else {
                body += `this${propAccess('_' + name)}.encode(sink, val.value)\n`
            }
            body += `return\n`
            body += '}\n'
        }
        body += `default: throw this.unexpectedKind(val.kind)\n`
        body += '}\n'
        return new Function('sink', body)
    }

    private createDecode(): any {
        let body = `let discriminator = src.${this.getDiscriminatorType()}()\n`
        body += `switch(discriminator) {\n`
        for (let name in this.variants) {
            let v = this.variants[name]
            let kind = JSON.stringify(name)
            body += `case ${this.getDiscLiteral(v.discriminator)}: {\n`
            if (v.value === unit) {
                body += `return {kind: ${kind}}\n`
            } else {
                body += `let value = this${propAccess('_' + name)}.decode(src)\n`
                body += `return {kind: ${kind}, value}\n`
            }
            body += '}\n'
        }
        body += `default: throw this.unexpectedDiscriminator(discriminator)\n`
        body += '}\n'
        return new Function('src', body)
    }

    private getDiscriminatorType(): 'u8' | 'u16' | 'u32' | 'u64' {
        switch(this.discriminatorType) {
            case 1:
                return 'u8'
            case 2:
                return 'u16'
            case 4:
                return 'u32'
            case 8:
                return 'u64'
            default:
                throw new Error(`Only 1, 2, 4 and 8 byte discriminators are supported, but got ${this.discriminatorType}`)
        }
    }

    private getDiscLiteral(index: number | bigint): string {
        if (this.discriminatorType > 4) {
            return index + 'n'
        } else {
            return index + ''
        }
    }

    private unexpectedKind(kind: unknown): Error {
        return new Error(`Got unexpected value kind - ${kind}`)
    }

    private unexpectedDiscriminator(d: number | bigint): Error {
        return new Error(`Got unexpected discriminator value: ${d} does not match any known case`)
    }
}
