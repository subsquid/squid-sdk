import assert from 'assert'
import {BytesLike, EventFragment, FunctionFragment, Interface} from 'ethers'

export {Interface, EventFragment, FunctionFragment}

export interface LogRecord {
    topics: string[]
    data: string
}

export class LogEvent<Args extends any[], FieldArgs> {
    private fragment: EventFragment

    constructor(private abi: Interface, public readonly topic: string) {
        let fragment = abi.getEvent(topic)
        assert(fragment != null, 'Missing fragment')
        this.fragment = fragment
    }

    decode(rec: LogRecord): Args {
        return this.abi.decodeEventLog(this.fragment, rec.data, rec.topics) as any as Args & FieldArgs
    }
}

export class Func<Args extends any[], FieldArgs, Result> {
    private fragment: FunctionFragment

    constructor(private abi: Interface, public readonly sighash: string) {
        let fragment = abi.getFunction(sighash)
        assert(fragment != null, 'Missing fragment')
        this.fragment = fragment
    }

    decode(input: BytesLike): Args & FieldArgs {
        return this.abi.decodeFunctionData(this.fragment, input) as any as Args & FieldArgs
    }

    encode(args: Args): string {
        return this.abi.encodeFunctionData(this.fragment, args)
    }

    decodeResult(output: BytesLike): Result {
        const decoded = this.abi.decodeFunctionResult(this.fragment, output)
        return decoded.length > 1 ? decoded : decoded[0]
    }

    tryDecodeResult(output: BytesLike): Result | undefined {
        try {
            return this.decodeResult(output)
        } catch (err: any) {
            return undefined
        }
    }
}

export function isFunctionResultDecodingError(val: unknown): val is Error & {data: string} {
    if (!(val instanceof Error)) return false
    let err = val as any
    return err.code == 'CALL_EXCEPTION' && typeof err.data == 'string' && !err.errorArgs && !err.errorName
}
