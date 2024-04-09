import {ValidationFailure} from '../error'
import {Validator} from '../interface'
import {print} from '../util'


export class ConstantValidator<T> implements Validator<T> {
    private message: string

    constructor(
        public readonly value: T,
        public readonly equals: (a: unknown, b: T) => boolean = strictEquals
    ) {
        this.message = `value {value} is not equal to ${print(this.value)}`
    }

    cast(value: unknown): ValidationFailure | T {
        if (this.equals(value, this.value)) return this.value
        return new ValidationFailure(value, this.message)
    }

    validate(value: unknown): ValidationFailure | undefined {
        if (this.equals(value, this.value)) return
        return new ValidationFailure(value, this.message)
    }

    phantom(): T {
        return this.value
    }
}


function strictEquals<T>(a: unknown, b: T): boolean {
    return a === b
}
