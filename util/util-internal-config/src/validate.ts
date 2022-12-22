import type {Schema} from '@cfworker/json-schema'
import {esm} from '../esm'


export async function validate(obj: any, schema: Schema): Promise<void> {
    let {Validator} = await esm<typeof import('@cfworker/json-schema')>('@cfworker/json-schema')
    let validator = new Validator(schema, '2020-12')
    let result = validator.validate(obj)
    if (result.valid) return
    let err = result.errors.sort((a, b) => b.instanceLocation.length - a.instanceLocation.length)[0]
    throw new SchemaError(err.instanceLocation, err.error)
}


export class SchemaError extends Error {
    constructor(public readonly path: string, public readonly error: string) {
        super(`Invalid property: ${path}: ${error}`)
    }
}
