import { bytes32 } from '../codecs/primitives'
import { Src } from '../src'
import { Codec, StructTypes } from '../codec'
import type { Pretty } from '../utils'

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

export class AbiEvent<const T extends EventArgs> {
  public readonly params: any
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
  }

  is(rec: EventRecord): boolean {
    return rec.topics[0] === this.topic
  }

  decode(rec: EventRecord): StructTypes<IndexedCodecs<T>> {
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
