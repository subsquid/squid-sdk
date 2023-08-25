import {TypeKind} from '@subsquid/scale-codec'
import {def} from '@subsquid/util-internal'
import {BaseType, ScaleType, Type, TypeChecker} from '../type-checker'
import {GetType} from '../type-util'


export class ArrayType<T extends Type> extends BaseType<GetType<T>[]> {
    constructor(private type: () => T) {
        super()
    }

    match(typeChecker: TypeChecker, ty: ScaleType): boolean {
        switch(ty.kind) {
            case TypeKind.Sequence:
            case TypeKind.Array:
                return typeChecker.match(ty.type, this.getType())
            default:
                return false
        }
    }

    @def
    private getType(): T {
        return this.type()
    }
}
