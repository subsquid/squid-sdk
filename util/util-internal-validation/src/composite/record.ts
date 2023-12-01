import {ValidationFailure} from '../error'
import {Validator} from '../interface'


export class RecordValidator<K extends string, V, S> implements Validator<Record<K, V>, Record<K, S>> {
    constructor(
        public readonly key: Validator<K>,
        public readonly value: Validator<V, S>
    ) {}

    cast(record: unknown): ValidationFailure | Record<K, V> {
        if (typeof record != 'object' || !record) return new ValidationFailure(record, `{value} is not an object`)
        let result: any = {}
        for (let key in record) {
            let k = this.key.cast(key)
            if (k instanceof ValidationFailure) {
                k.path.push(key)
                return k
            }
            let v = this.value.cast((record as any)[key])
            if (v instanceof ValidationFailure) {
                v.path.push(key)
                return v
            }
            result[k] = v
        }
        return result
    }

    validate(record: unknown): ValidationFailure | undefined {
        if (typeof record != 'object' || !record) return new ValidationFailure(record, `{value} is not an object`)
        for (let key in record) {
            let err = this.key.validate(key) || this.value.validate((record as any)[key])
            if (err) {
                err.path.push(key)
                return err
            }
        }
    }

    phantom(): Record<K, S> {
        throw new Error()
    }
}
