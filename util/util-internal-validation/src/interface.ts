import {ValidationFailure} from './error'


export interface Validator<T=unknown, S=T> {
    cast(value: unknown): T | ValidationFailure
    validate(value: unknown): ValidationFailure | undefined
    phantom(): S
}


export type GetCastType<V> = V extends Validator<infer T, infer S>
    ? T
    : V extends undefined ? undefined : never


export type GetSrcType<V> = V extends Validator<infer T, infer S>
    ? S
    : V extends undefined ? undefined : never
