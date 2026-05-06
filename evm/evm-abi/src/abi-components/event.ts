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
const U256_BASE = 1n << 256n
const U256_MAX = U256_BASE - 1n
const I256_MIN = -(1n << 255n)
const I256_MAX = (1n << 255n) - 1n

/** True when `codec` represents a Solidity reference type (must be hashed when indexed). */
function isReferenceType(codec: Codec<any>): boolean {
    return codec.isDynamic || codec.baseType === 'array' || codec.baseType === 'struct'
}

function hexToBytes(hex: string): Buffer {
    const h = hex.startsWith('0x') || hex.startsWith('0X') ? hex.slice(2) : hex
    return Buffer.from(h, 'hex')
}

function toRawBytes(val: Uint8Array | string): Buffer {
    if (typeof val === 'string') return hexToBytes(val)
    return Buffer.from(val.buffer, val.byteOffset, val.byteLength)
}

class TopicSink {
    private pos = 0
    private buf = Buffer.allocUnsafe(256)

    result(): Buffer {
        return this.buf.subarray(0, this.pos)
    }

    mark(): number {
        return this.pos
    }

    raw(bytes: Uint8Array): void {
        this.reserve(bytes.length)
        this.buf.set(bytes, this.pos)
        this.pos += bytes.length
    }

    utf8(val: string): void {
        const len = Buffer.byteLength(val, 'utf8')
        this.reserve(len)
        this.buf.write(val, this.pos, len, 'utf8')
        this.pos += len
    }

    u8(val: number): void {
        this.u256(BigInt(val))
    }

    i8(val: number): void {
        this.i256(BigInt(val))
    }

    u16(val: number): void {
        this.u256(BigInt(val))
    }

    i16(val: number): void {
        this.i256(BigInt(val))
    }

    u32(val: number): void {
        this.u256(BigInt(val))
    }

    i32(val: number): void {
        this.i256(BigInt(val))
    }

    u64(val: bigint): void {
        this.u256(val)
    }

    i64(val: bigint): void {
        this.i256(val)
    }

    u128(val: bigint): void {
        this.u256(val)
    }

    i128(val: bigint): void {
        this.i256(val)
    }

    u256(val: bigint): void {
        if (val < 0n || val > U256_MAX) throw new Error(`${val} is out of bounds for uint256`)
        this.word(val)
    }

    i256(val: bigint): void {
        if (val < I256_MIN || val > I256_MAX) throw new Error(`${val} is out of bounds for int256`)
        this.word(val >= 0n ? val : val + U256_BASE)
    }

    bool(val: boolean): void {
        this.u8(val ? 1 : 0)
    }

    address(val: string): void {
        if (val.length === 42 && val.charCodeAt(0) === 0x30 && val.charCodeAt(1) === 0x78) {
            this.reserve(32)
            this.buf.fill(0, this.pos, this.pos + 12)
            this.buf.write(val.slice(2), this.pos + 12, 20, 'hex')
            this.pos += 32
            return
        }
        this.u256(BigInt(val))
    }

    staticBytes(len: number, val: Uint8Array | string): void {
        if (len > 32) throw new Error(`bytes${len} is not a valid type`)
        const bytes = typeof val === 'string' ? hexToBytes(val) : val
        if (bytes.length > len) throw new Error(`invalid data size for bytes${len}`)
        this.reserve(32)
        this.buf.fill(0, this.pos, this.pos + 32)
        this.buf.set(bytes, this.pos)
        this.pos += 32
    }

    bytes(): never {
        throw new Error('dynamic bytes must be encoded by topic encoder')
    }

    string(): never {
        throw new Error('dynamic string must be encoded by topic encoder')
    }

    openTail(): never {
        throw new Error('dynamic ABI tails are not valid in topic encoder')
    }

    openArray(): never {
        throw new Error('dynamic ABI arrays are not valid in topic encoder')
    }

    closeTail(): never {
        throw new Error('dynamic ABI tails are not valid in topic encoder')
    }

    toString(): string {
        return `0x${this.result().toString('hex')}`
    }

    padFrom(pos: number): void {
        const rem = (this.pos - pos) % 32
        if (rem === 0) return
        const pad = 32 - rem
        this.reserve(pad)
        this.buf.fill(0, this.pos, this.pos + pad)
        this.pos += pad
    }

