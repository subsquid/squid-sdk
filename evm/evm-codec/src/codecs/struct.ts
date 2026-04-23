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
  public readonly childrenSlotsCount: number
  public readonly components: T

  /**
   * "Inline" JIT: writes each field straight into the current static data
   * area of `sink`. Does NOT open a new dynamic tuple. Use this when the
   * containing context already is the outer tuple (top-level function
   * args, top-level event data, top-level eth_call return data, …).
   */
  readonly encodeInline: (sink: Sink, val: EncodedStruct<T>) => void

  /**
   * "Inline" JIT: reads each field straight from `src` without following
   * an outer tuple offset. Counterpart to {@link encodeInline}.
   */
  readonly decodeInline: (src: Src) => DecodedStruct<T>

  /**
   * Full JIT: behaves as the struct when used as a nested ABI field —
   * i.e. if the struct is dynamic, opens a new static data area /
   * follows its outer offset before delegating to the inline body.
   * Matches the {@link Codec} contract.
   */
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
    // No need to JIT a second wrapper when there is nothing to wrap.
    this.encode = this.isDynamic ? this.createEncode(entries, true) : this.encodeInline
    this.decode = this.isDynamic ? this.createDecode(entries, true) : this.decodeInline
  }

  /**
   * Generate a straight-line encode function for this struct. Each child's
   * `.encode` is bound once at construction and captured as a local
   * (`__eN`), so the hot path has no `this` indirection and no
   * `.encode`/`.components` property walk per field. When `wrap` is true
   * and the struct is dynamic, the body is also wrapped in
   * `newStaticDataArea`/`endCurrentDataArea` so the function can be used
   * as a nested ABI field.
   */
  private createEncode(
    entries: Array<[string, Codec<any>]>,
    wrap: boolean,
  ): (sink: Sink, val: EncodedStruct<T>) => void {
    const closureNames: string[] = []
    const closureValues: any[] = []
    let body = ''
    if (wrap && this.isDynamic) {
      body += `sink.newStaticDataArea(${this.childrenSlotsCount});\n`
    }
    for (let i = 0; i < entries.length; i++) {
      const [key, child] = entries[i]
      const name = `__e${i}`
      closureNames.push(name)
      closureValues.push(child.encode.bind(child))
      body += `${name}(sink, val${propAccess(key)});\n`
    }
    if (wrap && this.isDynamic) {
      body += `sink.endCurrentDataArea();\n`
    }
    const factory = new Function(...closureNames, `return function encode(sink, val){\n${body}};`)
    return factory(...closureValues)
  }

  private createDecode(
    entries: Array<[string, Codec<any>]>,
    wrap: boolean,
  ): (src: Src) => DecodedStruct<T> {
    const closureNames: string[] = []
    const closureValues: any[] = []
    let body = ''
    if (wrap && this.isDynamic) {
      body += `src = src.slice(src.u32());\n`
    }
    const fields: string[] = []
    for (let i = 0; i < entries.length; i++) {
      const [key, child] = entries[i]
      const name = `__d${i}`
      closureNames.push(name)
      closureValues.push(child.decode.bind(child))
      fields.push(`  ${propName(key)}: ${name}(src)`)
    }
    body += `return {\n${fields.join(',\n')}\n};\n`
    const factory = new Function(...closureNames, `return function decode(src){\n${body}};`)
    return factory(...closureValues)
  }
}
