import {createLogger} from "@subsquid/logger"
import {getOldTypesBundle, OldSpecsBundle, OldTypesBundle, OldTypesBundleError, readOldTypesBundle} from "@subsquid/substrate-metadata"
import {ArchiveApi} from "@subsquid/substrate-metadata-explorer/lib/archiveApi"
import {readSpecVersions, SpecFileError, SpecVersion} from "@subsquid/substrate-metadata-explorer/lib/specVersion"
import {runProgram} from "@subsquid/util-internal"
import {Command} from "commander"
import {ConfigError, readConfig} from "./config"
import {Typegen} from "./typegen"


const log = createLogger('sqd:substrate-typegen')


runProgram(async () => {
    let program = new Command()

    program.description(`
Generates TypeScript classes for events, calls and storage items
    `.trim())

    program.argument('config', 'JSON file with options')

    let configFile = program.parse().args[0]
    let config = readConfig(configFile)

    let typesBundle: OldTypesBundle | OldSpecsBundle | undefined
    if (config.typesBundle) {
        typesBundle = getOldTypesBundle(config.typesBundle) || readOldTypesBundle(config.typesBundle)
    }

    let specVersions: SpecVersion[]
    if (/^https?:\/\//.test(config.specVersions)) {
        log.info(`downloading spec versions from ${config.specVersions}`)
        specVersions = await new ArchiveApi(config.specVersions, log.child('archive')).fetchVersions()
    } else {
        specVersions = readSpecVersions(config.specVersions)
    }

    Typegen.generate({
        outDir: config.outDir,
        specVersions,
        typesBundle,
        events: config.events,
        calls: config.calls,
        storage: config.storage,
        constants: config.constants
    })

}, err => {
    if (err instanceof ConfigError || err instanceof OldTypesBundleError || err instanceof SpecFileError) {
        log.fatal(err.message)
    } else {
        log.fatal(err)
    }
})
