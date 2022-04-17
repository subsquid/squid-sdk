import { program } from "commander";
import process from "process";
import path from "path";
import fs from "fs";
import { Output } from "@subsquid/util-internal-code-printer";
import { EventFragment, Interface, ParamType } from "@ethersproject/abi";

export function run(): void {
    program.description(`
Generates TypeScript definitions for evm log events
for use within substrate-processor mapping handlers.
    `.trim())
        .requiredOption('--input <path>', 'path of JSON abi file')
        .requiredOption('--output <path>', 'path for output typescript file');

    program.parse();

    const options = program.opts();
    const inputPath = options.input;
    const outputPath = options.output;

    try {
        generateTsFromAbi(inputPath, outputPath);
    } catch(err: any) {
        console.error(`evm-typegen error: ${err.toString()}`);
        process.exit(1);
    }
}

function generateTsFromAbi(inputPathRaw: string, outputPathRaw: string): void {
    const inputPath = path.parse(inputPathRaw);
    const outputPath = path.parse(outputPathRaw);

    if (inputPath.ext !== ".json") {
        throw new Error("invalid input file extension");
    }

    if (outputPath.ext !== ".ts") {
        throw new Error("invalid output file extension");
    }

    const rawABI = JSON.parse(fs.readFileSync(inputPathRaw, { encoding: "utf-8" }));    

    const output = new Output();

    output.line("import ethers from \"ethers\";");
    output.line("");
    output.line(`const inputJson = getInputJson();`);
    output.line("");
    output.line("const abi = new ethers.utils.Interface(inputJson);");
    output.line("");

    // validate the abi
    const abi = new Interface(rawABI);

    const abiEvents: Array<AbiEvent> = Object.values(abi.events).map((event: EventFragment): AbiEvent => {
        let signature = `${event.name}(`;
        let eventTypeName = `${event.name}`;

        if(event.inputs.length > 0) {
            signature += event.inputs[0].type;
            eventTypeName += capitalize(event.inputs[0].type);
        }
    
        for (let i=1; i<event.inputs.length; ++i) {
            const input = event.inputs[i];
            signature += `,${input.type}`;
            eventTypeName += capitalize(input.type);
        }
    
        signature += ")";
    
        return {
            signature,
            eventTypeName,
            inputs: event.inputs,
        };
    });

    for(const decl of abiEvents) {
        output.block(`export interface ${decl.eventTypeName}Event`, () => {
            for (const input of decl.inputs) {
                output.line(`${input.name}: ${getType(input)};`);
            }
        });
        output.line("");
    }

    output.block("export const events =", () => {
        for(const decl of abiEvents) {
            output.block(`"${decl.signature}": `, () => {
                output.line(`topic: abi.getEventTopic("${decl.signature}"),`);
                output.block(`decode(data: EvmEvent): ${decl.eventTypeName}Event`, () => {
                    output.line(`const result = abi.decodeEventLog(`);
                    output.indentation(() => {
                        output.line(`abi.getEvent("${decl.signature}"),`);
                        output.line(`data.data || "",`);
                        output.line("data.topics");
                    });
                    output.line(");");
                    output.block("return ", () => {
                        for (let i=0; i<decl.inputs.length; ++i) {
                            const input = decl.inputs[i];
                            output.line(`${input.name}: ${`result[${i}]`},`);
                        }
                    });
                });
            });
            output.line(",");
        }
    });

    output.line("");

    output.block("export interface EvmEvent", () => {
        output.line("data: string;");
        output.line("topics: string[];");
    });

    output.line("");

    output.block("function getInputJson(): string", () => {
        output.line(`return \`${JSON.stringify(rawABI, null, 2)}\`;`);
    });
    
    output.line("");

    fs.writeFileSync(outputPathRaw, output.toString());
}

// taken from: https://github.com/ethers-io/ethers.js/blob/948f77050dae884fe88932fd88af75560aac9d78/packages/cli/src.ts/typescript.ts#L10
function getType(param: ParamType, flexible?: boolean): string {
    if (param.type === "address" || param.type === "string") { return "string"; }

    if (param.type === "bool") { return "boolean" }

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
        if (parseInt(match[2]) < 53) { return 'number'; }
        return 'ethers.BigNumber';
    }

    if (param.type === "array") {
        return "Array<" + getType(param.arrayChildren) + ">";
    }

    if (param.type === "tuple") {
        let struct = param.components.map((p, i) => `${p.name || "p_" + i}: ${getType(p, flexible)}`);
        return "{ " + struct.join(", ") + " }";
    }

    throw new Error("unknown type");
}

interface AbiEvent {
    signature: string;
    eventTypeName: string;
    inputs: ParamType[];
}

function capitalize(input: string): string {
    return input.charAt(0).toUpperCase() + input.slice(1);
}