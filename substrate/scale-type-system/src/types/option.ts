import {TypeKind} from '@subsquid/scale-codec'
import {def} from '@subsquid/util-internal'
import {BaseType, ScaleType, Type, TypeChecker} from '../type-checker'
import {GetType} from '../type-util'


export class OptionType<T extends Type> extends BaseType<GetType<T> | undefined> {
    constructor(private _value: () => T) {
        super()
    }

    match(typeChecker: TypeChecker, ty: ScaleType): boolean {
        if (ty.kind == TypeKind.Option) {
            return typeChecker.match(ty.type, this.getValue())
        } else {
            return false
        }
    }

    @def
    private getValue(): T {
        return this._value()
    }
}
