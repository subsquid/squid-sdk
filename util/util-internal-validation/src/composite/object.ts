import {ValidationFailure} from '../error'
import {GetCastType, GetSrcType, Validator} from '../interface'
import {AddOptionToUndefined, Simplify} from '../util'


export type GetPropsCast<Props> = Simplify<AddOptionToUndefined<{
    [K in keyof Props]: GetCastType<Props[K]>
}>>


export type GetPropsSrc<Props> = Simplify<AddOptionToUndefined<{
    [K in keyof Props]: GetSrcType<Props[K]>
}>>


export class ObjectValidator<Props extends Record<string, Validator>>
    implements Validator<GetPropsCast<Props>, GetPropsSrc<Props>>
{
    constructor(public readonly props: Props) {}

    cast(object: any): ValidationFailure | GetPropsCast<Props> {
        if (typeof object != 'object' || !object) return new ValidationFailure(object, `{value} is not an object`)
        let result: any = {}
        for (let key in this.props) {
            let val = this.props[key].cast(object[key])
            if (val === undefined) continue
            if (val instanceof ValidationFailure) {
                val.path.push(key)
                return val
            }
            result[key] = val
        }
        return result
    }

    validate(object: any): ValidationFailure | undefined {
        if (typeof object != 'object' || !object) return new ValidationFailure(object, `{value} is not an object`)
        for (let key in this.props) {
            let err = this.props[key].validate(object[key])
            if (err) {
                err.path.push(key)
                return err
            }
        }
    }

    phantom(): GetPropsSrc<Props> {
        throw new Error()
    }
}
