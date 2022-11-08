import {Interface, ParamType} from '@ethersproject/abi'
import {FileOutput, OutDir, Output} from '@subsquid/util-internal-code-printer'

export interface AbiOptions {
    name: string
    fragments: any
}

interface TypegenOptions {
    abi: AbiOptions[]
    outDir: string
}

export class Typegen {
    private dir: OutDir

    constructor(private options: TypegenOptions) {
        this.dir = new OutDir(options.outDir)
    }

    generate(): void {
        this.dir.del()
        this.options.abi.forEach((abi) => this.generateAbi(abi))
        this.dir.add('support.ts', [__dirname, '../src/support.ts'])
    }

    generateAbi(abiOptions: AbiOptions): void {
        const out = this.dir.file(`${abiOptions.name}.ts`)
        const abi = new Interface(abiOptions.fragments)

        out.line(`import assert from 'assert'`)
        out.line(`import * as ethers from 'ethers'`)
        out.line(
            `import {EvmLog, EvmTransaction, Block, ChainContext, BlockContext, Chain, Result, rawMulticallAbi} from './support'`
        )
        out.line()
        out.line(`export const rawAbi = ${abi.format('json')}`)
        out.line()
        out.line('export const abi = new ethers.utils.Interface(rawAbi);')
        out.line('export const multicallAbi = new ethers.utils.Interface(rawMulticallAbi);')
        out.line()
        this.generateEvents(out, getEvents(abi))
        out.line()
        this.generateFunctions(out, getFunctions(abi))
        out.line()
        this.generateContract(out, getCalls(abi))
        out.write()
    }

    private generateEvents(out: FileOutput, events: AbiEvent[]) {
        for (const decl of events) {
            for (let i = 0; i < decl.overloads.length; i++) {
                if (decl.overloads[i].inputs.length === 0) continue
                out.line(`export type ${decl.name}${i}Event = ${getTupleType(decl.overloads[i].inputs)}`)
                out.line()
            }
        }
        out.block(`class Events`, () => {
            out.line(`private readonly _abi = abi`)
            for (const event of events) {
                for (let i = 0; i < event.overloads.length; i++) {
                    const overload = event.overloads[i]
                    const signature = overload.signature
                    out.line()
                    out.block(`'${signature}' =`, () => {
                        out.line(`topic: this._abi.getEventTopic('${signature}'),`)
                        if (overload.inputs.length == 0) return
                        out.line(`decode: (data: EvmLog): ${event.name}${i}Event => this._abi.decodeEventLog('${signature}', data.data, data.topics) as any`)
                    })
                }
                out.line()
                out.line(`${event.name} = this['${event.overloads[0].signature}']`)
            }
        })
        out.line()
        out.line(`export const events = new Events()`)
    }

    private generateFunctions(out: FileOutput, functions: AbiFunction[]) {
        for (const func of functions) {
            for (let i = 0; i < func.overloads.length; i++) {
                if (func.overloads[i].inputs.length === 0) continue
                out.line(
                    `export type ${upperCaseFirst(func.name)}${i}Function = ${getTupleType(func.overloads[i].inputs)}`
                )
                out.line()
            }
        }
        out.block(`class Functions`, () => {
            out.line(`private readonly _abi = abi`)
            for (const func of functions) {
                for (let i = 0; i < func.overloads.length; i++) {
                    const overload = func.overloads[i]
                    const signature = overload.signature
                    out.line()
                    out.block(`'${signature}' =`, () => {
                        out.line(`sighash: abi.getSighash('${signature}'),`)
                        if (overload.inputs.length == 0) return
                        out.line(`decode: (data: EvmTransaction | string): ${upperCaseFirst(func.name)}${i}Function => this._abi.decodeFunctionData('${signature}', typeof data === 'string' ? data : data.input) as any`)
                    })
                }
                out.line()
                out.line(`${func.name} = this['${func.overloads[0].signature}']`)
            }
        })
        out.line()
        out.line(`export const functions = new Functions()`)
    }

