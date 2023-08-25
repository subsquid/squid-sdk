import {Ti, TypeKind} from '@subsquid/scale-codec'
import assert from 'assert'
import {BaseType, ScaleType, Type, TypeChecker} from '../type-checker'
import {GetType} from '../type-util'


export type GetTupleType<T> = {
    [I in keyof T]: GetType<T[I]>
}


export class TupleType<T extends readonly Type[]> extends BaseType<GetTupleType<T>> {
    constructor(private tuple: T) {
        super()
    }

    match(typeChecker: TypeChecker, ty: ScaleType): boolean {
        let tuple: Ti[]
        switch(ty.kind) {
            case TypeKind.Tuple:
                tuple = ty.tuple
                break
            case TypeKind.Composite:
                if (ty.fields[0]?.name != null) return false
                tuple = ty.fields.map(f => {
                    assert(f.name == null)
                    return f.type
                })
                break
            default:
                return false
        }
        if (tuple.length != this.tuple.length) return false
        for (let i = 0; i < this.tuple.length; i++) {
            if (!typeChecker.match(tuple[i], this.tuple[i])) return false
        }
        return true
    }
}
