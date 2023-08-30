import {CompositeType, Field, Ti, Type, TypeKind, VariantType} from '@subsquid/substrate-runtime/lib/metadata'
import {assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import {Output} from '@subsquid/util-internal-code-printer'
import assert from 'assert'
import {needsName} from './names'
import {toNativePrimitive} from './util'


type Exp = string


export class Sts {
    private assignedNames: Set<string>
    private generated: Exp[]
    private generatedNames = new Set<string>()
    private queue: ((out: Output) => void)[] = []

    constructor(
        private types: Type[],
        private nameAssignment: Map<Ti, string>
    ) {
        this.assignedNames = new Set(this.nameAssignment.values())
        this.generated = new Array(types.length).fill('')
    }

    use(ti: Ti): Exp {
        let exp = this.generated[ti]
        if (exp) return exp

        exp = this.makeType(ti)

        if (!needsName(this.types, ti) && this.nameAssignment.has(ti)) {
            let alias = this.nameAssignment.get(ti)!
            if (!this.generatedNames.has(alias)) {
                this.generatedNames.add(alias)
                this.queue.push(out => {
                    out.line()
                    out.blockComment(this.types[ti].docs)
                    out.line(`export const ${alias} = ${exp}`)
                })
            }
            exp = alias
        }

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
            case TypeKind.Composite:
                if (ty.fields.length == 0 || ty.fields[0].name == null) {
                    return `sts.tuple(${ty.fields.map(f => this.use(f.type)).join(', ')})`
                } else {
                    return this.makeStruct(ty, ti)
                }
            case TypeKind.Variant:
                return this.makeVariant(ty, ti)
            case TypeKind.Option:
                return `sts.option(() => ${this.use(ty.type)})`
            default:
                throw unexpectedCase()
        }
    }

    private makeStruct(ty: CompositeType, ti: Ti): Exp {
        let name = this.getName(ti)
        if (this.generatedNames.has(name)) return name
        this.generatedNames.add(name)
        this.queue.push(out => {
            out.line()
            out.blockComment(ty.docs)
            out.line(`export const ${name} = sts.struct(() => {`)
            out.indentation(() => {
                out.block('return ', () => this.printStructFields(out, ty.fields))
            })
            out.line('})')
        })
        return name
    }

    private printStructFields(out: Output, fields: Field[]): void {
        fields.forEach(f => {
            let name = assertNotNull(f.name)
            let exp = this.use(f.type)
            out.blockComment(f.docs)
            out.line(`${name}: ${exp},`)
        })
    }

    private makeVariant(ty: VariantType, ti: Ti): Exp {
        let name = this.getName(ti)
        if (this.generatedNames.has(name)) return name
        this.generatedNames.add(name)
        this.queue.push(out => {
            out.line()
            out.blockComment(ty.docs)
            out.line(`export const ${name} = sts.closedEnum(() => {`)
            out.indentation(() => {
                out.block('return ', () => {
                    for (let v of ty.variants) {
                        if (v.fields.length == 0 || v.fields[0].name == null) {
                            if (v.fields.length == 1) {
                                out.line(`${v.name}: ${this.use(v.fields[0].type)},`)
                            } else {
                                out.line(`${v.name}: sts.tuple(${v.fields.map(f => this.use(f.type)).join(', ')}),`)
                            }
                        } else {
                            out.line(`${v.name}: sts.enumStruct({`)
                            out.indentation(() => this.printStructFields(out, v.fields))
                            out.line('}),')
                        }
                    }
                })
            })
            out.line('})')
        })
        return name
    }

    private getName(ti: Ti): string {
        return assertNotNull(this.nameAssignment.get(ti))
    }

    isEmpty(): boolean {
        return this.queue.length == 0
    }

    generate(out: Output): void {
        for (let i = 0; i < this.queue.length; i++) {
            this.queue[i](out)
        }
    }

    qualify(ns: string, exp: Exp): Exp {
        let names = exp
            .split(/[<>&|,()\[\]{}:]/)
            .map((t) => t.trim())
            .filter((t) => !!t)
        let local = new Set(names.filter(name => this.assignedNames.has(name)))
        for (let name of local) {
            exp = exp.replace(new RegExp(`\\b${name}\\b`, 'g'), ns + '.' + name)
        }
        return exp
    }
}