    private word(val: bigint): void {
        let hex = val.toString(16)
        if (hex.length % 2) hex = `0${hex}`
        if (hex.length > 64) throw new Error(`hex string too long for one word: ${hex.length} chars`)
        this.reserve(32)
        this.buf.fill(0, this.pos, this.pos + 32)
        this.buf.write(hex, this.pos + 32 - hex.length / 2, hex.length / 2, 'hex')
        this.pos += 32
    }

    private reserve(size: number): void {
        if (this.buf.length - this.pos >= size) return
        let cap = this.buf.length
        while (cap - this.pos < size) cap *= 2
        const buf = Buffer.allocUnsafe(cap)
        this.buf.copy(buf, 0, 0, this.pos)
        this.buf = buf
    }
}

function addTopicByteHelpers(names: string[], values: any[]) {
    names.push('TopicSink', 'toRawBytes', 'keccak256')
    values.push(TopicSink, toRawBytes, keccak256)
}

function topicBytesSink(codec: Codec<any>, val: string, sink: string, names: string[], values: any[]): string {
    if (codec.baseType === 'string') {
        return `${sink}.utf8(${val});`
    }
    if (codec.baseType === 'bytes' && codec.isDynamic) {
        return `${sink}.raw(toRawBytes(${val}));`
    }
    if (codec.baseType === 'array') {
        const item: Codec<any> = (codec as any).item
        return `for(let __i=0;__i<${val}.length;__i++){const __it=${val}[__i];const __p=${sink}.mark();${topicBytesSink(item, '__it', sink, names, values)}${sink}.padFrom(__p);}`
    }
    if (codec.baseType === 'struct') {
        const components: Record<string, Codec<any>> = (codec as any).components
        let body = ''
        for (const k in components) {
            body += `{const __p=${sink}.mark();${topicBytesSink(components[k], `${val}${propAccess(k)}`, sink, names, values)}${sink}.padFrom(__p);}`
        }
        return body
    }

    const enc = `__te${values.length}`
    names.push(enc)
    values.push(codec.encode.bind(codec))
    return `${enc}(${sink},${val});`
}

export class AbiEvent<const T extends EventArgs> {
    public readonly args: T
    private readonly topicCount: number

    private readonly encodeInline: (args: EncodedStruct<IndexedCodecs<T>>) => EventRecord
    private readonly decodeInline: (rec: EventRecord) => DecodedStruct<IndexedCodecs<T>>
    private readonly topicSelectionInline: (filter?: IndexedTopicFilter<T>) => TopicFilter

    constructor(
        public readonly topic: string,
        args: T,
    ) {
        this.args = args

        const topicFields: NamedCodec[] = []
        const dataFields: NamedCodec[] = []

        for (const key in args) {
            const arg = args[key]

            if (arg.indexed) {
                topicFields.push([key, arg])
            } else {
                dataFields.push([key, arg])
            }
        }

        this.topicCount = 1 + topicFields.length
        this.encodeInline = this.createEncodeInline(topicFields, dataFields)
        this.decodeInline = this.createDecodeInline(topicFields, dataFields)
        this.topicSelectionInline = this.createTopicSelectionInline(topicFields)
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
        return this.topicSelectionInline(filter)
    }

    private createTopicSelectionInline(topicFields: NamedCodec[]): (filter?: IndexedTopicFilter<T>) => TopicFilter {
        const keys = ['topic1', 'topic2', 'topic3'] as const
        const names: string[] = ['TOPIC', 'HexSink']
        const values: any[] = [this.topic, HexSink]
        if (topicFields.some(([, codec]) => isReferenceType(codec))) {
            addTopicByteHelpers(names, values)
        }

        let body = 'const result={topic0:[TOPIC]};if(!filter)return result;'
        for (let i = 0; i < topicFields.length; i++) {
            const [name, codec] = topicFields[i]
            const vals = `__v${i}`
            body += `const ${vals}=filter${propAccess(name)};`
            body += `if(${vals}!=null){const __r${i}=new Array(${vals}.length);for(let __i=0;__i<${vals}.length;__i++){const __v=${vals}[__i];`
            if (isReferenceType(codec)) {
                const sink = `__ts${i}`
                body += `const ${sink}=new TopicSink();${topicBytesSink(codec, '__v', sink, names, values)}__r${i}[__i]=\`0x\${keccak256(${sink}.result()).toString('hex')}\`;`
            } else {
                const enc = `__te${i}`
                names.push(enc)
                values.push(codec.encode.bind(codec))
                body += `const __s=new HexSink(1);${enc}(__s,__v);__r${i}[__i]=__s.toString();`
            }
            body += `}result.${keys[i]}=__r${i};}`
        }
        body += 'return result;'

        const fn = new Function(...names, 'filter', body)
        return fn.bind(null, ...values)
    }

