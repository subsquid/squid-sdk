import {Codec, Struct, DecodedStruct, EncodedStruct} from '../codec'
import { Sink } from '../sink'
import { Src } from '../src'

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
  private readonly childrenSlotsCount: number
  private readonly components: T

  constructor(components: T) {
    this.components = components
    const codecs = Object.values(components)
    this.isDynamic = codecs.some((codec) => codec.isDynamic)
    this.childrenSlotsCount = slotsCount(codecs)
    if (this.isDynamic) {
      this.slotsCount = 1
    } else {
      this.slotsCount = this.childrenSlotsCount
    }
  }

  public encode(sink: Sink, val: EncodedStruct<T>): void {
    if (this.isDynamic) {
      this.encodeDynamic(sink, val)
      return
    }
    for (let i in this.components) {
      let prop = this.components[i]
      prop.encode(sink, val[i])
    }
  }

  private encodeDynamic(sink: Sink, val: EncodedStruct<T>): void {
    sink.newStaticDataArea(this.childrenSlotsCount)
    for (let i in this.components) {
      let prop = this.components[i]
      prop.encode(sink, val[i])
    }
    sink.endCurrentDataArea()
  }

  public decode(src: Src): DecodedStruct<T> {
    if (this.isDynamic) {
      return this.decodeDynamic(src)
    }
    let result: any = {}
    for (let i in this.components) {
      let prop = this.components[i]
      result[i] = prop.decode(src)
    }
    return result
  }

  private decodeDynamic(src: Src): DecodedStruct<T> {
    let result: any = {}

    const offset = src.u32()
    const tmpSrc = src.slice(offset)
    for (let i in this.components) {
      let prop = this.components[i]
      result[i] = prop.decode(tmpSrc)
    }
    return result
  }
}
