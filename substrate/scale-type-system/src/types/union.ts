import {BaseType, ScaleType, Type, TypeChecker} from '../type-checker'


export class UnionType extends BaseType<any> {
    constructor(private variants: Type[]) {
        super()
    }

    match(typeChecker: TypeChecker, ty: ScaleType): boolean {
        for (let v of this.variants) {
            if (v.match(typeChecker, ty)) return true
        }
        return false
    }
}
