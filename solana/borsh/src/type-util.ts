/**
 * Base58 encoded binary string
 */
export type Base58Bytes = string


export type AddOptionToUndefined<T> = {
    [K in keyof T as undefined extends T[K] ? never : K]: T[K]
} & {
    [K in keyof T as undefined extends T[K] ? K : never]+?: T[K]
}


export type Simplify<T> = {
    [K in keyof T]: T[K]
} & {}
