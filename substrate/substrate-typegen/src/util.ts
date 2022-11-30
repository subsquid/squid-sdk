import {Primitive, Ti, Type, TypeKind} from "@subsquid/substrate-metadata"
import {unexpectedCase} from "@subsquid/util-internal"
import Ajv, {JSONSchemaType, ValidateFunction} from "ajv"


export function isEmptyVariant(type: Type): boolean {
    return type.kind == TypeKind.Variant && type.variants.length == 0
}


export function asResultType(type: Type): {ok: Ti, err: Ti} | undefined {
    if (type.kind != TypeKind.Variant) return undefined
    if (type.variants.length != 2) return undefined
    let v0 = type.variants[0]
    let v1 = type.variants[1]
    let yes = v0.name == 'Ok' &&
        v0.index == 0 &&
        v0.fields.length == 1 &&
        v0.fields[0].name == null &&
        v1.name == 'Err' &&
        v1.index == 1 &&
        v1.fields.length == 1 &&
        v1.fields[0].name == null
    return yes ? {ok: v0.fields[0].type, err: v1.fields[0].type} : undefined
}


export function asOptionType(type: Type): {some: Ti} | undefined {
    if (type.kind !== TypeKind.Variant) return
    if (type.variants.length != 2) return
    let v0 = type.variants[0]
    let v1 = type.variants[1]
    let yes = v0.name == 'None' &&
        v0.fields.length == 0 &&
        v0.index == 0 &&
        v1.name == 'Some' &&
        v1.index == 1 &&
        v1.fields.length == 1 &&
        v1.fields[0].name == null

    if (yes) return {
        some: v1.fields[0].type
    }
}


export function toNativePrimitive(primitive: Primitive): string {
    switch(primitive) {
        case "I8":
        case "U8":
        case "I16":
        case "U16":
        case "I32":
        case "U32":
            return "number"
        case "I64":
        case "U64":
        case "I128":
        case "U128":
        case "I256":
        case "U256":
            return "bigint"
        case "Bool":
            return "boolean"
        case "Str":
            return "string"
        default:
            throw unexpectedCase(primitive)
    }
}


export function groupBy<T, G>(arr: T[], group: (t: T) => G): Map<G, T[]> {
    let grouping = new Map<G, T[]>()
    for (let i = 0; i < arr.length; i++) {
        let item = arr[i]
        let key = group(item)
        let g = grouping.get(key)
        if (g == null) {
            grouping.set(key, [item])
        } else {
            g.push(item)
        }
    }
    return grouping
}


export function upperCaseFirst(s: string): string {
    return s[0].toUpperCase() + s.slice(1)
}


export function makeValidator<T>(schema: JSONSchemaType<T>): ValidateFunction<T> {
    let ajv = new Ajv({
        messages: true,
        removeAdditional: false,
        verbose: true
    })

    return ajv.compile(schema)
}


export function printValidationErrors(validator: ValidateFunction, separator = ', ', data = 'data'): string {
    if (!validator.errors?.length) return ''
    return validator.errors.map((e) => `${data}${e.instancePath} ${e.message}`)
        .reduce((text, msg) => text + separator + msg)
}
