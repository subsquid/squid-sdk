import {ValidationFailure} from '../error'
import {Validator} from '../interface'


export class ArrayValidator<T, S> implements Validator<T[], S[]> {
    constructor(public readonly item: Validator<T, S>) {}

    cast(array: unknown): ValidationFailure | T[] {
        if (!Array.isArray(array)) return new ValidationFailure(array, `{value} is not an array`)
        let result: any[] = new Array(array.length)
        for (let i = 0; i < array.length; i++) {
            let val = this.item.cast(array[i])
            if (val instanceof ValidationFailure) {
                val.path.push(i)
                return val
            } else {
                result[i] = val
            }
        }
        return result
    }

    validate(array: unknown): ValidationFailure | undefined {
        if (!Array.isArray(array)) return new ValidationFailure(array, `{value} is not an array`)
        for (let i = 0; i < array.length; i++) {
            let err = this.item.validate(array[i])
            if (err) {
                err.path.push(i)
                return err
            }
        }
    }

    phantom(): S[] {
        return []
    }
}
