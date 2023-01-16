import type {Schema} from '@exodus/schemasafe'
import * as fs from 'fs/promises'
import {JsonSyntaxError, parse} from './parse'
import {SchemaError, validate} from './validate'


export {parse, JsonSyntaxError, validate, SchemaError}


export async function read<T>(file: string, schema?: Schema): Promise<T> {
    let content = await fs.readFile(file, 'utf-8')
    try {
        let value = parse(content)
        if (schema) {
            validate(value, schema)
        }
        return value
    } catch(err: any) {
        if (err instanceof JsonSyntaxError) {
            throw new ConfigError(file, `json syntax error: ${err.code}`)
        } else if (err instanceof SchemaError) {
            throw new ConfigError(file, err.message)
        } else {
            throw err
        }
    }
}


export class ConfigError extends Error {
    constructor(public readonly file: string, public readonly error: string) {
        super(`invalid ${file}: ${error}`)
    }

    get name(): string {
        return 'ConfigError'
    }
}
