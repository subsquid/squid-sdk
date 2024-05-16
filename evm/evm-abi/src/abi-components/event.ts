import type { Pretty } from '../indexed'
import { bytes32, Src, type Codec, type DecodedStruct, type Struct } from '@subsquid/evm-codec'

export interface EventRecord {
  topics: string[]
  data: string
}

type EventArgs = {
  [key: string]: Pretty<Codec<any> & { indexed?: boolean }>
}

export type IndexedCodecs<T extends EventArgs> = Pretty<{
  [K in keyof T]: T[K] extends { indexed: true; isDynamic: true } ? typeof bytes32 & { indexed: true } : T[K]
}>

export type EventParams<T extends AbiEvent<any>> = T extends AbiEvent<infer U> ? DecodedStruct<U> : never

export class UnexpectedEventError extends Error {
  constructor(expectedTopic: string, gotTopic: string, expectedTopicCount: number, gotTopicCount: number) {
    if (expectedTopic !== gotTopic) {
      super(`unexpected event signature. Expected: ${expectedTopic}, got: ${gotTopic}`)
    } else {
      super(`unexpected event topic count. Expected: ${expectedTopicCount}, got: ${gotTopicCount}`)
    }
    this.name = 'UnexpectedEventError';
  }
}

export class AbiEvent<const T extends EventArgs> {
  public readonly params: IndexedCodecs<T>
  private readonly topicCount: number
  constructor(public readonly topic: string, args: T) {
    const entries = Object.entries(args)
    this.params = Object.fromEntries(
      entries.map(
        ([key, arg]) =>
          [
            key,
            arg.indexed && arg.isDynamic
              ? {
                  ...bytes32,
                  isDynamic: true,
                  indexed: true,
                }
              : arg,
          ] as const,
      ),
    ) as IndexedCodecs<T>
    this.topicCount = entries.filter(([, arg]) => arg.indexed).length + 1
  }

  is(rec: EventRecord): boolean {
    return rec.topics[0] === this.topic && rec.topics.length === this.topicCount
  }

  decode(rec: EventRecord): DecodedStruct<IndexedCodecs<T>> {
    if (!this.is(rec)) {
      throw new UnexpectedEventError(this.topic, rec.topics[0], this.topicCount, rec.topics.length)
    }
    const src = new Src(Buffer.from(rec.data.slice(2), 'hex'))
    const result = {} as any
    let topicCounter = 1
    for (let i in this.params) {
      if (this.params[i].indexed) {
        const topic = rec.topics[topicCounter++]
        const topicSrc = new Src(Buffer.from(topic.slice(2), 'hex'))
        result[i] = this.params[i].decode(topicSrc)
      } else {
        result[i] = this.params[i].decode(src)
      }
    }
    return result
  }
}

export const event = <const T extends Struct>(topic: string, args: T) => new AbiEvent<T>(topic, args)
