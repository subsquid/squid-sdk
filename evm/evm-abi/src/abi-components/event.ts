import type { Simplify } from '../indexed'
import { bytes32, Sink, Src, StructCodec, type Codec, type DecodedStruct, type EncodedStruct, type Struct } from '@subsquid/evm-codec'
import {
  EventDecodingError,
  EventEmptyTopicsError,
  EventInvalidSignatureError,
  EventTopicCountMismatchError
} from '../errors'

export interface EventRecord {
  topics: string[]
  data: string
}

type EventArgs = {
  [key: string]: Codec<any> & { indexed?: boolean }
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

export class AbiEvent<const T extends EventArgs> {
  public readonly args: T
  public readonly params: IndexedCodecs<T>
  private readonly topicCount: number

  constructor(
    public readonly topic: string,
    args: StructCodec<T> | T,
  ) {
    this.args = args instanceof StructCodec ? args.components : args
    this.topicCount = 1
    this.params = {} as IndexedCodecs<T>
    for (const i in this.args) {
      const arg = this.args[i]
      this.params[i] = arg.indexed && arg.isDynamic
      ? {
          ...bytes32,
          isDynamic: true,
          indexed: true,
        } as any
      : arg

      if (arg.indexed) this.topicCount += 1
    }
  }

  is(rec: EventRecord): boolean {
    return this.checkTopicsCount(rec) && this.checkSignature(rec)
  }

  encode(args: EncodedStruct<IndexedCodecs<T>>): EventRecord {
    const topics: string[] = [this.topic]
    let dataSlots = 0
    for (const i in this.params) {
      if (!this.params[i].indexed) {
        dataSlots += this.params[i].slotsCount ?? 1
      }
    }
    const dataSink = new Sink(dataSlots)
    for (const i in this.params) {
      const codec = this.params[i]
      const val = (args as any)[i]
      if (codec.indexed) {
        const topicSink = new Sink(codec.slotsCount ?? 1)
        codec.encode(topicSink, val)
        topics.push('0x' + topicSink.result().toString('hex'))
      } else {
        codec.encode(dataSink, val)
      }
    }
    return { topics, data: '0x' + dataSink.result().toString('hex') }
  }

  decode(rec: EventRecord): DecodedStruct<IndexedCodecs<T>> {
    if (rec.topics.length == 0) {
      throw new EventEmptyTopicsError()
    }

    if (!this.checkTopicsCount(rec)) {
      throw new EventTopicCountMismatchError({targetCount: this.topicCount, count: rec.topics.length})
    }

    if (!this.checkSignature(rec)) {
      throw new EventInvalidSignatureError({targetSig: this.topic, sig: rec.topics[0]})
    }

    const src = new Src(Buffer.from(rec.data.slice(2), 'hex'))
    const result = {} as any
    let topicCounter = 1
    for (let i in this.params) {
      try {
        if (this.params[i].indexed) {
          const topic = rec.topics[topicCounter++]
          const topicSrc = new Src(Buffer.from(topic.slice(2), 'hex'))
          result[i] = this.params[i].decode(topicSrc)
        } else {
          result[i] = this.params[i].decode(src)
        }
      } catch (e: any) {
        throw new EventDecodingError(this.topic, i, rec.data, e.message)
      }
    }
    return result
  }

  private checkSignature(rec: EventRecord) {
    return rec.topics[0] === this.topic
  }

  private checkTopicsCount(rec: EventRecord) {
    return rec.topics.length === this.topicCount
  }
}

export const event = <const T extends Struct>(
  topic: string,
  args: StructCodec<T> | T,
) => new AbiEvent<T>(topic, args)
