import {QualifiedName} from '@subsquid/substrate-runtime'
import {getOldTypesBundle} from '@subsquid/substrate-runtime/lib/metadata'
import {read} from '@subsquid/util-internal-config'
import * as path from 'path'
import CONFIG_SCHEMA from './config.schema.json'


export interface PalletRequest {
    events?: string[] | boolean
    calls?: string[] | boolean
    storage?: string[] | boolean
    constants?: string[] | boolean
}


export interface Config {
    outDir: string
    specVersions: string
    typesBundle?: string
    pallets: Record<string, PalletRequest> | boolean
}


export async function readConfig(file: string): Promise<Config> {
    let cfg: Config = await read(file, CONFIG_SCHEMA)
    let dir = path.dirname(path.resolve(file))
    let outDir = path.resolve(dir, cfg.outDir)

    let specVersions = cfg.specVersions
    if (specVersions) {
        if (!/^https?:\//.test(specVersions)) {
            specVersions = path.resolve(dir, specVersions)
        }
    }

    let typesBundle = cfg.typesBundle
    if (typesBundle && getOldTypesBundle(typesBundle) == null) {
        typesBundle = path.resolve(dir, typesBundle)
    }

    return {
        outDir,
        specVersions,
        typesBundle,
        pallets: cfg.pallets
    }
}
