import {Command} from "commander"
import {Typegen} from "./typegen"


export function run(): void {
    let program = new Command()
    program.description(`
Generates TypeScript definitions for wasm-contracts
to be used within mapping handlers.
    `.trim())
        .requiredOption('--metadata <path>', 'path to a JSON metadata file')
        .requiredOption('--output <path>', 'path for output typescript file');

    program.parse();
    let options = program.opts()

    new Typegen(options.metadata, options.output).generate()
}
