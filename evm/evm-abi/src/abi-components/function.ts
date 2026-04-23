import assert from 'node:assert'
import {
  type Codec,
  type Struct,
  type DecodedStruct,
  type EncodedStruct,
  Sink,
  Src,
  StructCodec,
} from '@subsquid/evm-codec'
import {FunctionInvalidSignatureError, FunctionResultDecodeError, FunctionCalldataDecodeError} from '../errors'

export interface CallRecord {
  input: string
}

function slotsCount(codecs: readonly Codec<any>[]) {
  let count = 0
  for (const codec of codecs) {
    count += codec.slotsCount ?? 1
  }
  return count
}

export type FunctionReturn<T extends AbiFunction<any, any>> = T extends AbiFunction<any, infer R>
  ? R extends Codec<any, infer U> ? U : R extends Struct ? DecodedStruct<R> : void
  : never

export type FunctionArguments<T extends AbiFunction<any, any>> =
  T extends AbiFunction<infer U, any> ? EncodedStruct<U> : never

export class AbiFunction<const T extends Struct, const R extends Codec<any> | Struct | undefined> {
  readonly #selector: Buffer
  public readonly args: T
  private readonly slotsCount: number

  public get sighash() {
    return this.selector
  }

  constructor(
    public selector: string,
    args: StructCodec<T> | T,
    public readonly returnType?: R,
    public isView = false,
  ) {
    assert(selector.startsWith('0x'), 'selector must start with 0x')
    assert(selector.length === 10, 'selector must be 4 bytes long')
    this.#selector = Buffer.from(selector.slice(2), 'hex')
    this.args = args instanceof StructCodec ? args.components : args
    this.slotsCount = slotsCount(Object.values(this.args))
  }

  is(calldata: string | CallRecord) {
    return this.checkSignature(typeof calldata === 'string' ? calldata : calldata.input)
  }

  encode(args: EncodedStruct<T>) {
    const sink = new Sink(this.slotsCount)
    for (let i in this.args) {
      this.args[i].encode(sink, args[i])
    }
    return `0x${Buffer.concat([this.#selector, sink.result()]).toString('hex')}`
  }

  decode(calldata: string | CallRecord): DecodedStruct<T> {
    const input = typeof calldata === 'string' ? calldata : calldata.input

    if (!this.checkSignature(input)) {
      throw new FunctionInvalidSignatureError({targetSig: this.selector, sig: input.slice(0, this.selector.length)})
    }
    const src = new Src(Buffer.from(input.slice(10), 'hex'))
    const result = {} as any
    for (let i in this.args) {
      try {
        result[i] = this.args[i].decode(src)
      } catch (e: any) {
        throw new FunctionCalldataDecodeError(this.selector, i, e.message, input)
      }
    }
    return result
  }

  decodeResult(output: string): FunctionReturn<typeof this> {
    if (!this.returnType) {
      return undefined as any
    }
    const src = new Src(Buffer.from(output.slice(2), 'hex'))
    // StructCodec is used as an inline tuple-of-codecs container for
    // multi-output functions; its own decode would prepend an outer offset
    // that eth_call return data does not carry, so decode each component
    // in place instead.
    if (this.returnType instanceof StructCodec) {
      const components = (this.returnType as StructCodec<Struct>).components
      const result = {} as any
      for (const i in components) {
        try {
          result[i] = components[i].decode(src)
        } catch (e: any) {
          throw new FunctionResultDecodeError(this.selector, i, e.message, output)
        }
      }
      return result
    }
    if (this.isCodec(this.returnType)) {
      try {
        return this.returnType.decode(src) as any
      } catch (e: any) {
        throw new FunctionResultDecodeError(this.selector, '', e.message, output)
      }
    }
    const result = {} as any
    for (const i in this.returnType as Struct) {
      const codec = (this.returnType as Struct)[i]
      try {
        result[i] = codec.decode(src)
      } catch (e: any) {
        throw new FunctionResultDecodeError(this.selector, i, e.message, output)
      }
    }
    return result
  }

  private isCodec(value: any): value is Codec<any> {
    return value != null && typeof value === 'object' &&
      typeof value.encode === 'function' && typeof value.decode === 'function'
  }

  private checkSignature(val: string) {
    return val.startsWith(this.selector)
  }
}

export const fun = <const T extends Struct, const R extends Codec<any> | Struct | undefined>(
  selector: string,
  args: StructCodec<T> | T,
  returnType?: R,
) => new AbiFunction<T, R>(selector, args, returnType, false)

export const viewFun = <const T extends Struct, const R extends Codec<any> | Struct | undefined>(
  selector: string,
  args: StructCodec<T> | T,
  returnType?: R,
) => new AbiFunction<T, R>(selector, args, returnType, true)
