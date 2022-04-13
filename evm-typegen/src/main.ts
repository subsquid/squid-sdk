import { program } from "commander";
import process from "process";
import path from "path";
import fs from "fs";
import { Output } from "@subsquid/util-internal-code-printer";
import { AbiCoder } from "@ethersproject/abi";

export function run(): void {
    program.description(`
Generates TypeScript definitions for evm log events
for use within substrate-processor mapping handlers.
    `.trim())
        .option('--input <path>', 'path of JSON abi file')
        .option('--output <path>', 'path for output typescript file');

    program.parse();

    const options = program.opts();
    const inputPath = options.input;
    const outputPath = options.output;

    try {
        generateTsFromAbi(inputPath, outputPath);
    } catch(e: any) {
        printError(e);
        process.exit(1);
    }
}

function printError(err: any) {
    console.error(`substrate-typegen ${err.toString()}`);
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

    output.line("import { Interface } from \"@ethersproject/abi\";");
    output.line("import ethers from \"ethers\";");
    output.line("import { EvmLogHandlerContext } from \"@subsquid/substrate-evm-processor\";");
    output.line(`import inputJson from "${path.resolve(inputPathRaw)}";`);
    output.line("");
    output.line("const abi = new Interface(inputJson);");
    output.line("");

    const eventTypeIndexes: { [key: string]: number } = {};

    const abiEvents = rawABI.filter((decl: any): boolean => decl.type === "event").map((decl: any): any => {
        let signature = `${decl.name}(`;
    
        if(decl.inputs.length > 0) {
            signature += decl.inputs[0].type;
        }
    
        for (let i=1; i<decl.inputs.length; ++i) {
            const input = decl.inputs[i];
            signature += `,${input.type}`;
        }
    
        signature += ")";
    
        decl.signature = signature;
        if (eventTypeIndexes[decl.name] === undefined) {
            eventTypeIndexes[decl.name] = 0;
        } else {
            eventTypeIndexes[decl.name]++;
        }
        decl.eventTypeName = decl.name + eventTypeIndexes[decl.name].toString();
    
        return decl;
    });

    const abiCoder = new AbiCoder();

    for(const decl of abiEvents) {
        output.block(`export interface ${decl.eventTypeName}Event`, () => {
            for (const input of decl.inputs) {
                output.line(`\t${input.name}: ${getType(input)};`);
            }
        });
        output.line("");
    }

    output.block("export const events =", () => {
        for(const decl of abiEvents) {
            output.block(`"${decl.signature}": `, () => {
                output.line(`topic: abi.getEventTopic("${decl.signature}"),`);
                output.block(`decode(data: EvmLogHandlerContext): ${decl.eventTypeName}Event`, () => {
                    output.line(`const result = abi.decodeEventLog(`);
                    output.line(`\tabi.getEvent("${decl.signature}"),`);
                    output.line(`\tdata.data || "",`);
                    output.line("\tdata.topics");
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

    fs.writeFileSync(outputPathRaw, output.toString());
}

// taken from: https://github.com/ethers-io/ethers.js/blob/948f77050dae884fe88932fd88af75560aac9d78/packages/cli/src.ts/typescript.ts#L10
function getType(param: any, flexible?: boolean): string {
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
        let struct = param.components.map((p: any, i: any): any => `${p.name || "p_" + i}: ${getType(p, flexible)}`);
        return "{ " + struct.join(", ") + " }";
    }

    throw new Error("unknown type");
}
