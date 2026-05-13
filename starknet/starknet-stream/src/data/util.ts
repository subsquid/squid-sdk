export type Simplify<T> = {
    [K in keyof T]: T[K]
} & {}


export type GetFields<
    FieldSelectionType,
    Selection extends FieldSelectionType,
    K extends keyof FieldSelectionType
> = TrueFields<Selection[K]>


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
