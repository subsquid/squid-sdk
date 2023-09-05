import {TypeKind} from '@subsquid/scale-codec'
import {def} from '@subsquid/util-internal'
import {BaseType, ScaleType, Type, TypeChecker} from '../type-checker'


export class OptionType<T> extends BaseType<T | undefined> {
    constructor(private value: () => Type<T>) {
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
    private getValue(): Type<T> {
        return this.value()
    }
}