    private generateContract(out: FileOutput, calls: AbiCall[]) {
        out.block('export class Contract', () => {
            out.line(`private readonly _abi = abi`)
            out.line(`private readonly _chain: Chain`)
            out.line(`private readonly blockHeight: string`)
            out.line(`readonly address: string`)
            out.line()
            out.line(`constructor(ctx: BlockContext, address: string)`)
            out.line(`constructor(ctx: ChainContext, block: Block, address: string)`)
            out.block(`constructor(ctx: BlockContext, blockOrAddress: Block | string, address?: string)`, () => {
                out.line(`this._chain = ctx._chain`)
                out.block(`if (typeof blockOrAddress === 'string') `, () => {
                    out.line(`this.blockHeight = '0x' + ctx.block.height.toString(16)`)
                    out.line(`this.address = ethers.utils.getAddress(blockOrAddress)`)
                })
                out.block(`else `, () => {
                    out.line(`assert(address != null)`)
                    out.line(`this.blockHeight = '0x' + blockOrAddress.height.toString(16)`)
                    out.line(`this.address = ethers.utils.getAddress(address)`)
                })
            })
            for (const decl of calls) {
                out.line()
                for (let i = 0; i < decl.overloads.length; i++) {
                    const overload = decl.overloads[i]
                    const args = overload.inputs.map((inp, n) => `${inp.name || `arg${n}`}: ${getType(inp)}`).join(', ')
                    const argNames = overload.inputs.map((inp, n) => `${inp.name || `arg${n}`}`).join(', ')
                    const returnType =
                        overload.outputs.length == 1 ? getType(overload.outputs[0]) : getTupleType(overload.outputs)
                    const signature = overload.signature
                    out.block(`'${signature}' =`, () => {
                        out.line(`call: (${args}): Promise<${returnType}> => this.call('${signature}', [${argNames}]),`)
                        out.line(
                            `tryCall: (${args}): Promise<Result<${returnType}>> => this.tryCall('${signature}', [${argNames}])`
                        )
                    })
                }
                out.line()
                out.line(`${decl.name} = this['${decl.overloads[0].signature}']`)
            }
            out.line()
            out.block(`private async call(signature: string, args: any[]) : Promise<any>`, () => {
                out.line(`const data = this._abi.encodeFunctionData(signature, args)`)
                out.line(`const result = await this._chain.client.call('eth_call', [{to: this.address, data}, this.blockHeight])`)
                out.line(`const decoded = this._abi.decodeFunctionResult(signature, result)`)
                out.line(`return decoded.length > 1 ? decoded : decoded[0]`)
            })
            out.line()
            out.block(`private async tryCall(signature: string, args: any[]) : Promise<Result<any>>`, () => {
                out.line(
                    `return this.call(signature, args).then((r) => ({success: true, value: r})).catch(() => ({success: false}))`
                )
            })
        })
        out.line()
        out.block('export class MulticallContract', () => {
            out.line(`private readonly _abi = abi`)
            out.line(`private readonly _multicallAbi = multicallAbi`)
            out.line(`private readonly _chain: Chain`)
            out.line(`private readonly blockHeight: string`)
            out.line(`readonly address: string`)
            out.line()
            out.line(`constructor(ctx: BlockContext, multicallAddress: string)`)
            out.line(`constructor(ctx: ChainContext, block: Block, multicallAddress: string)`)
            out.block(`constructor(ctx: BlockContext, blockOrAddress: Block | string, address?: string)`, () => {
                out.line(`this._chain = ctx._chain`)
                out.block(`if (typeof blockOrAddress === 'string') `, () => {
                    out.line(`this.blockHeight = '0x' + ctx.block.height.toString(16)`)
                    out.line(`this.address = ethers.utils.getAddress(blockOrAddress)`)
                })
                out.block(`else `, () => {
                    out.line(`assert(address != null)`)
                    out.line(`this.blockHeight = '0x' + blockOrAddress.height.toString(16)`)
                    out.line(`this.address = ethers.utils.getAddress(address)`)
                })
            })
            for (const decl of calls) {
                out.line()
                // if (decl.overloads.length > 1) {
                for (let i = 0; i < decl.overloads.length; i++) {
                    const overload = decl.overloads[i]
                    let args = overload.inputs.map((inp, n) => `${inp.name || `arg${n}`}: ${getType(inp)}`).join(', ')
                    // const argNames = overload.inputs.map((inp, n) => `${inp.name || `arg${n}`}`).join(', ')
                    const returnType =
                        overload.outputs.length == 1 ? getType(overload.outputs[0]) : getTupleType(overload.outputs)
                    const signature = overload.signature
                    const hasArgs = overload.inputs.length > 0
                    out.block(`'${signature}' =`, () => {
                        out.line(
                            `call: (args: ${hasArgs ? `[string, [${args}]]` : `string`
                            }[]): Promise<${returnType}[]> => this.call('${signature}', ${hasArgs ? `args` : `args.map((arg) => [arg, []])`
                            }),`
                        )
                        out.line(
                            `tryCall: (args: ${hasArgs ? `[string, [${args}]]` : `string`
                            }[]): Promise<Result<${returnType}>[]> => this.tryCall('${signature}', ${hasArgs ? `args` : `args.map((arg) => [arg, []])`
                            })`
                        )
                    })
                    out.line()
                    out.line(`${decl.name} = this['${decl.overloads[0].signature}']`)
                }
            }
            out.line()
            out.block(`private async call(signature: string, args: [string, any[]][]) : Promise<any>`, () => {
                out.line(`const encodedArgs = args.map((arg) => [arg[0], this._abi.encodeFunctionData(signature, arg[1])])`)
                out.line(`const data = this._multicallAbi.encodeFunctionData('aggregate', [encodedArgs])`)
                out.line(`const response = await this._chain.client.call('eth_call', [{to: this.address, data}, this.blockHeight])`)
                out.line(`const batch = this._multicallAbi.decodeFunctionResult('aggregate', response).returnData`)
                out.line(`return batch.map((item: any) => {`)
                out.indentation(() => {
                    out.line(`const decodedItem = this._abi.decodeFunctionResult(signature, item.returnData)`)
                    out.line(`return decodedItem.length > 1 ? decodedItem : decodedItem[0]`)
                })
                out.line(`})`)
            })
            out.line()
            out.block(`private async tryCall(signature: string, args: [string, any[]][]) : Promise<Result<any>[]>`, () => {
                out.line(`const encodedArgs = args.map((arg) => [arg[0], this._abi.encodeFunctionData(signature, arg[1])])`)
                out.line(`const data = this._multicallAbi.encodeFunctionData('tryAggregate', [false, encodedArgs])`)
                out.line(`const response = await this._chain.client.call('eth_call', [{to: this.address, data}, this.blockHeight])`)
                out.line(`const batch: {success: boolean, returnData: string}[] = this._multicallAbi.decodeFunctionResult('tryAggregate', response).returnData`)
                out.line(`return batch.map((item) => {`)
                out.indentation(() => {
                    out.line(`if (!item.success) return {success: false}`)
                    out.line(`try {`)
                    out.indentation(() => {
                        out.line(`const decodedItem = this._abi.decodeFunctionResult(signature, item.returnData)`)
                        out.line(`return {success: true, value: decodedItem.length > 1 ? decodedItem : decodedItem[0]}`)
                    })
                    out.line(`} catch {`)
                    out.indentation(() => {
                        out.line(`return {success: false}`)
                    })
                    out.line(`}`)
                })
                out.line(`})`)
            })
        })
    }

    
}

