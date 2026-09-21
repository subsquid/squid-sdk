export type Simplify<T> = {
    [K in keyof T]: T[K]
} & {}


export type Selector<Fields extends string | number | symbol> = {
    [P in Fields]?: boolean
}


export type Select<T, F> = T extends any ? Simplify<Pick<T, Extract<keyof T, F>>> : never


export type GetFields<F> = keyof {
    [K in keyof F as true extends F[K] ? K : never]: true
}


export type AddPrefix<Prefix extends string, S extends string> = `${Prefix}${Capitalize<S>}`


export type RemovePrefix<Prefix extends string, T>
    = T extends `${Prefix}${infer S}`
    ? Uncapitalize<S>
    : never
