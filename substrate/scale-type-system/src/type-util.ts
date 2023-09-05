import {Type} from './type-checker'


export type GetType<T> = T extends Type<infer Js> ? Js : never


export type Simplify<T> = T extends any ? {
    [K in keyof T]: T[K]
} & {} : never


export type ValueCase<K, T> = [unknown] extends [T]
    ? {__kind: K, value: T}
    : [null] extends [T]
        ? {__kind: K}
        : [undefined] extends [T]
            ? {__kind: K, value?: T}
            : {__kind: K, value: T}
