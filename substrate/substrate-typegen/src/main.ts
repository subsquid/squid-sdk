import {HttpClient} from '@subsquid/http-client'
import {createLogger} from '@subsquid/logger'
import {
    readSpecVersions,
    SpecFileError,
    SpecVersion,
    validateSpecVersion
} from '@subsquid/substrate-metadata-explorer/lib/specVersion'
import {
    getOldTypesBundle,
    OldSpecsBundle,
    OldTypesBundle,
    OldTypesBundleError,
    readOldTypesBundle
} from '@subsquid/substrate-runtime/lib/metadata'
import {last, runProgram} from '@subsquid/util-internal'
import {ConfigError} from '@subsquid/util-internal-config'
import {Command} from 'commander'
import {readConfig} from './config'
import {Typegen} from './typegen'


const log = createLogger('sqd:substrate-typegen')


runProgram(async () => {
    let program = new Command()

    program.description(`
Generates TypeScript classes for events, calls and storage items
    `.trim())

    program.argument('[config...]', 'JSON file with options')

    for (let configFile of program.parse().processedArgs[0]){
        log.info(`using ${configFile}`)

        let config = await readConfig(configFile)

        let typesBundle: OldTypesBundle | OldSpecsBundle | undefined
        if (config.typesBundle) {
            typesBundle = getOldTypesBundle(config.typesBundle) || readOldTypesBundle(config.typesBundle)
        }

        let specVersions: SpecVersion[]
        if (/^https?:\/\//.test(config.specVersions)) {
            log.info(`downloading spec versions from ${config.specVersions}`)
            specVersions = await downloadSpecVersions(config.specVersions)
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
            constants: config.constants,
            pallets: config.pallets
        })
    }
}, err => {
    if (err instanceof ConfigError || err instanceof OldTypesBundleError || err instanceof SpecFileError) {
        log.fatal(err.message)
    } else {
        log.fatal(err)
    }
})


async function downloadSpecVersions(url: string): Promise<SpecVersion[]> {
    let versions: SpecVersion[] = []
    let http = new HttpClient()
    let res: NodeJS.ReadableStream = await http.get(url, {stream: true})
    for await (let line of lines(res)) {
        let rec = JSON.parse(line)
        let error = validateSpecVersion(rec)
        if (error) throw new Error(`invalid spec record in response: ${error}`)
        versions.push(rec)
    }
    return versions
}


async function *lines(input: NodeJS.ReadableStream): AsyncIterable<string> {
    input.setEncoding('utf-8')
    let buf = ''
    for await (let chunk of input) {
        let ls = (chunk as string).split(/\r\n|\n|\r/)
        if (ls.length == 1) {
            buf += ls[0]
        } else {
            for (let i = 0; i < ls.length - 1; i++) {
                let line = buf + ls[i]
                if (line) {
                    yield line
                    buf = ''
                }
            }
            buf = last(ls)
        }
    }
    if (buf) {
        yield buf
    }
}