    private createEncodeInline(
        topicFields: NamedCodec[],
        dataFields: NamedCodec[],
    ): (args: EncodedStruct<IndexedCodecs<T>>) => EventRecord {
        const names: string[] = ['TOPIC', 'HexSink']
        const values: any[] = [this.topic, HexSink]
        if (topicFields.some(([, codec]) => isReferenceType(codec))) {
            addTopicByteHelpers(names, values)
        }

        const topics = ['TOPIC']
        let body = ''

        for (let i = 0; i < topicFields.length; i++) {
            const [name, codec] = topicFields[i]
            const topic = `__t${i}`
            if (isReferenceType(codec)) {
                const sink = `__ts${i}`
                body += `const ${sink}=new TopicSink();${topicBytesSink(codec, `args${propAccess(name)}`, sink, names, values)}const ${topic}=\`0x\${keccak256(${sink}.result()).toString('hex')}\`;`
            } else {
                const enc = `__te${i}`
                names.push(enc)
                values.push(codec.encode.bind(codec))
                body += `const __s${i}=new HexSink(1);${enc}(__s${i},args${propAccess(name)});const ${topic}=__s${i}.toString();`
            }
            topics.push(topic)
        }

        let dataSlots = 0
        for (const [, codec] of dataFields) dataSlots += codec.slotsCount ?? 1

        body += `const topics=[${topics.join(',')}];`
        body += `const dataSink=new HexSink(${dataSlots});`
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
        topicFields: NamedCodec[],
        dataFields: NamedCodec[],
    ): (rec: EventRecord) => DecodedStruct<IndexedCodecs<T>> {
        const fieldNames = topicFields.map(([key]) => key).concat(dataFields.map(([key]) => key))
        // For each decoded field: the 1-based topics[] index when the field is
        // indexed, or -1 when it lives in rec.data. Used by the catch block to
        // report the actual bytes that failed.
        const fieldTopicIdx = topicFields.map((_, i) => i + 1).concat(dataFields.map(() => -1))
        const names: string[] = ['HexSrc', 'EventDecodingError', 'TOPIC', 'FIELD_NAMES', 'FIELD_TOPIC_IDX']
        const values: any[] = [HexSrc, EventDecodingError, this.topic, fieldNames, fieldTopicIdx]

        const topicReaders: string[] = []
        for (let i = 0; i < topicFields.length; i++) {
            const codec = topicFields[i][1]
            if (isReferenceType(codec)) {
                topicReaders.push(`rec.topics[${i + 1}]`)
            } else {
                names.push(`__dt${i}`)
                values.push(codec.decode.bind(codec))
                topicReaders.push(`__dt${i}(new HexSrc(rec.topics[${i + 1}]))`)
            }
        }
        for (let i = 0; i < dataFields.length; i++) {
            names.push(`__dd${i}`)
            values.push(dataFields[i][1].decode.bind(dataFields[i][1]))
        }

        let body = 'let __i=0;try{'
        if (dataFields.length > 0) body += 'const dataSrc=new HexSrc(rec.data);'
        const fields: string[] = []
        let n = 0
        for (let i = 0; i < topicFields.length; i++, n++) {
            const [key] = topicFields[i]
            body += `const __v${n}=${topicReaders[i]};__i=${n + 1};`
            fields.push(`${propName(key)}:__v${n}`)
        }
        for (let i = 0; i < dataFields.length; i++, n++) {
            const [key] = dataFields[i]
            body += `const __v${n}=__dd${i}(dataSrc);__i=${n + 1};`
            fields.push(`${propName(key)}:__v${n}`)
        }
        body += `return{${fields.join(',')}};`
        body += '}catch(e){const __ti=FIELD_TOPIC_IDX[__i];const __raw=__ti>=0?rec.topics[__ti]:rec.data;throw new EventDecodingError(TOPIC,FIELD_NAMES[__i],__raw,e.message);}'

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
