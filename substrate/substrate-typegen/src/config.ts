import {getOldTypesBundle, QualifiedName} from '@subsquid/substrate-metadata'
import {read} from '@subsquid/util-internal-config'
import * as path from 'path'
import CONFIG_SCHEMA from './config.schema.json'


export interface Config {
    outDir: string
    specVersions: string
    typesBundle?: string
    events?: QualifiedName[] | boolean
    calls?: QualifiedName[] | boolean
    storage?: QualifiedName[] | boolean
    constants?: QualifiedName[] | boolean
}


export async function readConfig(file: string): Promise<Config> {
    let cfg: Config = await read(file, CONFIG_SCHEMA)
    let dir = path.dirname(path.resolve(file))
    let outDir = path.resolve(dir, cfg.outDir)

    let specVersions = cfg.specVersions
    if (specVersions) {
        if (!/^https?:\/\//.test(specVersions)) {
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
        events: cfg.events,
        calls: cfg.calls,
        storage: cfg.storage,
        constants: cfg.constants
    }
}
