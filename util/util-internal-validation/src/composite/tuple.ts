import {ValidationFailure} from '../error'
import {Validator} from '../interface'


export class TupleValidator implements Validator<any[]> {
    private invalidLengthMessage?: string

    constructor(
        public readonly tuple: Validator[]
    ) {}

    private getInvalidLengthMessage(): string {
        if (this.invalidLengthMessage) return this.invalidLengthMessage
        return this.invalidLengthMessage = `{value} is not a tuple of length ${this.tuple.length}`
    }

    cast(value: unknown): ValidationFailure | any[] {
        if (!Array.isArray(value)) return new ValidationFailure(value, `{value} is not a tuple`)
        if (value.length !== this.tuple.length) return new ValidationFailure(value, this.getInvalidLengthMessage())

        let result: any[] = new Array(this.tuple.length)

        for (let i = 0; i < this.tuple.length; i++) {
            let v = this.tuple[i].cast(value[i])
            if (v instanceof ValidationFailure) {
                v.path.push(i)
                return v
            } else {
                result[i] = v
            }
        }

        return result
    }

    validate(value: unknown): ValidationFailure | undefined {
        if (!Array.isArray(value)) return new ValidationFailure(value, `{value} is not a tuple`)
        if (value.length !== this.tuple.length) return new ValidationFailure(value, this.getInvalidLengthMessage())

        for (let i = 0; i < this.tuple.length; i++) {
            let err = this.tuple[i].validate(value[i])
            if (err) {
                err.path.push(i)
                return err
            }
        }
    }

    phantom(): any[] {
        throw new Error()
    }
}
