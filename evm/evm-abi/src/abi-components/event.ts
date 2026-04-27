import type {Simplify} from '../indexed'
import {
    HexSink,
    HexSrc,
    propAccess,
    propName,
    type Codec,
    type DecodedStruct,
    type EncodedStruct,
} from '@subsquid/evm-codec'
import keccak256 from 'keccak256'
import {
    EventDecodingError,
    EventEmptyTopicsError,
    EventInvalidSignatureError,
    EventTopicCountMismatchError,
} from '../errors'

export interface EventRecord {
    topics: string[]
    data: string
}

type EventArgs = {
    [key: string]: Codec<any> & {indexed?: boolean}
}

/**
 * Indexed event parameters of "reference" types (`string`, `bytes`, any array,
 * any struct) are not stored directly in the topic — per the Solidity ABI spec
 * the topic holds `keccak256` of an encoding of the value. So while these
 * fields accept the same input shape as their non-indexed counterparts on
 * `encode` / `topicSelection` (the library hashes for you), `decode` can only
 * recover the 32-byte hash word, hence the output type collapses to `string`.
 */
export type IndexedCodecs<T extends EventArgs> = Simplify<{
    [K in keyof T]: T[K] extends {indexed: true} & ({isDynamic: true} | {baseType: 'array' | 'struct'})
        ? T[K] extends Codec<infer In, any>
            ? Codec<In, string> & {isDynamic: true; indexed: true}
            : never
        : T[K]
}>

export type EventParams<T extends AbiEvent<any>> = T extends AbiEvent<infer U> ? DecodedStruct<IndexedCodecs<U>> : never

export type EventArgumentsInput<T extends AbiEvent<any>> = T extends AbiEvent<infer U>
    ? EncodedStruct<IndexedCodecs<U>>
    : never

/** Return type of `AbiEvent.topicSelection()` — compatible with `LogRequestWhere`. */
export type TopicFilter = {
    topic0: string[]
    topic1?: string[]
    topic2?: string[]
    topic3?: string[]
}

/** Input type for `AbiEvent.topicSelection()`: one optional array of values per indexed field. */
export type IndexedTopicFilter<T extends EventArgs> = {
    [K in keyof T as T[K] extends {indexed: true} ? K : never]?: Array<
        IndexedCodecs<T>[K] extends Codec<infer TIn, any> ? TIn : never
    >
}

type NamedCodec = [string, Codec<any>]
type FieldOrder = {key: string; kind: 'topic' | 'data'; idx: number}

/** Per-field topic encoder (user value → 32-byte hex word). */
type TopicEncoder = (val: any) => string
/** Per-field topic decoder (one-topic hex word → decoded value). */
type TopicDecoder = (topic: string) => unknown

function totalSlots(fields: NamedCodec[]): number {
    let c = 0
    for (const [, codec] of fields) c += codec.slotsCount ?? 1
    return c
}

/** True when `codec` represents a Solidity reference type (must be hashed when indexed). */
function isReferenceType(codec: Codec<any>): boolean {
    return codec.isDynamic || codec.baseType === 'array' || codec.baseType === 'struct'
}

function utf8Bytes(s: string): Buffer {
    return Buffer.from(s, 'utf8')
}

function hexToBytes(hex: string): Buffer {
    const h = hex.startsWith('0x') || hex.startsWith('0X') ? hex.slice(2) : hex
    return Buffer.from(h, 'hex')
}

function toRawBytes(val: Uint8Array | string): Buffer {
    if (typeof val === 'string') return hexToBytes(val)
    return Buffer.from(val.buffer, val.byteOffset, val.byteLength)
}

function padTo32(b: Buffer): Buffer {
    const rem = b.length % 32
    if (rem === 0) return b
    return Buffer.concat([b, Buffer.alloc(32 - rem)])
}

/**
 * Encode `val` per the spec's "encoding of an indexed event parameter" rules.
 * This is the byte stream that gets fed into `keccak256` for a top-level
 * indexed reference value, and (after padding to 32 bytes) the per-element
 * stream when `val` lives inside an indexed array or struct.
 *
 *   - `string` / dynamic `bytes`: raw value bytes, no length prefix.
 *   - arrays / structs: concatenation of `padTo32(encodeForTopic(child))`,
 *     no offsets, no length prefix.
 *   - value types (incl. `bytesN` with N ≤ 32): the regular 32-byte ABI
 *     word produced by the codec.
 */
