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
