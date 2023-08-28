import {Ti, Type, TypeKind} from '@subsquid/substrate-runtime/lib/metadata'
import {unexpectedCase} from '@subsquid/util-internal'
import assert from 'assert'
import {toNativePrimitive} from './util'


type Exp = string


export class Sts {
    private generated: Exp[]

    constructor(
        private types: Type[],
        private nameAssignment: Map<Ti, string>
    ) {
        this.generated = new Array(types.length).fill('')
    }

    use(ti: Ti): Exp {
        let exp = this.generated[ti]
        if (exp) return exp

        exp = this.makeType(ti)

        return this.generated[ti] = exp
    }

    private makeType(ti: Ti): Exp {
        let ty = this.types[ti]
        switch(ty.kind) {
            case TypeKind.Primitive:
                return `sts.${toNativePrimitive(ty.primitive)}()`
            case TypeKind.Compact: {
                let compact = this.types[ty.type]
                assert(compact.kind == TypeKind.Primitive)
                return `sts.${toNativePrimitive(compact.primitive)}()`
            }
            case TypeKind.BitSequence:
                return `sts.uint8array()`
            case TypeKind.HexBytes:
            case TypeKind.HexBytesArray:
                return 'sts.bytes()'
            case TypeKind.Sequence:
            case TypeKind.Array:
                return `sts.array(${this.use(ty.type)})`
            case TypeKind.Tuple:
                return `sts.tuple(${ty.tuple.map(ti => this.use(ti)).join(', ')})`
            default:
                throw unexpectedCase()
        }
    }
}
