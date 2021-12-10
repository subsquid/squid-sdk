import camelcase from "camelcase"
import {pluralize, underscore} from "inflected"


const CAMEL_CASE_CACHE: Record<string, string> = {}


export function getCamelCase(name: string): string {
    let cc = CAMEL_CASE_CACHE[name]
    if (cc == null) {
        cc = CAMEL_CASE_CACHE[name] = toCamelCase(name)
    }
    return cc
}


export function toCamelCase(name: string): string {
    return camelcase(name)
}


export function toSnakeCase(name: string): string {
    return underscore(name)
}


export function toPlural(name: string): string {
    return pluralize(name)
}
