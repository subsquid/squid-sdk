import Ajv, {JSONSchemaType, ValidateFunction} from "ajv"


export function makeValidator<T>(schema: JSONSchemaType<T>): ValidateFunction<T> {
    let ajv = new Ajv({
        messages: true,
        removeAdditional: false,
        verbose: true
    })

    return ajv.compile(schema)
}


export function printValidationErrors(validator: ValidateFunction, separator = ', '): string {
    if (!validator.errors?.length) return ''
    return validator.errors.map((e) => `data${e.instancePath} ${e.message}`)
        .reduce((text, msg) => text + separator + msg)
}


export function addErrorContext<T extends Error>(err: T, ctx: any): T {
    let e = err as any
    for (let key in ctx) {
        switch(key) {
            case 'blockHeight':
            case 'blockHash':
                if (e.blockHeight == null && e.blockHash == null) {
                    e.blockHeight = ctx.blockHeight
                    e.blockHash = ctx.blockHash
                }
                break
            default:
                if (e[key] == null) {
                    e[key] = ctx[key]
                }
        }
    }
    return err
}


export function withErrorContext(ctx: any): (err: Error) => never {
    return function(err: Error): never {
        throw addErrorContext(err, ctx)
    }
}
