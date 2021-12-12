import camelcase from "camelcase"
import {pluralize, underscore} from "inflected"


export function toCamelCase(name: string): string {
    return camelcase(name)
}


export function toSnakeCase(name: string): string {
    return underscore(name)
}


export function toPlural(name: string): string {
    return pluralize(name)
}
