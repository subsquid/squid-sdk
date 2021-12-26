import {OldTypesBundleError} from "@subsquid/substrate-metadata"
import {Command} from "commander"
import * as process from "process"
import {ConfigError, readConfig} from "./config"
import {Typegen} from "./typegen"


export function run(): void {
    let program = new Command()

    program.description(`
Generates TypeScript definitions for chain events and extrinsics
for use within substrate-processor mapping handlers.
    `.trim())

    program.argument('config', 'JSON file with options')

    let configFile = program.parse().args[0]

    try {
        let config = readConfig(configFile)
        Typegen.generate(config)
    } catch(e: any) {
        printError(e)
        process.exit(1)
    }
}


function printError(err: Error) {
    if (err instanceof ConfigError || err instanceof OldTypesBundleError) {
        console.error(`error: ${err.message}`)
    } else {
        console.error(err)
    }
}
