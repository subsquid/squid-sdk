import {Type} from './type-checker'


export type GetType<T> = T extends Type<infer Js> ? Js : never


export type Simplify<T> = {
    [K in keyof T]: T[K]
} & {}