function getEvents(abi: Interface): AbiEvent[] {
    let res: Map<string, AbiEvent> = new Map()
    for (let event of Object.values(abi.events)) {
        let abiEvent = res.get(event.name)
        if (abiEvent == null) {
            abiEvent = {
                name: event.name,
                overloads: [],
            }
            res.set(event.name, abiEvent)
        }

        abiEvent.overloads.push({
            signature: event.format('sighash'),
            inputs: event.inputs || [],
        })
    }

    return [...res.values()]
}

function getFunctions(abi: Interface): AbiFunction[] {
    let res: Map<string, AbiFunction> = new Map()
    for (let func of Object.values(abi.functions)) {
        if (func.stateMutability === 'view') continue

        let abiFunc = res.get(func.name)
        if (abiFunc == null) {
            abiFunc = {
                name: func.name,
                overloads: [],
            }
            res.set(func.name, abiFunc)
        }

        abiFunc.overloads.push({
            signature: func.format('sighash'),
            inputs: func.inputs || [],
        })
    }

    return [...res.values()]
}

function getCalls(abi: Interface): AbiCall[] {
    let res: Map<string, AbiCall> = new Map()
    for (let func of Object.values(abi.functions)) {
        if (func.stateMutability !== 'view' || func.outputs == null) continue

        let abiCall = res.get(func.name)
        if (abiCall == null) {
            abiCall = {
                name: func.name,
                overloads: [],
            }
            res.set(func.name, abiCall)
        }

        abiCall.overloads.push({
            signature: func.format('sighash'),
            inputs: func.inputs,
            outputs: func.outputs || [],
        })
    }

    return [...res.values()]
}

