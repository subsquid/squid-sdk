import camelcase from 'camelcase'
import {pluralize, underscore} from 'inflected'


export function toCamelCase(name: string, uppercaseFirstLetter = false): string {
    return camelcase(name, {pascalCase: uppercaseFirstLetter})
}


export function toSnakeCase(name: string): string {
    return underscore(name)
}


export function toPlural(name: string): string {
    return pluralize(name)
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
    'await',
    'enum',
    'implements',
    'interface',
    'package',
    'private',
    'protected',
    'public',
])


export function toJsName(name: string) {
    if (jsReservedKeywords.has(name)) {
        return name + '_'
    } else {
        return name
    }
}