function encodeForTopic(codec: Codec<any>, val: any): Buffer {
    if (codec.baseType === 'string') {
        return utf8Bytes(val)
    }
    if (codec.baseType === 'bytes' && codec.isDynamic) {
        return toRawBytes(val)
    }
    if (codec.baseType === 'array') {
        const item: Codec<any> = (codec as any).item
        const parts: Buffer[] = []
        for (const it of val as readonly any[]) {
            parts.push(padTo32(encodeForTopic(item, it)))
        }
        return Buffer.concat(parts)
    }
    if (codec.baseType === 'struct') {
        const components: Record<string, Codec<any>> = (codec as any).components
        const parts: Buffer[] = []
        for (const k in components) {
            parts.push(padTo32(encodeForTopic(components[k], (val as any)[k])))
        }
        return Buffer.concat(parts)
    }
    // Value types: regular 32-byte ABI word.
    const sink = new HexSink(codec.slotsCount ?? 1)
    codec.encode(sink, val)
    return hexToBytes(sink.toString())
}

/** Hash an indexed reference-type value into a `0x`-prefixed 32-byte topic word. */
function hashIndexedValue(codec: Codec<any>, val: any): string {
    return `0x${(keccak256(encodeForTopic(codec, val)) as Buffer).toString('hex')}`
}

/** Encode an indexed value-type field directly into a 32-byte topic word. */
function encodeValueTopic(codec: Codec<any>, val: any): string {
    const sink = new HexSink(1)
    codec.encode(sink, val)
    return sink.toString()
}

export class AbiEvent<const T extends EventArgs> {
    public readonly args: T
    public readonly params: IndexedCodecs<T>
    private readonly topicCount: number
    private readonly topicFields: NamedCodec[]
    private readonly dataFields: NamedCodec[]
    private readonly topicEncoders: TopicEncoder[]
    private readonly topicDecoders: TopicDecoder[]

    private readonly encodeInline: (args: EncodedStruct<IndexedCodecs<T>>) => EventRecord
    private readonly decodeInline: (rec: EventRecord) => DecodedStruct<IndexedCodecs<T>>

    constructor(
        public readonly topic: string,
        args: T,
    ) {
        this.args = args
        this.params = {} as IndexedCodecs<T>

        const topicFields: NamedCodec[] = []
        const dataFields: NamedCodec[] = []
        const order: FieldOrder[] = []
        const topicEncoders: TopicEncoder[] = []
        const topicDecoders: TopicDecoder[] = []

        for (const key in args) {
            const arg = args[key]

            if (arg.indexed) {
                // Per the Solidity ABI spec, indexed reference-type arguments
                // (`string`, `bytes`, arrays — including fixed-size — and
                // structs) are stored in the topic as `keccak256(encoding)`
                // rather than the value itself; everything else fits in a
                // single 32-byte word and is encoded directly.
                if (isReferenceType(arg)) {
                    topicEncoders.push((val) => hashIndexedValue(arg, val))
                    // Decoding is lossy by construction: we only have the
                    // hash word, so we hand it back as a `0x`-prefixed hex
                    // string. `params[key]` reflects that reduced output type.
                    topicDecoders.push((t) => t)
                    this.params[key] = {
                        encode(sink: any, val: any) {
                            sink.staticBytes(32, hashIndexedValue(arg, val))
                        },
                        decode(src: any) {
                            return src.staticBytesHex(32)
                        },
                        isDynamic: true,
                        baseType: 'bytes',
                        indexed: true,
                    } as any
                } else {
                    topicEncoders.push((val) => encodeValueTopic(arg, val))
                    const decode = arg.decode.bind(arg)
                    topicDecoders.push((t) => decode(new HexSrc(t)))
                    this.params[key] = arg as any
                }
                order.push({key, kind: 'topic', idx: topicFields.length})
                topicFields.push([key, arg])
            } else {
                this.params[key] = arg as any
                order.push({key, kind: 'data', idx: dataFields.length})
                dataFields.push([key, arg])
            }
        }

        this.topicFields = topicFields
        this.dataFields = dataFields
        this.topicEncoders = topicEncoders
        this.topicDecoders = topicDecoders
        this.topicCount = 1 + topicFields.length

        this.encodeInline = this.createEncodeInline(topicEncoders, dataFields)
        this.decodeInline = this.createDecodeInline(order, topicDecoders, dataFields)
    }

    encode(args: EncodedStruct<IndexedCodecs<T>>): EventRecord {
        return this.encodeInline(args)
    }

    decode(rec: EventRecord): DecodedStruct<IndexedCodecs<T>> {
        if (rec.topics.length === 0) throw new EventEmptyTopicsError()
        if (rec.topics.length !== this.topicCount) {
            throw new EventTopicCountMismatchError({targetCount: this.topicCount, count: rec.topics.length})
        }
        if (rec.topics[0] !== this.topic) {
            throw new EventInvalidSignatureError({targetSig: this.topic, sig: rec.topics[0]})
        }
        return this.decodeInline(rec)
    }

