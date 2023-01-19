import {FileOutput} from "@subsquid/util-internal-code-printer"
import {Command} from "commander"
import {Typegen} from "./typegen"


export function run(): void {
    let program = new Command()

    program.description(`
Generates TypeScript API for decoding ink! events, messages and constructors.
    `.trim())

    program.requiredOption('--abi <path>', 'path to a JSON metadata file')
    program.requiredOption('--output <path>', 'path for output typescript file')

    let options = program.parse().opts() as {
        abi: string
        output: string
    }

    let out = new FileOutput(options.output)

    new Typegen(options.abi, out).generate()

    out.write()
}

