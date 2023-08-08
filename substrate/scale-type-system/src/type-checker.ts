import {Ti, Type as ScaleType} from '@subsquid/scale-codec'
import assert from 'assert'


export interface Type<T=unknown> {
    match(typeChecker: TypeChecker, ty: ScaleType): boolean
    phantom(): T
}


export abstract class BaseType<T> implements Type<T> {
    abstract match(typeChecker: TypeChecker, ty: ScaleType): boolean

    phantom(): T {
        throw new Error()
    }
}


export class TypeChecker {
    private checked: WeakMap<Type, boolean>[]
    private checking = new Set<Type>()

    constructor(private types: ScaleType[]) {
        this.checked = new Array(this.types.length)
        for (let i = 0; i < this.checked.length; i++) {
            this.checked[i] = new WeakMap()
        }
    }

    getScaleType(ti: number): ScaleType {
        assert(0 <= ti && ti < this.types.length)
        return this.types[ti]
    }

    match(type: Type, ti: Ti): boolean {
        assert(0 <= ti && ti < this.types.length)
        let checked = this.checked[ti]
        let ok = checked.get(type)
        if (ok == null) {
            if (this.checking.has(type)) return true
            this.checking.add(type)
            try {
                ok = type.match(this, this.getScaleType(ti))
            } finally {
                this.checking.delete(type)
            }
            checked.set(type, ok)
        }
        return ok
    }
}
