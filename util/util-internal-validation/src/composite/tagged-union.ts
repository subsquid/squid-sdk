import {ValidationFailure} from '../error'
import {GetCastType, GetSrcType, Validator} from '../interface'
import {Simplify, print} from '../util'


export type GetTaggedUnionCast<F extends string, U> = Simplify<{
    [C in keyof U]: GetCastType<U[C]> & {[T in F]: C}
}[keyof U]>


export type GetTaggedUnionSrc<F extends string, U> = Simplify<{
    [C in keyof U]: GetSrcType<U[C]> & {[T in F]: C}
}[keyof U]>


export class TaggedUnion<F extends string, U extends Record<string, Validator<any>>>
    implements Validator<GetTaggedUnionCast<F, U>, GetTaggedUnionSrc<F, U>>
{
    private wrongTagMessage: string

    constructor(
        public readonly tagField: F,
        public readonly variants: U
    ) {
        this.wrongTagMessage = `got {value}, but expected one of ${print(Object.keys(this.variants))}`
    }

    cast(value: any): ValidationFailure | GetTaggedUnionCast<F, U> {
        let variant = this.getVariant(value)
        if (variant instanceof ValidationFailure) return variant
        let result = variant.cast(value)
        if (result instanceof ValidationFailure) return result
        result[this.tagField] = value[this.tagField]
        return result
    }

    validate(value: unknown): ValidationFailure | undefined {
        let variant = this.getVariant(value)
        if (variant instanceof ValidationFailure) return variant
        return variant.validate(value)
    }

    private getVariant(object: any): Validator<any>| ValidationFailure {
        if (typeof object != 'object' || !object) return new ValidationFailure(object, `{value} is not an object`)
        let tag = object[this.tagField]
        let variant = this.variants[tag]
        if (variant) return variant
        let failure = new ValidationFailure(tag, this.wrongTagMessage)
        failure.path.push(this.tagField)
        return failure
    }

    phantom(): GetTaggedUnionSrc<F, U> {
        throw new Error()
    }
}
