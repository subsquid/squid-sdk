import type {Simplify} from '../indexed'
import {
    bytes32,
    HexSink,
    HexSrc,
    propAccess,
    propName,
    type Codec,
    type DecodedStruct,
    type EncodedStruct,
} from '@subsquid/evm-codec'
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

export type IndexedCodecs<T extends EventArgs> = Simplify<{
    [K in keyof T]: T[K] extends {indexed: true; isDynamic: true}
        ? Codec<Uint8Array | string, string> & {isDynamic: true; indexed: true}
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

function totalSlots(fields: NamedCodec[]): number {
    let c = 0
    for (const [, codec] of fields) c += codec.slotsCount ?? 1
    return c
}

export class AbiEvent<const T extends EventArgs> {
    public readonly args: T
    public readonly params: IndexedCodecs<T>
    private readonly topicCount: number
    private readonly topicFields: NamedCodec[]
    private readonly dataFields: NamedCodec[]

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

        for (const key in args) {
            const arg = args[key]
            const param = arg.indexed && arg.isDynamic ? ({...bytes32, isDynamic: true, indexed: true} as any) : arg
            this.params[key] = param
            if (arg.indexed) {
                order.push({key, kind: 'topic', idx: topicFields.length})
                topicFields.push([key, param])
            } else {
                order.push({key, kind: 'data', idx: dataFields.length})
                dataFields.push([key, param])
            }
        }

        this.topicFields = topicFields
        this.dataFields = dataFields
        this.topicCount = 1 + topicFields.length

        this.encodeInline = this.createEncodeInline(topicFields, dataFields)
        this.decodeInline = this.createDecodeInline(order, topicFields, dataFields)
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
     * in `filter`, the provided values are ABI-encoded to 32-byte hex words and
     * placed at the corresponding `topic1`/`topic2`/`topic3` position.
     * Multiple values per field are ORed by the node/gateway.
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
            const [name, codec] = this.topicFields[i]
            const values: Array<any> | undefined = (filter as any)[name]
            if (values == null) continue
            result[keys[i]] = values.map((val) => {
                const sink = new HexSink(1)
                codec.encode(sink, val)
                return sink.toString()
            })
        }

        return result
    }

    private createEncodeInline(
        topicFields: NamedCodec[],
        dataFields: NamedCodec[],
    ): (args: EncodedStruct<IndexedCodecs<T>>) => EventRecord {
        const names: string[] = ['TOPIC', 'HexSink']
        const values: any[] = [this.topic, HexSink]

        let body = 'const topics=[TOPIC];'

        for (let i = 0; i < topicFields.length; i++) {
            const [name, codec] = topicFields[i]
            const enc = `__et${i}`
            names.push(enc)
            values.push(codec.encode.bind(codec))
            const slots = codec.slotsCount ?? 1
            // `HexSink.toString()` returns the full `0x`-prefixed hex string,
            // which is exactly the format required for a log topic.
            body += `{const s=new HexSink(${slots});${enc}(s,args${propAccess(name)});topics.push(s.toString());}`
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
        topicFields: NamedCodec[],
        dataFields: NamedCodec[],
    ): (rec: EventRecord) => DecodedStruct<IndexedCodecs<T>> {
        const fieldNames = order.map((o) => o.key)
        const names: string[] = ['HexSrc', 'EventDecodingError', 'TOPIC', 'FIELD_NAMES']
        const values: any[] = [HexSrc, EventDecodingError, this.topic, fieldNames]

        // Topic and data fields go through the same `codec.decode(src)`
        // path; topics just get their own one-word `HexSrc` per field.
        for (let i = 0; i < topicFields.length; i++) {
            const codec = topicFields[i][1]
            names.push(`__dt${i}`)
            values.push(codec.decode.bind(codec))
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
                    : `__dt${o.idx}(new HexSrc(rec.topics[${o.idx + 1}]))`
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
