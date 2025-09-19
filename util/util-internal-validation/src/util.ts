export type AddOptionToUndefined<T> = {
    [K in keyof T as undefined extends T[K] ? never : K]: T[K]
} & {
    [K in keyof T as undefined extends T[K] ? K : never]+?: T[K]
}


export type Simplify<T> = {
    [K in keyof T]: T[K]
} & {}


export function print(val: unknown): string {
    if (val === undefined) return 'undefined'
    return JSON.stringify(val, (_, v) => typeof v === 'bigint' ? v.toString() : v)
}
