import assert from 'node:assert'
import {
  type Codec,
  type Struct,
  type DecodedStruct,
  type EncodedStruct,
  bytesToHexString,
  hexToBytes,
  Sink,
  Src,
  StructCodec,
} from '@subsquid/evm-codec'
import {FunctionInvalidSignatureError, FunctionResultDecodeError, FunctionCalldataDecodeError} from '../errors'

export interface CallRecord {
  input: string
}

export type FunctionReturn<T extends AbiFunction<any, any>> = T extends AbiFunction<any, infer R>
  ? R extends Codec<any, infer U> ? U : R extends Struct ? DecodedStruct<R> : void
  : never

export type FunctionArguments<T extends AbiFunction<any, any>> =
  T extends AbiFunction<infer U, any> ? EncodedStruct<U> : never

export class AbiFunction<const T extends Struct, const R extends Codec<any> | Struct | undefined> {
  /**
   * Top-level tuple codec for the function arguments. We use its
   * `encodeInline` / `decodeInline` entrypoints so that the JIT-compiled
   * body runs directly — without the extra `newStaticDataArea` /
   * `src.slice(src.u32())` wrappers that apply only when a dynamic
   * struct is nested inside another tuple.
   */
  private readonly argsCodec: StructCodec<T>
  public readonly args: T

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
    this.argsCodec = args instanceof StructCodec ? args : new StructCodec<T>(args)
    this.args = this.argsCodec.components
  }

  is(calldata: string | CallRecord) {
    return this.checkSignature(typeof calldata === 'string' ? calldata : calldata.input)
  }

  encode(args: EncodedStruct<T>) {
    const sink = new Sink(this.argsCodec.childrenSlotsCount)
    this.argsCodec.encodeInline(sink, args)
    const body = sink.result()
    // selector is already '0x' + 8 hex chars; append encoded-body hex directly.
    return this.selector + bytesToHexString(body, 0, body.length)
  }

  decode(calldata: string | CallRecord): DecodedStruct<T> {
    const input = typeof calldata === 'string' ? calldata : calldata.input

    if (!this.checkSignature(input)) {
      throw new FunctionInvalidSignatureError({targetSig: this.selector, sig: input.slice(0, this.selector.length)})
    }
    const src = new Src(hexToBytes(input, 10))
    try {
      return this.argsCodec.decodeInline(src)
    } catch (e: any) {
      // Fast path failed — run a slow per-field loop over a fresh src to
      // pinpoint the offending argument for a nicer error message.
      throw this.locateDecodeError(input, e, (src, i) => new FunctionCalldataDecodeError(this.selector, i, e.message, input))
    }
  }

  decodeResult(output: string): FunctionReturn<typeof this> {
    if (!this.returnType) {
      return undefined as any
    }
    const src = new Src(hexToBytes(output, 2))
    // StructCodec is used as an inline tuple-of-codecs container for
    // multi-output functions; its own `decode` would prepend an outer
    // offset that eth_call return data does not carry, so go through
    // `decodeInline` to skip that wrapper.
    if (this.returnType instanceof StructCodec) {
      try {
        return (this.returnType as StructCodec<Struct>).decodeInline(src) as any
      } catch (e: any) {
        throw this.locateResultError(output, (this.returnType as StructCodec<Struct>).components, e)
      }
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

  private locateDecodeError(input: string, original: any, make: (src: Src, i: string) => Error): Error {
    const slow = new Src(hexToBytes(input, 10))
    for (const i in this.args) {
      try {
        this.args[i].decode(slow)
      } catch (e: any) {
        return make(slow, i)
      }
    }
    return original
  }

  private locateResultError(output: string, components: Struct, original: any): Error {
    const slow = new Src(hexToBytes(output, 2))
    for (const i in components) {
      try {
        components[i].decode(slow)
      } catch (e: any) {
        return new FunctionResultDecodeError(this.selector, i, e.message, output)
      }
    }
    return original
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
