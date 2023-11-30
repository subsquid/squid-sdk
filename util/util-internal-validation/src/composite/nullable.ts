import {ValidationFailure} from '../error'
import {Validator} from '../interface'


export class NullableValidator<T, S> implements Validator<T | null, S | null> {
    constructor(public readonly value: Validator<T, S>) {}

    cast(value: unknown): ValidationFailure | T | null {
        if (value === null) {
            return null
        } else {
            return this.value.cast(value)
        }
    }

    validate(value: unknown): ValidationFailure | undefined {
        if (value === null) return
        return this.value.validate(value)
    }

    phantom(): S | null {
        return null
    }
}
