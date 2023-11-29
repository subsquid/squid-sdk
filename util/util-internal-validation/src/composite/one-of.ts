import assert from 'assert'
import {ValidationFailure} from '../error'
import {GetCastType, GetSrcType, Validator} from '../interface'
import {Simplify} from '../util'


export type GetOneOfCast<P> = Simplify<{
    [K in keyof P]: GetCastType<P[K]>
}[keyof P]>


export type GetOneOfSrc<P> = Simplify<{
    [K in keyof P]: GetSrcType<P[K]>
}[keyof P]>


export class OneOfValidator<P extends Record<string, Validator<any>>> implements Validator<GetOneOfCast<P>, GetOneOfSrc<P>> {
    private patternNames: string[]
    private errors: (ValidationFailure | undefined)[]


    constructor(public readonly patterns: P) {
        this.patternNames = Object.keys(this.patterns)
        this.errors = new Array(this.patternNames.length)
        assert(this.patternNames.length > 1)
    }

    private clearErrors(): void {
        for (let i = 0; i < this.errors.length; i++) {
            this.errors[i] = undefined
        }
    }

    cast(value: unknown): ValidationFailure | GetOneOfCast<P> {
        for (let i = 0; i < this.patternNames.length; i++) {
            let key = this.patternNames[i]
            let validator = this.patterns[key]
            let result = validator.cast(value)
            if (result instanceof ValidationFailure) {
                this.errors[i] = result
            } else {
                this.clearErrors()
                return result
            }
        }
        let failure = new OneOfValidationFailure(value, this.errors.slice() as ValidationFailure[], this.patternNames)
        this.clearErrors()
        return failure
    }

    validate(value: unknown): ValidationFailure | undefined {
        for (let i = 0; i < this.patternNames.length; i++) {
            let key = this.patternNames[i]
            let validator = this.patterns[key]
            let err = validator.validate(value)
            if (err) {
                this.errors[i] = err
            } else {
                this.clearErrors()
                return
            }
        }
        let failure = new OneOfValidationFailure(value, this.errors.slice() as ValidationFailure[], this.patternNames)
        this.clearErrors()
        return failure
    }

    phantom(): GetOneOfSrc<P> {
        throw new Error()
    }
}


export class OneOfValidationFailure extends ValidationFailure {
    constructor(value: unknown, public errors: ValidationFailure[], public patternNames: string[]) {
        super(value, 'given value does not match any of the expected patterns')
    }

    toString(): string {
        let msg = 'given value does not match any of the expected patterns:'
        for (let i = 0; i < this.patternNames.length; i++) {
            msg += `\n    ${this.patternNames[i]}: ${this.errors[i].toString()}`
        }
        if (this.path.length) {
            msg = `invalid value at ${this.getPathString()}: ${msg}`
        }
        return msg
    }
}
