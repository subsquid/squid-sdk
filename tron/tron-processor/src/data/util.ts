export type Simplify<T> = {
    [K in keyof T]: T[K]
} & {}


export type ExcludeUndefined<T> = {
    [K in keyof T as undefined extends T[K] ? never : K]: T[K]
} & {}


export type GetFields<
    FieldSelectionType,
    Defaults extends FieldSelectionType,
    Selection extends FieldSelectionType,
    K extends keyof FieldSelectionType
> = TrueFields<MergeDefault<Selection[K], Defaults[K]>>


type MergeDefault<T, D> = Simplify<
    undefined extends T ? D : Omit<D, keyof ExcludeUndefined<T>> & ExcludeUndefined<T>
>


export type TrueFields<F> = keyof {
    [K in keyof F as true extends F[K] ? K : never]: true
}


export type Select<T, Fields> = T extends any ? Simplify<Pick<T, Extract<keyof T, Fields>>> : never


export type Selector<Fields extends string | number | symbol> = {
    [P in Fields]?: boolean
}


export type MakePartial<T, Required extends keyof T> = Simplify<
    Pick<T, Required> &
    {
        [K in keyof T as K extends Required ? never : K]+?: T[K]
    }
>