    is(rec: EventRecord): boolean {
        return this.checkTopicsCount(rec) && this.checkSignature(rec)
    }

    /**
     * Build a topic filter compatible with `LogRequestWhere`.
     *
     * `topic0` is always set to `[this.topic]`. For each indexed field present
     * in `filter`, the provided values are encoded to 32-byte hex topic words
     * (hashed for reference types per the Solidity ABI spec; ABI-encoded
     * directly for value types) and placed at the corresponding
     * `topic1`/`topic2`/`topic3` position. Multiple values per field are ORed
     * by the node/gateway.
     *
     * @example
     * // Subscribe to all Transfer events
     * processor.addLog({ where: { address: [CONTRACT], ...TRANSFER.topicSelection() } })
     *
     * // Subscribe to Transfers to a specific address
     * processor.addLog({ where: { address: [CONTRACT], ...TRANSFER.topicSelection({ to: ['0x1234...'] }) } })
     */
    topicSelection(filter?: IndexedTopicFilter<T>): TopicFilter {
        const result: TopicFilter = {topic0: [this.topic]}
        if (!filter) return result

        const keys = ['topic1', 'topic2', 'topic3'] as const
        for (let i = 0; i < this.topicFields.length; i++) {
            const [name] = this.topicFields[i]
            const values: Array<any> | undefined = (filter as any)[name]
            if (values == null) continue
            const enc = this.topicEncoders[i]
            result[keys[i]] = values.map(enc)
        }

        return result
    }

    private createEncodeInline(
        topicEncoders: TopicEncoder[],
        dataFields: NamedCodec[],
    ): (args: EncodedStruct<IndexedCodecs<T>>) => EventRecord {
        const names: string[] = ['TOPIC', 'HexSink']
        const values: any[] = [this.topic, HexSink]

        let body = 'const topics=[TOPIC];'

        for (let i = 0; i < topicEncoders.length; i++) {
            const [name] = this.topicFields[i]
            const enc = `__et${i}`
            names.push(enc)
            values.push(topicEncoders[i])
            // `enc(val)` returns a fully formatted `0x`-prefixed 32-byte
            // topic word — either an ABI-encoded value or a `keccak256` hash.
            body += `topics.push(${enc}(args${propAccess(name)}));`
        }

        body += `const dataSink=new HexSink(${totalSlots(dataFields)});`
        for (let i = 0; i < dataFields.length; i++) {
            const [name, codec] = dataFields[i]
            const enc = `__ed${i}`
            names.push(enc)
            values.push(codec.encode.bind(codec))
            body += `${enc}(dataSink,args${propAccess(name)});`
        }
        body += 'return{topics,data:dataSink.toString()};'

        const fn = new Function(...names, 'args', body)
        return fn.bind(null, ...values)
    }

    private createDecodeInline(
        order: FieldOrder[],
        topicDecoders: TopicDecoder[],
        dataFields: NamedCodec[],
    ): (rec: EventRecord) => DecodedStruct<IndexedCodecs<T>> {
        const fieldNames = order.map((o) => o.key)
        const names: string[] = ['HexSrc', 'EventDecodingError', 'TOPIC', 'FIELD_NAMES']
        const values: any[] = [HexSrc, EventDecodingError, this.topic, fieldNames]

        for (let i = 0; i < topicDecoders.length; i++) {
            names.push(`__dt${i}`)
            values.push(topicDecoders[i])
        }
        for (let i = 0; i < dataFields.length; i++) {
            const codec = dataFields[i][1]
            names.push(`__dd${i}`)
            values.push(codec.decode.bind(codec))
        }

        let body = 'let __i=0;try{'
        if (dataFields.length > 0) body += 'const dataSrc=new HexSrc(rec.data);'
        const fields: string[] = []
        for (let n = 0; n < order.length; n++) {
            const o = order[n]
            const reader =
                o.kind === 'data'
                    ? `__dd${o.idx}(dataSrc)`
                    : `__dt${o.idx}(rec.topics[${o.idx + 1}])`
            body += `const __v${n}=${reader};__i=${n + 1};`
            fields.push(`${propName(o.key)}:__v${n}`)
        }
        body += `return{${fields.join(',')}};`
        body += '}catch(e){throw new EventDecodingError(TOPIC,FIELD_NAMES[__i],rec.data,e.message);}'

        const fn = new Function(...names, 'rec', body)
        return fn.bind(null, ...values)
    }

    private checkSignature(rec: EventRecord) {
        return rec.topics[0] === this.topic
    }

    private checkTopicsCount(rec: EventRecord) {
        return rec.topics.length === this.topicCount
    }
}

export const event = <const T extends EventArgs>(topic: string, args: T) => new AbiEvent<T>(topic, args)
