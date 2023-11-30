import {ValidationFailure} from '../error'
import {Validator} from '../interface'


export class OptionValidator<T, S> implements Validator<T | undefined, S | undefined | null> {
    constructor(public readonly value: Validator<T, S>) {}

    cast(value: unknown): ValidationFailure | T | undefined {
        if (value == null) {
            return undefined
        } else {
            return this.value.cast(value)
        }
    }

    validate(value: unknown): ValidationFailure | undefined {
        if (value != null) return this.value.validate(value)
    }

    phantom(): S | undefined | null {
        throw new Error()
    }
}
