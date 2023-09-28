import {Primitive, Ti, Type, TypeKind, Variant} from '@subsquid/substrate-runtime/lib/metadata'
import {unexpectedCase} from '@subsquid/util-internal'
import {toCamelCase} from '@subsquid/util-naming'


export function isEmptyVariant(type: Type): boolean {
    return type.kind == TypeKind.Variant && type.variants.length == 0
}


export function asResultType(type: Type): {ok?: Ti, err?: Ti} | undefined {
    if (type.kind != TypeKind.Variant) return
    if (type.variants.length != 2) return

    let ok = type.variants.find(v => v.name == 'Ok')
    if (ok == null) return

    let err = type.variants.find(v => v.name == 'Err')
    if (err == null) return

    if (isValueVariant(ok) && isValueVariant(err)) return {
        ok: ok.fields[0]?.type,
        err: err.fields[0]?.type
    }
}


export function asOptionType(type: Type): {some?: Ti} | undefined {
    if (type.kind !== TypeKind.Variant) return
    if (type.variants.length != 2) return

    let some = type.variants.find(v => v.name == 'Some')
    if (some == null) return

    let none = type.variants.find(v => v.name == 'None')
    if (none == null) return

    if (isValueVariant(some) && none.fields.length == 0) return {
        some: some.fields[0]?.type
    }
}


function isValueVariant(v: Variant): boolean {
    return v.fields.length < 2 && v.fields[0]?.name == null
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


const jsReservedKeywords = new Set([
    'break',
    'case',
    'catch',
    'class',
    'const',
    'continue',
    'debugger',
    'default',
    'delete',
    'do',
    'else',
    'export',
    'extends',
    'false',
    'finally',
    'for',
    'function',
    'if',
    'import',
    'in',
    'instanceof',
    'new',
    'null',
    'return',
    'super',
    'switch',
    'this',
    'throw',
    'true',
    'try',
    'typeof',
    'var',
    'void',
    'while',
    'with',
    'let',
    'static',
    'yield',
    'await'
])


export function toJsName(name: string) {
    name = toCamelCase(name)
    if (jsReservedKeywords.has(name)) {
        return name + '_'
    } else {
        return name
    }
}


export function splitQualifiedName(qualifiedName: string): [pallet: string, item: string] {
    let parts = qualifiedName.split('.')
    if (parts.length != 2) throw new Error(
        `Invalid qualified name '${qualifiedName}'. ` +
        `Qualified name should follow {Pallet}.{item} pattern, e.g. 'Balances.Transfer'`
    )
    return [parts[0], parts[1]]
}
