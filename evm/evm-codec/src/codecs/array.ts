import { Codec, WORD_SIZE } from '../codec'
import { Sink } from '../sink'
import { Src } from '../src'

export class ArrayCodec<const TIn, const TOut> implements Codec<readonly TIn[], readonly TOut[]> {
  public readonly isDynamic = true
  public readonly baseType = 'array'
  constructor(public readonly item: Codec<TIn, TOut>) {}

  encode(sink: Sink, val: TIn[]) {
    sink.newDynamicDataArea(val.length)
    for (let i = 0; i < val.length; i++) {
      this.item.encode(sink, val[i])
    }
    sink.increaseCurrentDataAreaSize(WORD_SIZE)
    sink.endCurrentDataArea()
  }

  decode(src: Src): TOut[] {
    const offset = src.u32()

    src.safeJump(offset, 'array')
    const len = src.u32()

    const tmpSrc = src.slice(offset + WORD_SIZE)
    const val = new Array(len)
    for (let i = 0; i < val.length; i++) {
      val[i] = this.item.decode(tmpSrc)
    }
    src.jumpBack()
    return val
  }
}

export class FixedSizeArrayCodec<const TIn, const TOut> implements Codec<readonly TIn[], readonly TOut[]> {
  public readonly baseType = 'array'
  public isDynamic: boolean
  public slotsCount: number

  constructor(public readonly item: Codec<TIn, TOut>, public readonly size: number) {
    this.isDynamic = item.isDynamic && size > 0
    this.slotsCount = this.isDynamic ? 1 : size
  }

  encode(sink: Sink, val: TIn[]) {
    if (val.length !== this.size) {
      throw new Error(`invalid array length: ${val.length}. Expected: ${this.size}`)
    }
    if (this.isDynamic) {
      return this.encodeDynamic(sink, val)
    }
    for (let i = 0; i < this.size; i++) {
      this.item.encode(sink, val[i])
    }
  }

  private encodeDynamic(sink: Sink, val: TIn[]) {
    sink.newStaticDataArea(this.size)
    for (let i = 0; i < val.length; i++) {
      this.item.encode(sink, val[i])
    }
    sink.endCurrentDataArea()
  }

  decode(src: Src): TOut[] {
    if (this.isDynamic) {
      return this.decodeDynamic(src)
    }
    let val = new Array(this.size)
    for (let i = 0; i < val.length; i++) {
      val[i] = this.item.decode(src)
    }
    return val
  }

  private decodeDynamic(src: Src): TOut[] {
    const offset = src.u32()
    const tmpSrc = src.slice(offset)
    let val = new Array(this.size)
    for (let i = 0; i < val.length; i++) {
      val[i] = this.item.decode(tmpSrc)
    }
    return val
  }
}
