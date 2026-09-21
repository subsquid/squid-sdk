import assert from 'node:assert'
import {
    type Codec,
    type Struct,
    type DecodedStruct,
    type EncodedStruct,
    HexSink,
    HexSrc,
    propName,
    StructCodec,
} from '@subsquid/evm-codec'
import {FunctionInvalidSignatureError, FunctionResultDecodeError, FunctionCalldataDecodeError} from '../errors'

export interface CallRecord {
    input: string
}

export type FunctionReturn<T extends AbiFunction<any, any>> = T extends AbiFunction<any, infer R>
    ? R extends Codec<any, infer U>
        ? U
        : undefined
    : never

export type FunctionArguments<T extends AbiFunction<any, any>> = T extends AbiFunction<infer U, any>
    ? EncodedStruct<U>
    : never

export class AbiFunction<const T extends Struct, const R extends Codec<any> | undefined> {
    private readonly argsCodec: StructCodec<T>
    public readonly args: T

    private readonly decodeInline: (input: string) => DecodedStruct<T>
    private readonly decodeResultInline?: (output: string) => FunctionReturn<typeof this>

    public get sighash() {
        return this.selector
    }

    constructor(
        public selector: string,
        args: T,
        public readonly returnType?: R,
    ) {
        assert(selector.startsWith('0x'), 'selector must start with 0x')
        assert(selector.length === 10, 'selector must be 4 bytes long')
        this.args = args
        this.argsCodec = new StructCodec<T>(args)

        this.decodeInline = this.createDecodeInline()
        if (returnType !== undefined) {
            this.decodeResultInline = this.createDecodeResultInline(returnType)
        }
    }

    is(calldata: string | CallRecord) {
        return this.checkSignature(typeof calldata === 'string' ? calldata : calldata.input)
    }

    encode(args: EncodedStruct<T>) {
        // `HexSink` produces hex directly, so we can skip the bytes→hex
        // conversion that `Sink.result() + toHex` would otherwise do.
        const sink = new HexSink(this.argsCodec.childrenSlotsCount)
        this.argsCodec.encodeInline(sink, args)
        return this.selector + sink.result().slice(2)
    }

    decode(calldata: string | CallRecord): DecodedStruct<T> {
        const input = typeof calldata === 'string' ? calldata : calldata.input
        if (!this.checkSignature(input)) {
            throw new FunctionInvalidSignatureError({
                targetSig: this.selector,
                sig: input.slice(0, this.selector.length),
            })
        }
        return this.decodeInline(input)
    }

    decodeResult(output: string): FunctionReturn<typeof this> {
        if (!this.decodeResultInline) return undefined as any
        return this.decodeResultInline(output)
    }

    private createDecodeInline(): (input: string) => DecodedStruct<T> {
        const entries = Object.entries(this.args) as Array<[string, Codec<any>]>
        const fieldNames = entries.map(([k]) => k)
        const names: string[] = ['HexSrc', 'FunctionCalldataDecodeError', 'SELECTOR', 'FIELD_NAMES']
        const values: any[] = [HexSrc, FunctionCalldataDecodeError, this.selector, fieldNames]
        for (let i = 0; i < entries.length; i++) {
            names.push(`__d${i}`)
            values.push(entries[i][1].decode.bind(entries[i][1]))
        }

        // Single try/catch with an `__i` bookmark bumped after each field —
        // if a codec throws, `__i` still points at the offending arg, so
        // FunctionCalldataDecodeError gets the right name without re-running.
        let body = 'let __i=0;try{const src=new HexSrc(input,10);'
        const fields: string[] = []
        for (let i = 0; i < entries.length; i++) {
            body += `const __v${i}=__d${i}(src);__i=${i + 1};`
            fields.push(`${propName(entries[i][0])}:__v${i}`)
        }
        body += `return{${fields.join(',')}};`
        body += '}catch(e){throw new FunctionCalldataDecodeError(SELECTOR,FIELD_NAMES[__i],e.message,input);}'

        const fn = new Function(...names, 'input', body)
        return fn.bind(null, ...values)
    }

    private createDecodeResultInline(returnType: Codec<any>): (output: string) => any {
        const selector = this.selector

        // StructCodec return: unwrap into per-field JIT with a bookmark, so
        // FunctionResultDecodeError can point at the offending field by name.
        if (returnType instanceof StructCodec) {
            const entries = Object.entries(returnType.components) as Array<[string, Codec<any>]>
            const fieldNames = entries.map(([k]) => k)
            const names: string[] = ['HexSrc', 'FunctionResultDecodeError', 'SELECTOR', 'FIELD_NAMES']
            const values: any[] = [HexSrc, FunctionResultDecodeError, selector, fieldNames]
            for (let i = 0; i < entries.length; i++) {
                names.push(`__d${i}`)
                values.push(entries[i][1].decode.bind(entries[i][1]))
            }

            let body = 'let __i=0;try{const src=new HexSrc(output);'
            const fields: string[] = []
            for (let i = 0; i < entries.length; i++) {
                body += `const __v${i}=__d${i}(src);__i=${i + 1};`
                fields.push(`${propName(entries[i][0])}:__v${i}`)
            }
            body += `return{${fields.join(',')}};`
            body += '}catch(e){throw new FunctionResultDecodeError(SELECTOR,FIELD_NAMES[__i],e.message,output);}'

            const fn = new Function(...names, 'output', body)
            return fn.bind(null, ...values)
        }

        // Scalar codec — no field name available, wrap raw codec error with
        // an empty argument name.
        const decode = returnType.decode.bind(returnType)
        return (output) => {
            const src = new HexSrc(output)
            try {
                return decode(src)
            } catch (e: any) {
                throw new FunctionResultDecodeError(selector, '', e.message, output)
            }
        }
    }

    private checkSignature(val: string) {
        return val.startsWith(this.selector)
    }
}

export const func = <const T extends Struct, const R extends Codec<any> | undefined>(
    selector: string,
    args: T,
    returnType?: R,
) => new AbiFunction<T, R>(selector, args, returnType)
