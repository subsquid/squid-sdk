import {program} from "commander";
import process from "process";
import path from "path";
import fs from "fs";
import {Output} from "@subsquid/util-internal-code-printer";
import {toCamelCase} from "@subsquid/util-naming";
import {EventFragment, FunctionFragment, Interface, ParamType} from "@ethersproject/abi";

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

    const typeNames: {[key: string]: number} = {};

    const abiEvents: Array<AbiEvent> = Object.values(abi.events).map((event: EventFragment): AbiEvent => {
        let eventTypeName = `${event.name}`;
        if (typeNames[event.name]) {
            eventTypeName += typeNames[event.name].toString();
            typeNames[event.name]++;
        } else {
            eventTypeName += "0";
            typeNames[event.name] = 1;
        }
        eventTypeName += 'Event'
        
        let signature = `${event.name}(`;
        if (event.inputs.length > 0) {
            signature += event.inputs[0].type;
        }
        for (let i = 1; i < event.inputs.length; ++i) {
            const input = event.inputs[i];
            signature += `,${input.type}`;
        }
        signature += ")";

        return {
            signature,
            eventTypeName,
            inputs: event.inputs,
        };
    });

    for (const decl of abiEvents) {
        output.line(`export type ${decl.eventTypeName} = ${paramsToTypeString(decl.inputs)}`)
        output.line("");
    }

    output.block("export interface EvmEvent", () => {
        output.line("data: string;");
        output.line("topics: string[];");
    });

    output.line();

    output.block(`function decodeEvent(signature: string, data: EvmEvent): any`, () => {
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
            output.block(`"${decl.signature}":`, () => {
                output.line(`topic: abi.getEventTopic("${decl.signature}"),`);
                output.block(`decode(data: EvmEvent): ${decl.eventTypeName}`, () => {
                    output.line(`return decodeEvent("${decl.signature}", data)`);
                });
            });
            output.line(",");
        }
    });

    output.line();

    let abiFunctions: Map<string, AbiFunction> = new Map()
    for (let func of Object.values(abi.functions)) {
        if (!func.constant || func.outputs == null) continue

        let abiFunction = abiFunctions.get(func.name)
        if (abiFunction == null) {
            abiFunction = {
                name: func.name,
                overloads: []
            }
            abiFunctions.set(func.name, abiFunction)
        }

        const normalizedName = toCamelCase(func.name)

        let returnTypeName: string | undefined
        if (func.outputs.length > 1) {
            returnTypeName = `${normalizedName[0].toUpperCase()}${normalizedName.slice(1)}${abiFunction.overloads.length}Result`
            output.line(`export type ${returnTypeName} = ${paramsToTypeString(func.outputs)}`)
            output.line();
        } else {
            returnTypeName = getType(func.outputs[0])
        }

        abiFunction.overloads.push({
            inputs: func.inputs,
            outputs: func.outputs || [],
            returnTypeName
        })
    }

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
        for (const decl of abiFunctions.values()) {
            if (decl.overloads.length > 1) {
                for (let overload of decl.overloads) {
                    const args = overload.inputs.map((i, n) => `${i.name || `arg${n}`}: ${getType(i)}`)
                    const returnType = overload.returnTypeName
                    output.line(`async ${decl.name}(${args}): Promise<${returnType}>`)
                }
                output.block(`async ${decl.name}(...args: any[])`, () => {
                    output.line(`return await this.call("${decl.name}", args)`);
                });
            } else {
                const overload = decl.overloads[0]
                const params = overload.inputs.map((i, n) => `${i.name || `arg${n}`}: ${getType(i)}`)
                const returnType = overload.returnTypeName
                output.block(`async ${decl.name}(${params.join(`, `)}): Promise<${returnType}>`, () => {
                    output.line(`return await this.call("${decl.name}", [${overload.inputs.map((i, n) => `${i.name || `arg${n}`}`).join(`, `)}])`);
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
function getType(param: ParamType, flexible?: boolean): string {
    if (param.type === "address" || param.type === "string") {return "string";}

    if (param.type === "bool") {return "boolean"}

    if (param.type.substring(0, 5) === "bytes") {
        if (flexible) {
            return "string | ethers.utils.BytesLike";
        }
        return "string"
    }

    let match = param.type.match(/^(u?int)([0-9]+)$/)
    if (match) {
        if (flexible) {
            return "ethers.BigNumberish";
        }
        if (parseInt(match[2]) < 53) {return 'number';}
        return 'ethers.BigNumber';
    }

    if (param.baseType === "array") {
        return "Array<" + getType(param.arrayChildren) + ">";
    }

    if (param.baseType === "tuple") {
        let struct = param.components.map((p, i) => `${p.name || "p_" + i}: ${getType(p, flexible)}`);
        return "{ " + struct.join(", ") + " }";
    }

    throw new Error("unknown type");
}

function paramsToTypeString(params: ParamType[]) {
    return `[${params.map((p) => getType(p)).join(`, `)}] ` +
    `& {${params.filter((p) => p.name != null).map((p) => `${p.name}: ${getType(p)}`).join(`, `)}}`
}

interface AbiEvent {
    signature: string;
    eventTypeName: string;
    inputs: ParamType[];
}

interface AbiFunction {
    name: string;
    overloads: {
        inputs: ParamType[];
        outputs: ParamType[];
        returnTypeName?: string;
    }[]
}