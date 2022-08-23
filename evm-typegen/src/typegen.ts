import {Interface, ParamType} from "@ethersproject/abi"
import {FileOutput, Output} from "@subsquid/util-internal-code-printer"
import {def} from "@subsquid/util-internal"
import fs from "fs"

export class Typegen {
    private rawAbi: any
    private abi: Interface
    private out: FileOutput

    constructor(abiFile: string, outPath: string) {
        this.rawAbi = JSON.parse(fs.readFileSync(abiFile, {encoding: "utf-8"}))
        this.abi = new Interface(this.rawAbi)
        this.out = new FileOutput(outPath)
    }

    generate(): void {
        this.out.line("import * as ethers from \"ethers\";")
        this.out.line("import assert from \"assert\";")
        this.out.line()
        this.out.line("export const abi = new ethers.utils.Interface(getJsonAbi());")
        this.out.line()
        this.generateEvents()
        this.out.line()
        this.generateFunctions()
        this.out.line()
        this.generateContract()
        this.out.line()
        this.out.block("function getJsonAbi(): any", () => {
            `return ${JSON.stringify(this.rawAbi, null, 2)}`.split('\n').forEach(line => {
                this.out.line(line)
            })
        })
        this.out.write()
    }

    private generateEvents() {
        for (const decl of this.getEvents()) {
            for (let i = 0; i < decl.overloads.length; i++) {
                if (decl.overloads[i].inputs.length === 0) continue
                this.out.line(`export type ${decl.name}${i}Event = ${getTupleType(decl.overloads[i].inputs)}`)
                this.out.line()
            }
        }
        this.out.block("export interface EvmLog", () => {
            this.out.line("data: string;")
            this.out.line("topics: string[];")
        })
        this.out.line()
        this.out.block(`function decodeEvent(signature: string, data: EvmLog): any`, () => {
            this.out.line(`return abi.decodeEventLog(`)
            this.out.indentation(() => {
                this.out.line(`abi.getEvent(signature),`)
                this.out.line(`data.data || "",`)
                this.out.line("data.topics")
            })
            this.out.line(");")
        })
        this.out.line()
        this.out.block(`export const events =`, () => {
            for (const event of this.getEvents()) {
                for (let i = 0; i < event.overloads.length; i++) {
                    const overload = event.overloads[i]
                    const signature = createSignature(event.name, overload.inputs)
                    this.out.block(`"${signature}":`, () => {
                        this.out.line(`topic: abi.getEventTopic("${signature}"),`)
                        if (event.overloads[i].inputs.length > 0) {
                            this.out.block(`decode(data: EvmLog): ${event.name}${i}Event`, () => {
                                this.out.line(`return decodeEvent("${signature}", data)`)
                            })
                        }
                    })
                    this.out.line(",")
                }
            }
        })
    }

    private generateFunctions() {
        for (const func of this.getFunctions()) {
            for (let i = 0; i < func.overloads.length; i++) {
                if (func.overloads[i].inputs.length === 0) continue
                this.out.line(`export type ${upperCaseFirst(func.name)}${i}Function = ${getTupleType(func.overloads[i].inputs)}`)
                this.out.line()
            }
        }
        this.out.line()
        this.out.block(`function decodeFunction(data: string): any`, () => {
            this.out.line(`return abi.decodeFunctionData(data.slice(0, 10), data)`)
        })
        this.out.line()
        this.out.block(`export const functions =`, () => {
            for (const func of this.getFunctions()) {
                for (let i = 0; i < func.overloads.length; i++) {
                    const overload = func.overloads[i]
                    const signature = createSignature(func.name, overload.inputs)
                    this.out.block(`"${signature}":`, () => {
                        this.out.line(`sighash: abi.getSighash("${signature}"),`)
                        if (func.overloads[i].inputs.length > 0)
                            this.out.block(`decode(input: string): ${upperCaseFirst(func.name)}${i}Function`, () => {
                                this.out.line(`return decodeFunction(input)`)
                            })
                    })
                    this.out.line(",")
                }
            }
        })
    }

