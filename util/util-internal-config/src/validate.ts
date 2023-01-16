import {Schema, validator} from '@exodus/schemasafe'


export function validate(obj: any, schema: Schema): void {
    let validate = validator(schema, {
        includeErrors: true,
        complexityChecks: true,
        requireSchema: true
    })
    if (validate(obj)) return
    let err = validate.errors?.[0]!
    throw new SchemaError(err.instanceLocation, err.keywordLocation)
}


export class SchemaError extends Error {
    constructor(public readonly path: string, public readonly schemaPath: string) {
        super(`invalid property: ${path}`)
    }

    get name(): string {
        return 'SchemaError'
    }
}
