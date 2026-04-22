/**
 * Flattens an intersection type into a single object shape for nicer IDE hover
 * output. The trailing `& {}` is a no-op at the type level but forces the
 * compiler to normalize the representation.
 */
export type Simplify<T> = {[K in keyof T]: T[K]} & {}

/**
 * Extracts the string keys of `F` whose values include the literal `true`.
 *
 * @example
 * type Keys = TrueFields<{a: true; b: false; c?: boolean}>
 * // "a" | "c"  -- `c`'s type includes `true` through `boolean`
 */
export type TrueFields<F> = {
    [K in keyof F]-?: true extends F[K] ? K : never
}[keyof F]

/**
 * Picks the set of truthy field keys for a given section `K` of a
 * `FieldSelection`-shaped type `F`.
 */
export type GetFields<F, K extends keyof F> = TrueFields<F[K]>

/**
 * Picks `Fields` from `T` while distributing over unions, so members of a
 * discriminated union are narrowed independently.
 */
export type Select<T, Fields> = T extends any ? Simplify<Pick<T, Extract<keyof T, Fields>>> : never

/**
 * Optional boolean flag map over a finite set of string keys.
 *
 * Shape: `{[K in Fields]?: boolean}` - equivalent to `Partial<Record<Fields, boolean>>`.
 */
export type Selector<Fields extends PropertyKey> = {
    [P in Fields]?: boolean
}

/**
 * Produces a type with `Required` keys kept as-is and all other keys made
 * optional.
 */
export type MakePartial<T, Required extends keyof T> = Simplify<Pick<T, Required> & Partial<Omit<T, Required>>>
