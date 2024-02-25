import {type AbiParameter, decodeAbiParameters, hasDynamicChild} from './decodeAbiParameters'
import {encodeFunctionData} from "./encodeAbiParameters";

type Hex = `0x${string}`

export interface EventRecord {
    topics: string[]
    data: string
}
export type LogRecord = EventRecord

type EventType = {
    type: 'tuple'
    internalType?: string
    indexed?: boolean
    name: string
    components: EventType[]
} | {
    type: string
    internalType?: string
    indexed?: boolean
    name: string
}

type SecondElements<T extends [any, any][]> = T extends [] ? [] : T extends [[any, infer U], ...infer Tail extends [any, any][]] ? [U, ...SecondElements<Tail>] : never
type Args<T extends [string, any][]> = {
    [K in T[number] as K[0]]: K[1]
} & SecondElements<T>

function assertIsHex(val: unknown): asserts val is Hex {
    if (typeof val !== 'string' || !val.startsWith('0x')) {
        throw new Error('Not a hex string')
    }
}

export class LogEvent<TEventArgs extends [string, any][]> {
    private indexedArgs: ((AbiParameter & {index: number}) | null)[] = [];
    private nonIndexedArgs: (AbiParameter & {index: number})[] = [];

    constructor(public readonly topic: string, readonly types: readonly EventType[]) {
        assertIsHex(topic)
        let index = 0;
        for (const type of types) {
            if (!type.indexed) {
                this.nonIndexedArgs.push({
                    ...type,
                    index
                })
            } else {
                if (hasDynamicChild(type)) {
                    this.indexedArgs.push({
                        ...type,
                        type: 'bytes32',
                        index
                    })
                } else {
                    this.indexedArgs.push({
                        ...type,
                        index
                    })
                }
            }
            index++;
        }
    }

    is(rec: EventRecord): boolean {
        return rec.topics[0] === this.topic
    }

    decode(rec: EventRecord) {
        if (!this.is(rec)) {
            throw new Error('Invalid event record')
        }
        assertIsHex(rec.data)
        const result: any = []
        const parsedData = decodeAbiParameters(this.nonIndexedArgs, rec.data)
        for (let i = 0; i < parsedData.length; i++) {
            if (this.nonIndexedArgs[i].name) {
                result[this.nonIndexedArgs[i].name!] = parsedData[i]
            }
            result[this.nonIndexedArgs[i].index] = parsedData[i]
        }
        rec.topics.slice(1).forEach((topic, i) => {
            const type = this.indexedArgs[i]
            if (type) {
                assertIsHex(topic)
                const [parsedData] = decodeAbiParameters([type], topic)
                if (type.name) {
                    result[type.name] = parsedData
                }
                result[type.index] = parsedData
            }
        })
        return result as Args<TEventArgs>
    }
}

export interface FuncRecord {
    sighash?: string
    input: string
}

export class Func<TFunctionArgs extends [string, any][], Result> {
    public readonly sighash: Hex
    constructor(sighash: string, private readonly args: AbiParameter[], private readonly result: AbiParameter[]) {
        assertIsHex(sighash)
        this.sighash = sighash
    }

    is(rec: FuncRecord): boolean {
        let sighash = rec.sighash ? rec.sighash : rec.input.slice(0, 10)
        return sighash === this.sighash
    }

    decode(input: string): Args<TFunctionArgs>
    decode(rec: FuncRecord): Args<TFunctionArgs>
    decode(inputOrRec: string | FuncRecord): Args<TFunctionArgs> {
        const input = typeof inputOrRec === 'string' ? inputOrRec : inputOrRec.input
        assertIsHex(input)
        if (!this.is({input})) {
            throw new Error('Invalid event record')
        }

        return decodeAbiParameters(this.args, `0x${input.slice(10)}`) as Args<TFunctionArgs>
    }

    encode(...args: SecondElements<TFunctionArgs>) {
        return encodeFunctionData(this.sighash, this.args, args)
    }

    decodeResult(output: string): Result {
        assertIsHex(output)
        const decoded = decodeAbiParameters(this.result, output)
        return decoded.length > 1 ? decoded : decoded[0]
    }

    tryDecodeResult(output: string): Result | undefined {
        try {
            return this.decodeResult(output)
        } catch(err: any) {
            return undefined
        }
    }
}


export function isFunctionResultDecodingError(val: unknown): val is Error & {data: string} {
    if (!(val instanceof Error)) return false
    let err = val as any
    return err.code == 'CALL_EXCEPTION'
        && typeof err.data == 'string'
        && !err.errorArgs
        && !err.errorName
}


export interface ChainContext  {
    _chain: Chain
}


export interface BlockContext  {
    _chain: Chain
    block: Block
}


export interface Block  {
    height: number
}


export interface Chain  {
    client:  {
        call: <T=any>(method: string, params?: unknown[]) => Promise<T>
    }
}


export class ContractBase {
    private readonly _chain: Chain
    private readonly blockHeight: number
    readonly address: Hex

    constructor(ctx: BlockContext, address: string)
    constructor(ctx: ChainContext, block: Block, address: string)
    constructor(ctx: BlockContext, blockOrAddress: Block | string, address?: string) {
        this._chain = ctx._chain
        if (typeof blockOrAddress === 'string')  {
            this.blockHeight = ctx.block.height
            this.address = blockOrAddress as Hex
        } else  {
            if (address == null) {
                throw new Error('missing contract address')
            }
            this.blockHeight = blockOrAddress.height
            this.address = address as Hex
        }
        assertIsHex(this.address)
    }

    async eth_call<TFunctionArgs extends [string, any][], Result>(func: Func<TFunctionArgs, Result>, args: SecondElements<TFunctionArgs>): Promise<Result> {
        let data = func.encode(...args)
        let result = await this._chain.client.call('eth_call', [
            {to: this.address, data},
            '0x'+this.blockHeight.toString(16)
        ])
        return func.decodeResult(result)
    }
}
