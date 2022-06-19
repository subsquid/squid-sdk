import type {QualifiedName} from "@subsquid/substrate-metadata"
import {getOldTypesBundle} from "@subsquid/substrate-metadata"
import * as fs from "fs"
import * as path from "path"
import CONFIG_SCHEMA from "./config.schema.json"
import {makeValidator, printValidationErrors} from "./util"


export interface Config {
    outDir: string
    specVersions: string
    typesBundle?: string
    events?: QualifiedName[] | boolean
    calls?: QualifiedName[] | boolean
    storage?: QualifiedName[] | boolean
}


const validateConfig = makeValidator<Config>(CONFIG_SCHEMA as any)


export function readConfig(file: string): Config {
    let content: string
    try {
        content = fs.readFileSync(file, 'utf-8')
    } catch(e: any) {
        throw new ConfigError(`Failed to read ${file}: ${e}`)
    }
    let json: unknown
    try {
        json = JSON.parse(content)
    } catch(e: any) {
        throw new ConfigError(`Failed to parse ${file}: ${e}`)
    }
    if (validateConfig(json)) {
        let dir = path.dirname(path.resolve(file))
        let outDir = path.resolve(dir, json.outDir)
        let specVersions = json.specVersions
        if (specVersions) {
            if (!/^https?:\/\//.test(specVersions)) {
                specVersions = path.resolve(dir, specVersions)
            }
        }
        let typesBundle = json.typesBundle
        if (typesBundle && getOldTypesBundle(typesBundle) == null) {
            typesBundle = path.resolve(dir, typesBundle)
        }
        return {
            outDir,
            specVersions,
            typesBundle,
            events: json.events,
            calls: json.calls,
            storage: json.storage
        }
    } else {
        throw new ConfigError(`Invalid typegen config ${file}:\n  ${printValidationErrors(validateConfig, '\n  ', 'config')}`)
    }
}


export class ConfigError extends Error {}

