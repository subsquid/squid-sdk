import {ConfigError, read} from '@subsquid/util-internal-config'
import * as fs from 'fs/promises'
import * as Path from 'path'
import * as process from 'process'
import SCHEMA from './commands.schema.json'


export interface Config {
    /**
     * Src file
     */
    file: string
    /**
     * Name -> Command
     */
    commands?: Record<string, Command>
}


export interface Command {
    description?: string
    deps?: string[]
    cmd?: CmdArg[]
    hidden?: boolean
    workdir?: string
    env?: Record<string, string>
}


export type CmdArg = string | {glob: string}


export function readConfig(file: string): Promise<Config> {
    return read<Config>(file, SCHEMA as any).then(
        cfg => {
            return {...cfg, file}
        },
        err => {
            if (err instanceof ConfigError) {
                throw new InvalidConfig(err.error, file)
            } else {
                throw err
            }
        }
    )
}


export class InvalidConfig extends Error {
    constructor(error: string, public readonly file?: string) {
        super(error)
    }

    get name(): string {
        return 'InvalidConfig'
    }
}


export async function resolveConfig(cwd?: string): Promise<string> {
    cwd = Path.resolve(cwd ?? process.cwd())
    let candidate = Path.join(cwd, 'commands.json')
    try {
        await fs.access(candidate, fs.constants.R_OK)
        return candidate
    } catch(err: any) {
        if (err.code == 'ENOENT') {
            let parent = Path.dirname(cwd)
            if (parent == cwd) {
                throw new ConfigNotFound()
            } else {
                return resolveConfig(parent)
            }
        } else {
            throw err
        }
    }
}


export class ConfigNotFound extends Error {
    constructor() {
        super('failed to locate commands.json')
    }

    get name(): string {
        return 'ConfigNotFound'
    }
}


export async function getConfig(cwd?: string): Promise<Config> {
    let file = await resolveConfig(cwd)
    return readConfig(file)
}
