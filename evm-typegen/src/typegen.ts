import {Interface, ParamType} from '@ethersproject/abi'
import {FileOutput, OutDir, Output} from '@subsquid/util-internal-code-printer'
import {def} from '@subsquid/util-internal'
import fs from 'fs'

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
            `import {EvmLog, EvmTransaction, Block, ChainContext, BlockContext, BaseContract, BaseEvents, BaseFunctions} from './support'`
        )
        out.line()
        out.line('export const abi = new ethers.utils.Interface(getJsonAbi());')
        out.line()
        this.generateEvents(out, this.getEvents(abi))
        out.line()
        this.generateFunctions(out, this.getFunctions(abi))
        out.line()
        this.generateContract(out, this.getCalls(abi))
        out.line()
        out.block('function getJsonAbi(): any', () => {
            ;`return ${JSON.stringify(abi.fragments, null, 2)}`.split('\n').forEach((line) => {
                out.line(line)
            })
        })
        out.line()

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
        out.line()
        out.block(`export const events =`, () => {
            for (const event of events) {
                for (let i = 0; i < event.overloads.length; i++) {
                    const overload = event.overloads[i]
                    const signature = createSignature(event.name, overload.inputs)
                    out.block(`"${signature}":`, () => {
                        out.line(`topic: abi.getEventTopic('${signature}'),`)
                        if (event.overloads[i].inputs.length > 0) {
                            out.block(`decode(data: EvmLog): ${event.name}${i}Event`, () => {
                                out.line(`return decodeEvent(abi, '${signature}', data)`)
                            })
                        }
                    })
                    out.line(',')
                }
            }
        })
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
        out.line()
        out.block(`export const functions =`, () => {
            for (const func of functions) {
                for (let i = 0; i < func.overloads.length; i++) {
                    const overload = func.overloads[i]
                    const signature = createSignature(func.name, overload.inputs)
                    out.block(`"${signature}":`, () => {
                        out.line(`sighash: abi.getSighash('${signature}'),`)
                        if (func.overloads[i].inputs.length > 0)
                            out.block(
                                `decode(transaction: EvmTransaction | string): ${upperCaseFirst(
                                    func.name
                                )}${i}Function`,
                                () => {
                                    out.line(`return decodeFunction(abi, '${signature}', transaction)`)
                                }
                            )
                    })
                    out.line(',')
                }
            }
        })
    }

    private generateContract(out: FileOutput, calls: AbiCall[]) {
        out.block('export class Contract extends BaseContract', () => {
            out.line(`constructor(ctx: BlockContext, address: string)`)
            out.line(`constructor(ctx: ChainContext, block: Block, address: string)`)
            out.block(`constructor(ctx: BlockContext, blockOrAddress: Block | string, address?: string)`, () => {
                out.line(`super(ctx, blockOrAddress, address)`)
                out.line(`this._abi = abi`)
            })
            out.line()
            for (const decl of calls) {
                if (decl.overloads.length > 1) {
                    for (let overload of decl.overloads) {
                        const args = overload.inputs.map((i, n) => `${i.name || `arg${n}`}: ${getType(i)}`)
                        const returnType =
                            overload.outputs.length == 1 ? getType(overload.outputs[0]) : getTupleType(overload.outputs)
                        out.line(`async ${decl.name}(${args}): Promise<${returnType}>`)
                    }
                    out.block(`async ${decl.name}(...args: any[])`, () => {
                        out.line(`return this.call("${decl.name}", args)`)
                    })
                } else {
                    const overload = decl.overloads[0]
                    const params = overload.inputs.map((i, n) => `${i.name || `arg${n}`}: ${getType(i)}`)
                    const returnType =
                        overload.outputs.length == 1 ? getType(overload.outputs[0]) : getTupleType(overload.outputs)
                    out.block(`async ${decl.name}(${params.join(`, `)}): Promise<${returnType}>`, () => {
                        out.line(
                            `return this.call("${decl.name}", [${overload.inputs
                                .map((i, n) => `${i.name || `arg${n}`}`)
                                .join(`, `)}])`
                        )
                    })
                }
                out.line()
            }
        })
    }

    private getEvents(abi: Interface): AbiEvent[] {
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
                inputs: event.inputs || [],
            })
        }

        return [...res.values()]
    }

    private getFunctions(abi: Interface): AbiFunction[] {
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
                inputs: func.inputs || [],
            })
        }

        return [...res.values()]
    }

    private getCalls(abi: Interface): AbiCall[] {
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
                inputs: func.inputs,
                outputs: func.outputs || [],
            })
        }

        return [...res.values()]
    }
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

function createSignature(name: string, inputs: ParamType[]) {
    return `${name}(${inputs.map((i) => i.type).join(`,`)})`
}

interface AbiEvent {
    name: string
    overloads: {
        inputs: ParamType[]
    }[]
}

interface AbiFunction {
    name: string
    overloads: {
        inputs: ParamType[]
    }[]
}

interface AbiCall {
    name: string
    overloads: {
        inputs: ParamType[]
        outputs: ParamType[]
    }[]
}

function upperCaseFirst(s: string): string {
    return s[0].toUpperCase() + s.slice(1)
}
