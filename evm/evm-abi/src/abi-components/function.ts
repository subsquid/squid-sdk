import assert from 'node:assert'
import {type Codec, type Struct, type DecodedStruct, type EncodedStruct, Sink, Src} from '@subsquid/evm-codec'
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

export type FunctionArguments<T extends AbiFunction<any, any>> = T extends AbiFunction<infer U, any> ? EncodedStruct<U> : never

export class AbiFunction<const T extends Struct, const R extends Codec<any> | Struct | undefined> {
  readonly #selector: Buffer
  private readonly slotsCount: number

  public get sighash() {
    return this.selector
  }

  constructor(public selector: string, public signature: string, public readonly args: T, public readonly returnType?: R, public isView = false) {
    assert(selector.startsWith('0x'), 'selector must start with 0x')
    assert(selector.length === 10, 'selector must be 4 bytes long')
    this.#selector = Buffer.from(selector.slice(2), 'hex')
    this.args = args
    this.slotsCount = slotsCount(Object.values(args))
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
        throw new FunctionCalldataDecodeError(this.signature, i, e.message, input)
      }
    }
    return result
  }

  private isCodecs(value: any): value is Codec<any> {
    return 'decode' in value && 'encode' in value
  }

  decodeResult(output: string): FunctionReturn<typeof this> {
    if (!this.returnType) {
      return undefined as any
    }
    const src = new Src(Buffer.from(output.slice(2), 'hex'))
    if (this.isCodecs(this.returnType)) {
      try {
        return this.returnType.decode(src) as any
      } catch (e: any) {
        throw new FunctionResultDecodeError(this.signature, '', e.message, output)
      }
    }
    const result = {} as any
    for (let i in this.returnType) {
      const codec = this.returnType[i] as Codec<any>
      try {
        result[i] = codec.decode(src)
      } catch (e: any) {
        throw new FunctionResultDecodeError(this.signature, i, e.message, output)
      }
    }
    return result
  }

  private checkSignature(val: string) {
    return val.startsWith(this.selector)
  }
}

export const fun = <const T extends Struct, const R extends Codec<any> | Struct | undefined>(
  selector: string,
  signature: string,
  args: T,
  returnType?: R,
) => new AbiFunction<T, R>(selector, signature, args, returnType, false)

export const viewFun = <const T extends Struct, const R extends Codec<any> | Struct | undefined>(
  selector: string,
  signature: string,
  args: T,
  returnType?: R,
) => new AbiFunction<T, R>(selector, signature, args, returnType, true)
