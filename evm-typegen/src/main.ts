import {program} from "commander"
import path from "path"
import process from "process"
import {Typegen} from "./typegen"

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

    if (path.parse(inputPath).ext !== ".json") {
        throw new Error("invalid abi file extension");
    }

    if (path.parse(outputPath).ext !== ".ts") {
        throw new Error("invalid output file extension");
    }

    try {
        new Typegen(inputPath, outputPath).generate();
    } catch (err: any) {
        console.error(`evm-typegen error: ${err.toString()}`);
        process.exit(1);
    }
}