    private generateContract() {
        let abiCalls = this.getCalls()

        this.out.block("interface ChainContext ", () => {
            this.out.line(`_chain: Chain`)
        })
        this.out.line()
        this.out.block("interface BlockContext ", () => {
            this.out.line(`_chain: Chain`)
            this.out.line(`block: Block`)
        })
        this.out.line()
        this.out.block("interface Block ", () => {
            this.out.line(`height: number`)
        })
        this.out.line()
        this.out.block("interface Chain ", () => {
            this.out.block("client: ", () => {
                this.out.line(`call: <T=any>(method: string, params?: unknown[]) => Promise<T>`)
            })
        })
        this.out.line()
        this.out.block("export class Contract ", () => {
            this.out.line(`private readonly _chain: Chain`)
            this.out.line(`private readonly blockHeight: number`)
            this.out.line(`readonly address: string`)
            this.out.line()
            this.out.line(`constructor(ctx: BlockContext, address: string)`)
            this.out.line(`constructor(ctx: ChainContext, block: Block, address: string)`)
            this.out.block(`constructor(ctx: BlockContext, blockOrAddress: Block | string, address?: string)`, () => {
                this.out.line(`this._chain = ctx._chain`)
                this.out.block(`if (typeof blockOrAddress === 'string') `, () => {
                    this.out.line(`this.blockHeight = ctx.block.height`)
                    this.out.line(`this.address = ethers.utils.getAddress(blockOrAddress)`)
                })
                this.out.block(`else `, () => {
                    this.out.line(`assert(address != null)`)
                    this.out.line(`this.blockHeight = blockOrAddress.height`)
                    this.out.line(`this.address = ethers.utils.getAddress(address)`)
                })
            })
            this.out.line()
            for (const decl of abiCalls) {
                if (decl.overloads.length > 1) {
                    for (let overload of decl.overloads) {
                        const args = overload.inputs.map((i, n) => `${i.name || `arg${n}`}: ${getType(i)}`)
                        const returnType = overload.outputs.length == 1 ? getType(overload.outputs[0]) : getTupleType(overload.outputs)
                        this.out.line(`async ${decl.name}(${args}): Promise<${returnType}>`)
                    }
                    this.out.block(`async ${decl.name}(...args: any[])`, () => {
                        this.out.line(`return this.call("${decl.name}", args)`)
                    })
                } else {
                    const overload = decl.overloads[0]
                    const params = overload.inputs.map((i, n) => `${i.name || `arg${n}`}: ${getType(i)}`)
                    const returnType = overload.outputs.length == 1 ? getType(overload.outputs[0]) : getTupleType(overload.outputs)
                    this.out.block(`async ${decl.name}(${params.join(`, `)}): Promise<${returnType}>`, () => {
                        this.out.line(`return this.call("${decl.name}", [${overload.inputs.map((i, n) => `${i.name || `arg${n}`}`).join(`, `)}])`)
                    })
                }
                this.out.line()
            }
            this.out.block(`private async call(name: string, args: any[]) : Promise<any>`, () => {
                this.out.line(`const fragment = abi.getFunction(name)`)
                this.out.line(`const data = abi.encodeFunctionData(fragment, args)`)
                this.out.line(`const result = await this._chain.client.call('eth_call', [{to: this.address, data}, this.blockHeight])`)
                this.out.line(`const decoded = abi.decodeFunctionResult(fragment, result)`)
                this.out.line(`return decoded.length > 1 ? decoded : decoded[0]`)
            })
        })
    }

    @def
    private getEvents(): AbiEvent[] {
        let res: Map<string, AbiEvent> = new Map()
        for (let event of Object.values(this.abi.events)) {
            let abiEvent = res.get(event.name)
            if (abiEvent == null) {
                abiEvent = {
                    name: event.name,
                    overloads: []
                }
                res.set(event.name, abiEvent)
            }

            abiEvent.overloads.push({
                inputs: event.inputs || [],
            })
        }

        return [...res.values()]
    }

    @def
    private getFunctions(): AbiFunction[] {
        let res: Map<string, AbiFunction> = new Map()
        for (let func of Object.values(this.abi.functions)) {
            if (func.constant) continue

            let abiFunc = res.get(func.name)
            if (abiFunc == null) {
                abiFunc = {
                    name: func.name,
                    overloads: []
                }
                res.set(func.name, abiFunc)
            }

            abiFunc.overloads.push({
                inputs: func.inputs || [],
            })
        }

        return [...res.values()]
    }

    @def
    private getCalls(): AbiCall[] {
        let res: Map<string, AbiCall> = new Map()
        for (let func of Object.values(this.abi.functions)) {
            if (!func.constant || func.outputs == null) continue

            let abiCall = res.get(func.name)
            if (abiCall == null) {
                abiCall = {
                    name: func.name,
                    overloads: []
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
    if (param.type === "address" || param.type === "string") {
        return "string"
    }

    if (param.type === "bool") {
        return "boolean"
    }

    if (param.type.substring(0, 5) === "bytes") {
        return "string"
    }

    let match = param.type.match(/^(u?int)([0-9]+)$/)
    if (match) {
        return parseInt(match[2]) < 53 ? 'number' : 'ethers.BigNumber'
    }

    if (param.baseType === "array") {
        return "Array<" + getType(param.arrayChildren) + ">"
    }

    if (param.baseType === "tuple") {
        return getTupleType(param.components)
    }

    throw new Error("unknown type")
}


function getTupleType(params: ParamType[]) {
    let tuple = '[' + params.map(p => {
        return p.name ? `${p.name}: ${getType(p)}` : getType(p)
    }).join(', ') + ']'

    let fields = getStructFields(params)
    if (fields.length == 0) return tuple

    let struct = '{' + fields.map(f => `${f.name}: ${getType(f)}`).join(', ') + '}'

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
    return params.filter(p => counts[p.name] == 1)
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
