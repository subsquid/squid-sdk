import type {Simplify} from '../indexed'
import {
  bytes32,
  bytesToHexString,
  hexToBytes,
  propAccess,
  propName,
  Sink,
  Src,
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

export type EventParams<T extends AbiEvent<any>> =
  T extends AbiEvent<infer U> ? DecodedStruct<IndexedCodecs<U>> : never

export type EventArgumentsInput<T extends AbiEvent<any>> =
  T extends AbiEvent<infer U> ? EncodedStruct<IndexedCodecs<U>> : never

function slotsCountOf(codecs: readonly Codec<any>[]): number {
  let c = 0
  for (const codec of codecs) c += codec.slotsCount ?? 1
  return c
}

/**
 * Append a closure-captured value to a parallel names/values pair. Returns
 * the chosen variable name so the caller can splice it straight into a
 * generated function body.
 */
function capture(names: string[], values: any[], name: string, value: unknown): string {
  names.push(name)
  values.push(value)
  return name
}

type FieldOrder = {key: string; kind: 'topic' | 'data'; idx: number}

export class AbiEvent<const T extends EventArgs> {
  public readonly args: T
  public readonly params: IndexedCodecs<T>
  private readonly topicCount: number

  /**
   * Ordered list of `(name, codec)` for indexed fields, in topic-slot
   * order (`rec.topics[i + 1]`). Kept alongside the JIT for the slow
   * per-field error-localization path.
   */
  private readonly topicFields: Array<[string, Codec<any>]>

  /**
   * Ordered list of `(name, codec)` for non-indexed fields, in the order
   * they appear in the event's `data` segment. Also used for slow-path
   * error localization.
   */
  private readonly dataFields: Array<[string, Codec<any>]>

  /**
   * JIT-compiled event encoder. The body inlines every topic-sink
   * creation + field write and every data-sink field write with no loops
   * and no `this` indirection on the hot path.
   */
  readonly encode: (args: EncodedStruct<IndexedCodecs<T>>) => EventRecord

  /**
   * JIT-compiled event decoder. Emits a single object literal whose
   * property order matches the original `args` definition; topic fields
   * each get their own `Src`, non-indexed fields share one `dataSrc`
   * that advances left-to-right.
   */
  readonly decode: (rec: EventRecord) => DecodedStruct<IndexedCodecs<T>>

  constructor(public readonly topic: string, args: T) {
    this.args = args
    this.params = {} as IndexedCodecs<T>

    const topicFields: Array<[string, Codec<any>]> = []
    const dataFields: Array<[string, Codec<any>]> = []
    const order: FieldOrder[] = []

    for (const key in args) {
      const arg = args[key]
      // Dynamic indexed fields are hashed by the emitter and only the
      // 32-byte keccak lands in the topic slot, so we swap the user-facing
      // codec for a bytes32-shaped one.
      const param = arg.indexed && arg.isDynamic
        ? ({...bytes32, isDynamic: true, indexed: true} as any)
        : arg
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

    this.encode = this.createEncode(topicFields, dataFields)
    this.decode = this.wrapDecode(this.createDecode(order, topicFields, dataFields))
  }

  is(rec: EventRecord): boolean {
    return this.checkTopicsCount(rec) && this.checkSignature(rec)
  }

  private createEncode(
    topicFields: Array<[string, Codec<any>]>,
    dataFields: Array<[string, Codec<any>]>,
  ): (args: EncodedStruct<IndexedCodecs<T>>) => EventRecord {
    const names: string[] = []
    const values: any[] = []
    capture(names, values, 'TOPIC', this.topic)
    capture(names, values, 'Sink', Sink)
    capture(names, values, 'bytesToHex', bytesToHexString)

    let body = 'const topics = [TOPIC];\n'

    for (let i = 0; i < topicFields.length; i++) {
      const [name, codec] = topicFields[i]
      const enc = capture(names, values, `__et${i}`, codec.encode.bind(codec))
      const slots = codec.slotsCount ?? 1
      body +=
        `{\n` +
        `  const s = new Sink(${slots});\n` +
        `  ${enc}(s, args${propAccess(name)});\n` +
        `  const b = s.result();\n` +
        `  topics.push('0x' + bytesToHex(b, 0, b.length));\n` +
        `}\n`
    }

    const dataChildrenSlots = slotsCountOf(dataFields.map(([, c]) => c))
    body += `const dataSink = new Sink(${dataChildrenSlots});\n`
    for (let i = 0; i < dataFields.length; i++) {
      const [name, codec] = dataFields[i]
      const enc = capture(names, values, `__ed${i}`, codec.encode.bind(codec))
      body += `${enc}(dataSink, args${propAccess(name)});\n`
    }
    body +=
      `const dataBytes = dataSink.result();\n` +
      `return { topics, data: '0x' + bytesToHex(dataBytes, 0, dataBytes.length) };\n`

    return new Function(...names, `return function encode(args){\n${body}};`)(...values)
  }

  private createDecode(
    order: FieldOrder[],
    topicFields: Array<[string, Codec<any>]>,
    dataFields: Array<[string, Codec<any>]>,
  ): (rec: EventRecord) => DecodedStruct<IndexedCodecs<T>> {
    const names: string[] = []
    const values: any[] = []
    capture(names, values, 'Src', Src)
    capture(names, values, 'hexBytes', hexToBytes)

    for (let i = 0; i < topicFields.length; i++) {
      capture(names, values, `__dt${i}`, topicFields[i][1].decode.bind(topicFields[i][1]))
    }
    for (let i = 0; i < dataFields.length; i++) {
      capture(names, values, `__dd${i}`, dataFields[i][1].decode.bind(dataFields[i][1]))
    }

    // Property-literal evaluation is left-to-right, so we can safely mix
    // topic decodes (each with their own Src) and data decodes (sharing
    // one advancing dataSrc) as long as the data decodes themselves
    // appear in dataFields order. `order[]` preserves the original
    // args-definition order, and data fields were appended to dataFields
    // in that same order, so the invariant holds.
    const entries = order.map((o) =>
      o.kind === 'topic'
        ? `  ${propName(o.key)}: __dt${o.idx}(new Src(hexBytes(rec.topics[${o.idx + 1}], 2)))`
        : `  ${propName(o.key)}: __dd${o.idx}(dataSrc)`,
    )

    const body =
      'const dataSrc = new Src(hexBytes(rec.data, 2));\n' +
      `return {\n${entries.join(',\n')}\n};\n`

    return new Function(...names, `return function decode(rec){\n${body}};`)(...values)
  }

  /**
   * Thin wrapper that handles shape validation + slow-path error
   * localization. The happy path is a single try with no extra
   * branches and delegates straight to the JIT.
   */
  private wrapDecode(
    jit: (rec: EventRecord) => DecodedStruct<IndexedCodecs<T>>,
  ): (rec: EventRecord) => DecodedStruct<IndexedCodecs<T>> {
    return (rec) => {
      if (rec.topics.length === 0) throw new EventEmptyTopicsError()
      if (rec.topics.length !== this.topicCount) {
        throw new EventTopicCountMismatchError({targetCount: this.topicCount, count: rec.topics.length})
      }
      if (rec.topics[0] !== this.topic) {
        throw new EventInvalidSignatureError({targetSig: this.topic, sig: rec.topics[0]})
      }
      try {
        return jit(rec)
      } catch (e: any) {
        throw this.locateDecodeError(rec, e as Error)
      }
    }
  }

  private locateDecodeError(rec: EventRecord, original: Error): Error {
    for (let t = 0; t < this.topicFields.length; t++) {
      const [name, codec] = this.topicFields[t]
      try {
        codec.decode(new Src(hexToBytes(rec.topics[t + 1], 2)))
      } catch (e: any) {
        return new EventDecodingError(this.topic, name, rec.data, e.message)
      }
    }
    const slow = new Src(hexToBytes(rec.data, 2))
    for (const [name, codec] of this.dataFields) {
      try {
        codec.decode(slow)
      } catch (e: any) {
        return new EventDecodingError(this.topic, name, rec.data, e.message)
      }
    }
    return original
  }

  private checkSignature(rec: EventRecord) {
    return rec.topics[0] === this.topic
  }

  private checkTopicsCount(rec: EventRecord) {
    return rec.topics.length === this.topicCount
  }
}

export const event = <const T extends EventArgs>(topic: string, args: T) =>
  new AbiEvent<T>(topic, args)
