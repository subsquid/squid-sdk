import {Ti, Type as ScaleType} from '@subsquid/scale-codec'
import assert from 'assert'


export {Ti, ScaleType}


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
    private checking: Set<Type>[]

    constructor(private types: ScaleType[]) {
        this.checked = new Array(this.types.length)
        this.checking = new Array(this.types.length)
        for (let i = 0; i < this.checked.length; i++) {
            this.checked[i] = new WeakMap()
            this.checking[i] = new Set()
        }
    }

    getScaleType(ti: Ti): ScaleType {
        assert(0 <= ti && ti < this.types.length)
        return this.types[ti]
    }

    match(ti: Ti, type: Type): boolean {
        assert(0 <= ti && ti < this.types.length)
        let checked = this.checked[ti]
        let ok = checked.get(type)
        if (ok == null) {
            let checking = this.checking[ti]
            if (checking.has(type)) return true
            checking.add(type)
            try {
                ok = type.match(this, this.getScaleType(ti))
            } finally {
                checking.delete(type)
            }
            checked.set(type, ok)
        }
        return ok
    }
}
