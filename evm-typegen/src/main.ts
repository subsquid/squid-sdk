import {EventFragment, Interface, ParamType} from "@ethersproject/abi"
import {Output} from "@subsquid/util-internal-code-printer"
import {program} from "commander"
import fs from "fs"
import path from "path"
import process from "process"

export function run(): void {
    program.description(`
Generates TypeScript definitions for evm log events
for use within substrate-processor mapping handlers.
    `.trim())
        .requiredOption('--abi <path>', 'path to a JSON abi file')
        .requiredOption('--output <path>', 'path for output typescript file');

    program.parse();

    const options = program.opts();
    const inputPath = options.abi;
    const outputPath = options.output;

    try {
        generateTsFromAbi(inputPath, outputPath);
    } catch (err: any) {
        console.error(`evm-typegen error: ${err.toString()}`);
        process.exit(1);
    }
}

function generateTsFromAbi(inputPathRaw: string, outputPathRaw: string): void {
    const inputPath = path.parse(inputPathRaw);
    const outputPath = path.parse(outputPathRaw);

    if (inputPath.ext !== ".json") {
        throw new Error("invalid abi file extension");
    }

    if (outputPath.ext !== ".ts") {
        throw new Error("invalid output file extension");
    }

    const rawABI = JSON.parse(fs.readFileSync(inputPathRaw, {encoding: "utf-8"}));

    const output = new Output();

    output.line("import * as ethers from \"ethers\";");
    output.line("import assert from \"assert\";");
    output.line();
    output.line("export const abi = new ethers.utils.Interface(getJsonAbi());");
    output.line();

    // validate the abi
    const abi = new Interface(rawABI);

    const abiEvents = getEvents(abi)

    for (const decl of abiEvents) {
        for (let i = 0; i < decl.overloads.length; i++) {
            if (decl.overloads[i].inputs.length === 0) continue
            output.line(`export type ${decl.name}${i}Event = ${getTupleType(decl.overloads[i].inputs)}`)
            output.line("");
        }
    }

    output.block("export interface EvmLog", () => {
        output.line("data: string;");
        output.line("topics: string[];");
    });

    output.line();

    output.block(`function decodeEvent(signature: string, data: EvmLog): any`, () => {
        output.line(`return abi.decodeEventLog(`);
        output.indentation(() => {
            output.line(`abi.getEvent(signature),`);
            output.line(`data.data || "",`);
            output.line("data.topics");
        });
        output.line(");");
    });

    output.line();

    output.block("export const events =", () => {
        for (const decl of abiEvents) {
            for (let i = 0; i < decl.overloads.length; i++) {
                const overload = decl.overloads[i]
                const signature = createSignature(decl.name, overload.inputs)
                output.block(`"${signature}":`, () => {
                    output.line(`topic: abi.getEventTopic("${signature}"),`);
                    if (decl.overloads[i].inputs.length > 0)
                        output.block(`decode(data: EvmLog): ${decl.name}${i}Event`, () => {
                            output.line(`return decodeEvent("${signature}", data)`)
                        });
                });
                output.line(",")
            }
        }
    });

    output.line();

    let abiFunctions = getFunctions(abi)

    for (const decl of abiFunctions) {
        for (let i = 0; i < decl.overloads.length; i++) {
            if (decl.overloads[i].inputs.length === 0) continue
            output.line(`export type ${decl.name}${i}Function = ${getTupleType(decl.overloads[i].inputs)}`)
            output.line("");
        }
    }

    output.block("export interface Transaction", () => {
        output.line("input: string")
    });

    output.line();

    output.block(`function decodeFunction(data: Transaction): any`, () => {
        output.line(`return abi.decodeFunctionData(data.input.slice(0, 10), data.input)`);
    });

    output.line();

    output.block("export const functions =", () => {
        for (const decl of abiFunctions) {
            for (let i = 0; i < decl.overloads.length; i++) {
                const overload = decl.overloads[i]
                const signature = createSignature(decl.name, overload.inputs)
                output.block(`"${signature}":`, () => {
                    output.line(`sighash: abi.getSighash("${signature}"),`);
                    if (decl.overloads[i].inputs.length > 0)
                        output.block(`decode(data: Transaction): ${decl.name}${i}Function`, () => {
                            output.line(`return decodeFunction(data)`)
                        });
                });
                output.line(",")
            }
        }
    });

    output.line();

    let abiCalls = getCalls(abi)

    output.block("interface ChainContext ", () => {
        output.line(`_chain: Chain`);
    })
    output.line();
    output.block("interface BlockContext ", () => {
        output.line(`_chain: Chain`);
        output.line(`block: Block`);
    })
    output.line();
    output.block("interface Block ", () => {
        output.line(`height: number`);
    })
    output.line();
    output.block("interface Chain ", () => {
        output.block("client: ", () => {
            output.line(`call: <T=any>(method: string, params?: unknown[]) => Promise<T>`);
        })
    })
    output.line();
    output.block("export class Contract ", () => {
        output.line(`private readonly _chain: Chain`);
        output.line(`private readonly blockHeight: number`);
        output.line(`readonly address: string`);
        output.line();
        output.line(`constructor(ctx: BlockContext, address: string)`);
        output.line(`constructor(ctx: ChainContext, block: Block, address: string)`);
        output.block(`constructor(ctx: BlockContext, blockOrAddress: Block | string, address?: string)`, () => {
            output.line(`this._chain = ctx._chain`);
            output.block(`if (typeof blockOrAddress === 'string') `, () => {
                output.line(`this.blockHeight = ctx.block.height`)
                output.line(`this.address = ethers.utils.getAddress(blockOrAddress)`)
            })
            output.block(`else `, () => {
                output.line(`assert(address != null)`)
                output.line(`this.blockHeight = blockOrAddress.height`)
                output.line(`this.address = ethers.utils.getAddress(address)`)
            })
        })
        output.line();
        for (const decl of abiCalls) {
            if (decl.overloads.length > 1) {
                for (let overload of decl.overloads) {
                    const args = overload.inputs.map((i, n) => `${i.name || `arg${n}`}: ${getType(i)}`)
                    const returnType = overload.outputs.length == 1 ? getType(overload.outputs[0]) : getTupleType(overload.outputs)
                    output.line(`async ${decl.name}(${args}): Promise<${returnType}>`)
                }
                output.block(`async ${decl.name}(...args: any[])`, () => {
                    output.line(`return this.call("${decl.name}", args)`);
                });
            } else {
                const overload = decl.overloads[0]
                const params = overload.inputs.map((i, n) => `${i.name || `arg${n}`}: ${getType(i)}`)
                const returnType = overload.outputs.length == 1 ? getType(overload.outputs[0]) : getTupleType(overload.outputs)
                output.block(`async ${decl.name}(${params.join(`, `)}): Promise<${returnType}>`, () => {
                    output.line(`return this.call("${decl.name}", [${overload.inputs.map((i, n) => `${i.name || `arg${n}`}`).join(`, `)}])`);
                });
            }
            output.line();
        }
        output.block(`private async call(name: string, args: any[]) : Promise<any>`, () => {
            output.line(`const fragment = abi.getFunction(name)`);
            output.line(`const data = abi.encodeFunctionData(fragment, args)`);
            output.line(`const result = await this._chain.client.call('eth_call', [{to: this.address, data}, this.blockHeight])`);
            output.line(`const decoded = abi.decodeFunctionResult(fragment, result)`);
            output.line(`return decoded.length > 1 ? decoded : decoded[0]`);
        })
    })

    output.line();

    output.block("function getJsonAbi(): any", () => {
        `return ${JSON.stringify(rawABI, null, 2)}`.split('\n').forEach(line => {
            output.line(line)
        });
    });

    fs.writeFileSync(outputPathRaw, output.toString());
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
        return "Array<" + getType(param.arrayChildren) + ">";
    }

    if (param.baseType === "tuple") {
        return getTupleType(param.components);
    }

    throw new Error("unknown type");
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

function getEvents(abi: Interface): AbiEvent[] {
    let res: Map<string, AbiEvent> = new Map()
    for (let event of Object.values(abi.events)) {
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

function getFunctions(abi: Interface): AbiFunction[] {
    let res: Map<string, AbiFunction> = new Map()
    for (let func of Object.values(abi.functions)) {
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

function getCalls(abi: Interface): AbiCall[] {
    let res: Map<string, AbiCall> = new Map()
    for (let func of Object.values(abi.functions)) {
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

interface AbiEvent {
    name: string;
    overloads: {
        inputs: ParamType[];
    }[]
}

interface AbiFunction {
    name: string;
    overloads: {
        inputs: ParamType[];
    }[]
}

interface AbiCall {
    name: string;
    overloads: {
        inputs: ParamType[];
        outputs: ParamType[];
    }[]
}
