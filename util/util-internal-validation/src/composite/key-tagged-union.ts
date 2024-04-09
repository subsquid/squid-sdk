import {ValidationFailure} from '../error'
import {GetCastType, GetSrcType, Validator} from '../interface'
import {AddOptionToUndefined, Simplify, print} from '../util'


export type GetKeyTaggedUnionCast<U> = Simplify<{
    [C in keyof U]: Simplify<AddOptionToUndefined<{
        [K in keyof U]: K extends C ? GetCastType<U[C]> : undefined
    }>>
}[keyof U]>


export type GetKeyTaggedUnionSrc<U> = Simplify<{
    [C in keyof U]: AddOptionToUndefined<{
        [K in keyof U]: K extends C ? GetSrcType<U[C]> : undefined
    }>
}[keyof U]>


export class KeyTaggedUnionValidator<U extends Record<string, Validator<any>>>
    implements Validator<GetKeyTaggedUnionCast<U>, GetKeyTaggedUnionSrc<U>>
{
    private onlyOneOfMessage?: string
    private noPropsMessage?: string

    constructor(public readonly union: U) {
    }

    cast(value: any): ValidationFailure | GetKeyTaggedUnionCast<U> {
        let tag = this.getTag(value)
        if (tag instanceof ValidationFailure) return tag
        let val = this.union[tag].cast(value[tag])
        if (val instanceof ValidationFailure) {
            val.path.push(tag)
            return val
        }
        return {[tag]: val} as any
    }

    validate(value: any): ValidationFailure | undefined {
        let tag = this.getTag(value)
        if (tag instanceof ValidationFailure) return tag
        let err = this.union[tag].validate(value[tag])
        if (err) {
            err.path.push(tag)
            return err
        }
    }

    phantom(): GetKeyTaggedUnionSrc<U> {
        throw new Error()
    }

    private getTag(value: any): string | ValidationFailure {
        if (typeof value != 'object' || !value) return new ValidationFailure(value, '{value} is not an object')
        let tag: string | undefined
        for (let key in value) {
            let validator = this.union[key]
            if (validator == null) continue
            if (tag == null) {
                tag = key
            } else {
                return new ValidationFailure(value, this.getOnlyOneOfMessage())
            }
        }
        if (tag == null) return new ValidationFailure(value, this.getNoPropsMessage())
        return tag
    }

    private getOnlyOneOfMessage(): string {
        if (this.onlyOneOfMessage) return this.onlyOneOfMessage
        return this.onlyOneOfMessage = `only one of ${print(Object.keys(this.union))} properties expected to be present in the object, but got {value}`
    }

    private getNoPropsMessage(): string {
        if (this.noPropsMessage) return this.noPropsMessage
        return this.noPropsMessage = `expected an object with one of ${print(Object.keys(this.union))} properties, but got {value}`
    }
}
