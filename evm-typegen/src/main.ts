import { Command } from "commander";
import process from "process";
import path from "path";
import fs from "fs";
import { Output } from "@subsquid/util-internal-code-printer"
import ethersABI from "@ethersproject/abi";

export function run(): void {
    const program = new Command();

    program.description(`
Generates TypeScript definitions for evm log events
for use within substrate-processor mapping handlers.
    `.trim());

    program.option('input', 'path of JSON abi file');

    program.option('output', 'path for output typescript file');

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
    output.line("import { EvmLogHandlerContext } from \"@subsquid/substrate-evm-processor\";");
    output.line(`import inputJson from ${inputPathRaw};`);
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


    for(const decl of abiEvents) {
        output.block(`export interface ${decl.eventTypeName}Event`, () => {
            for (const input of decl.inputs) {
                output.line(`\t${input.name}: ${ethersABI.FormatTypes[input.type]};`);
            }
        });
        output.line("");
    }

    output.block("export const events =", () => {
        for(const decl of abiEvents) {
            output.block(`${decl.signature}: `, () => {
                output.line(`topic: abi.getEventTopic("${decl.signature}"),`);
                output.block(`decode(data: EvmLogHandlerContext): ${decl.eventTypeName}Event`, () => {
                    output.line(`const result = abi.decodeEventLog(`);
                    output.line(`\tabi.getEvent("${decl.signature}"),`);
                    output.line(`\tdata.data || "",`);
                    output.line("\tdata.topics");
                    output.line(");");
                    for (let i=0; i<decl.inputs.length; ++i) {
                        const input = decl.inputs[i];
                        output.line(`${input.name}: ${`result[${i}]`},`);
                    }
                });
            });
        }
    });

    fs.writeFileSync(outputPathRaw, output.toString());
}
