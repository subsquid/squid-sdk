import {ValidationFailure} from '../error'
import {Validator} from '../interface'


export class Default<T, S> implements Validator<T, S | undefined | null> {
    constructor(
        public readonly value: T,
        public readonly item: Validator<T, S>
    ) {}

    cast(value: unknown): ValidationFailure | T {
        if (value == null) {
            return this.value
        } else {
            return this.item.cast(value)
        }
    }

    validate(value: unknown): ValidationFailure | undefined {
        if (value == null) return
        return this.item.validate(value)
    }

    phantom(): S | undefined | null {
        return undefined
    }
}
