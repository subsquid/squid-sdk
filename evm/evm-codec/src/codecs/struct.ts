import type {Codec, Sink, Src, Struct} from '../codec'
import {type Pretty, propAccess, propName} from '../util'

export type DecodedStruct<T extends Struct> = Pretty<{
    [K in keyof T]: T[K] extends Codec<any, infer U> ? U : never
}>

export type EncodedStruct<T extends Struct> = Pretty<{
    [K in keyof T]: T[K] extends Codec<infer U, any> ? U : never
}>

function slotsCount(codecs: readonly Codec<any>[]) {
    let count = 0
    for (const codec of codecs) {
        count += codec.slotsCount ?? 1
    }
    return count
}

export class StructCodec<const T extends Struct> implements Codec<EncodedStruct<T>, DecodedStruct<T>> {
    public readonly baseType = 'struct'
    public readonly isDynamic: boolean
    public readonly slotsCount: number
    public readonly childrenSlotsCount: number
    public readonly components: T

    readonly encodeInline: (sink: Sink, val: EncodedStruct<T>) => void
    readonly decodeInline: (src: Src) => DecodedStruct<T>

    readonly encode: (sink: Sink, val: EncodedStruct<T>) => void
    readonly decode: (src: Src) => DecodedStruct<T>

    constructor(components: T) {
        this.components = components
        const entries = Object.entries(components) as Array<[string, Codec<any>]>
        const codecs = entries.map(([, c]) => c)
        this.isDynamic = codecs.some((codec) => codec.isDynamic)
        this.childrenSlotsCount = slotsCount(codecs)
        this.slotsCount = this.isDynamic ? 1 : this.childrenSlotsCount

        this.encodeInline = this.createEncode(entries, false)
        this.decodeInline = this.createDecode(entries, false)
        this.encode = this.isDynamic ? this.createEncode(entries, true) : this.encodeInline
        this.decode = this.isDynamic ? this.createDecode(entries, true) : this.decodeInline
    }

    // JIT-generates a straight-line encode function. Each child's encode is bound once
    // at construction time to avoid property lookups on the hot path. When wrap=true
    // and the struct is dynamic, openTail/closeTail bracket the field writes so the
    // function can be used as a nested ABI field.
    private createEncode(
        entries: Array<[string, Codec<any>]>,
        wrap: boolean,
    ): (sink: Sink, val: EncodedStruct<T>) => void {
        const closureNames: string[] = []
        const closureValues: any[] = []
        let body = ''
        if (wrap && this.isDynamic) {
            body += `sink.openTail(${this.childrenSlotsCount});`
        }
        for (let i = 0; i < entries.length; i++) {
            const [key, child] = entries[i]
            const name = `__e${i}`
            closureNames.push(name)
            closureValues.push(child.encode.bind(child))
            body += `${name}(sink, val${propAccess(key)});`
        }
        if (wrap && this.isDynamic) {
            body += 'sink.closeTail();'
        }
        const fn = new Function(...closureNames, 'sink', 'val', body)
        return fn.bind(null, ...closureValues)
    }

    private createDecode(entries: Array<[string, Codec<any>]>, wrap: boolean): (src: Src) => DecodedStruct<T> {
        const closureNames: string[] = []
        const closureValues: any[] = []
        let body = ''
        if (wrap && this.isDynamic) {
            body += 'src = src.slice(src.u32());'
        }
        const fields: string[] = []
        for (let i = 0; i < entries.length; i++) {
            const [key, child] = entries[i]
            const name = `__d${i}`
            closureNames.push(name)
            closureValues.push(child.decode.bind(child))
            fields.push(`${propName(key)}:${name}(src)`)
        }
        body += `return {${fields.join(',')}};`
        const fn = new Function(...closureNames, 'src', body)
        return fn.bind(null, ...closureValues)
    }
}
