import { Codec, Struct, DecodedStruct, EncodedStruct } from '../codec'
import { Sink } from '../sink'
import { Src } from '../src'
import { propAccess, propName } from '../util'

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
  public readonly components: T
  private readonly childrenSlotsCount: number

  encode: (sink: Sink, val: EncodedStruct<T>) => void
  decode: (src: Src) => DecodedStruct<T>

  constructor(components: T) {
    this.components = components
    const codecs = Object.values(components)
    this.isDynamic = codecs.some((codec) => codec.isDynamic)
    this.childrenSlotsCount = slotsCount(codecs)
    this.slotsCount = this.isDynamic ? 1 : this.childrenSlotsCount

    this.encode = this.createEncode()
    this.decode = this.createDecode()
  }

  private createEncode(): any {
    let body = ''
    if (this.isDynamic) {
      body += `sink.newStaticDataArea(${this.childrenSlotsCount})\n`
    }
    for (let key in this.components) {
      let a = propAccess(key)
      body += `this.components${a}.encode(sink, val${a})\n`
    }
    if (this.isDynamic) {
      body += `sink.endCurrentDataArea()\n`
    }
    return new Function('sink', 'val', body)
  }

  private createDecode(): any {
    let body = ''
    if (this.isDynamic) {
      body += `var offset = src.u32()\n`
      body += `src = src.slice(offset)\n`
    }
    body += 'return {\n'
    for (let key in this.components) {
      body += `${propName(key)}: this.components${propAccess(key)}.decode(src),\n`
    }
    body += '}\n'
    return new Function('src', body)
  }
}
