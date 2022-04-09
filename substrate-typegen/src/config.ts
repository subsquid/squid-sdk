import type {QualifiedName} from "@subsquid/substrate-metadata"
import {getOldTypesBundle, OldTypesBundle, readOldTypesBundle} from "@subsquid/substrate-metadata"
import Ajv from "ajv"
import * as fs from "fs"
import * as path from "path"
import CHAIN_VERSIONS_SCHEMA from "./chainVersions.schema.json"
import CONFIG_SCHEMA from "./config.schema.json"
import {ChainVersion, TypegenOptions} from "./typegen"


interface Config {
    outDir: string
    chainVersions: string
    typesBundle?: string
    events?: QualifiedName[] | boolean
    calls?: QualifiedName[] | boolean
    storage?: QualifiedName[] | boolean
}


const ajv = new Ajv({
    messages: true,
    removeAdditional: false,
    verbose: true
})
const validateConfig = ajv.compile<Config>(CONFIG_SCHEMA)
const validateChainVersions = ajv.compile<ChainVersion[]>(CHAIN_VERSIONS_SCHEMA)


export function readConfig(file: string): TypegenOptions {
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
        let chainVersions = readChainVersions(path.resolve(dir, json.chainVersions))
        let typesBundle: OldTypesBundle | undefined
        if (json.typesBundle) {
            typesBundle = getOldTypesBundle(json.typesBundle) || readOldTypesBundle(path.resolve(dir, json.typesBundle))
        }
        return {
            outDir,
            chainVersions,
            typesBundle,
            events: json.events,
            calls: json.calls,
            storage: json.storage
        }
    } else {
        throw new ConfigError(`Invalid typegen config ${file}:\n  ${ajv.errorsText(validateConfig.errors, {separator: '\n  '})}`)
    }
}


function readChainVersions(file: string): ChainVersion[] {
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
    if (validateChainVersions(json)) {
        return json
    } else {
        throw new ConfigError(`Failed to extract chain versions from ${file}:\n  ${ajv.errorsText(validateChainVersions.errors, {separator: '\n  '})}`)
    }
}


export class ConfigError extends Error {}

