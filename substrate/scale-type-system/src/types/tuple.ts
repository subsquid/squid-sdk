import {Ti, TypeKind} from '@subsquid/scale-codec'
import {def} from '@subsquid/util-internal'
import assert from 'assert'
import {BaseType, ScaleType, Type, TypeChecker} from '../type-checker'
import {GetType} from '../type-util'


export type GetTupleType<T> = T extends readonly [infer A, ...infer R] ? [GetType<A>, ...GetTupleType<R>] : []


export class TupleType<T extends readonly Type[]> extends BaseType<GetTupleType<T>> {
    constructor(private _tuple: () => T) {
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
        let def = this.getDef()
        if (tuple.length != def.length) return false
        for (let i = 0; i < def.length; i++) {
            if (!typeChecker.match(tuple[i], def[i])) return false
        }
        return true
    }

    @def
    private getDef(): T {
        return this._tuple()
    }
}
