import {ValidationFailure} from '../error'
import {Validator} from '../interface'


export class RefValidator<T, S> implements Validator<T, S> {
    private validator?: Validator<T, S>

    constructor(private getter: () => Validator<T, S>) {}

    getValidator(): Validator<T, S> {
        if (this.validator == null) {
            this.validator = this.getter()
        }
        return this.validator
    }

    cast(value: unknown): ValidationFailure | T {
        return this.getValidator().cast(value)
    }

    validate(value: unknown): ValidationFailure | undefined {
        return this.getValidator().validate(value)
    }

    phantom(): S {
        throw new Error()
    }
}