// taken from: https://github.com/ethers-io/ethers.js/blob/948f77050dae884fe88932fd88af75560aac9d78/packages/cli/src.ts/typescript.ts#L10
function getType(param: ParamType): string {
    if (param.type === 'address' || param.type === 'string') {
        return 'string'
    }

    if (param.type === 'bool') {
        return 'boolean'
    }

    if (param.type.substring(0, 5) === 'bytes') {
        return 'string'
    }

    let match = param.type.match(/^(u?int)([0-9]+)$/)
    if (match) {
        return parseInt(match[2]) < 53 ? 'number' : 'ethers.BigNumber'
    }

    if (param.baseType === 'array') {
        return 'Array<' + getType(param.arrayChildren) + '>'
    }

    if (param.baseType === 'tuple') {
        return getTupleType(param.components)
    }

    throw new Error('unknown type')
}

function getTupleType(params: ParamType[]) {
    let tuple =
        '[' +
        params
            .map((p) => {
                return p.name ? `${p.name}: ${getType(p)}` : getType(p)
            })
            .join(', ') +
        ']'

    let fields = getStructFields(params)
    if (fields.length == 0) return tuple

    let struct = '{' + fields.map((f) => `${f.name}: ${getType(f)}`).join(', ') + '}'

    return `(${tuple} & ${struct})`
}

// https://github.com/ethers-io/ethers.js/blob/948f77050dae884fe88932fd88af75560aac9d78/packages/abi/src.ts/coders/tuple.ts#L29
function getStructFields(params: ParamType[]): ParamType[] {
    let array: any = []
    let counts: Record<string, number> = {}
    for (let p of params) {
        if (p.name && array[p.name] == null) {
            counts[p.name] = (counts[p.name] || 0) + 1
        }
    }
    return params.filter((p) => counts[p.name] == 1)
}

interface AbiEvent {
    name: string
    overloads: {
        signature: string
        inputs: ParamType[]
    }[]
}

interface AbiFunction {
    name: string
    overloads: {
        signature: string
        inputs: ParamType[]
    }[]
}

interface AbiCall {
    name: string
    overloads: {
        signature: string
        inputs: ParamType[]
        outputs: ParamType[]
    }[]
}

function upperCaseFirst(s: string): string {
    return s[0].toUpperCase() + s.slice(1)
}
