import assert from "assert"
import {CompactType, CompositeType, Field, Primitive, Ti, Type, TypeKind, VariantType} from "@subsquid/substrate-metadata"
import {toCamelCase, Output, assertNotNull, unexpectedCase} from "@subsquid/util"
import {assignNames, needsName} from "./names"


export class Interfaces {
    private nameAssignment: Map<Ti, string>
    private assignedNames: Set<string>
    private generated: (string | undefined)[]
    private generatedNames = new Set<string>()
    private queue: ((out: Output) => void)[] = []

    constructor(private types: Type[]) {
        this.nameAssignment = assignNames(types)
        this.assignedNames = new Set(this.nameAssignment.values())
        this.generated = new Array(types.length)
    }

    use(ti: Ti): string {
        let name = this.generated[ti]
        if (name != null) return name

        name = this.makeType(ti)

        let type = this.types[ti]
        if (!needsName(type) && this.nameAssignment.has(ti)) {
            let alias = this.nameAssignment.get(ti)!
            if (!this.generatedNames.has(alias)) {
                this.generatedNames.add(alias)
                let typeExp = name
                this.queue.push(out => {
                    out.line()
                    out.blockComment(type.docs)
                    out.line(`export type ${alias} = ${typeExp}`)
                })
            }
            name = alias
        }

        return this.generated[ti] = name
    }

    private makeType(ti: Ti): string {
        let type = this.types[ti]
        switch(type.kind) {
            case TypeKind.Primitive:
                return toNativePrimitive(type.primitive)
            case TypeKind.Compact:
                return this.makeCompact(type)
            case TypeKind.BitSequence:
            case TypeKind.Bytes:
            case TypeKind.BytesArray:
                return 'Uint8Array'
            case TypeKind.Sequence:
            case TypeKind.Array:
                return this.use(type.type) + '[]'
            case TypeKind.Tuple:
                return this.makeTuple(type.tuple)
            case TypeKind.Composite:
                return this.useComposite(type, ti)
            case TypeKind.Variant:
                return this.useVariant(type, ti)
            case TypeKind.Option:
                return `(${this.use(type.type)} | undefined)`
            case TypeKind.DoNotConstruct:
                return 'never'
            default:
                throw unexpectedCase((type as any).kind)
        }
    }

    private makeCompact(type: CompactType): string {
        let item = this.types[type.type]
        if (item.kind == TypeKind.Tuple) {
            assert(item.tuple.length == 0, "only empty tuples can be compact")
            return 'null'
        }
        assert(item.kind == TypeKind.Primitive)
        switch(item.primitive) {
            case 'U8':
            case 'U16':
            case 'U32':
                return 'number'
            case 'U64':
            case 'U128':
            case 'U256':
                return '(number | bigint)'
            default:
                throw unexpectedCase(item.primitive)
        }
    }

    makeTuple(fields: Ti[]): string {
        switch(fields.length) {
            case 0:
                return 'null'
            case 1:
                return this.use(fields[0])
            default:
                return '[' + fields.map(f => this.use(f)).join(', ') + ']'
        }
    }

    private useComposite(type: CompositeType, ti: Ti): string {
        if (type.fields.length == 0) return 'null'
        if (type.fields[0].name == null) return this.makeTuple(type.fields.map(f => f.type))
        let name = this.getName(ti)
        if (this.generatedNames.has(name)) return name
        this.generatedNames.add(name)
        this.queue.push(out => {
            out.line()
            out.blockComment(type.docs)
            out.block(`export interface ${name}`, () => {
                this.printStructFields(out, type.fields)
            })
        })
        return name
    }

    private printStructFields(out: Output, fields: Field[]): void {
        fields.forEach(f => {
            let name = toCamelCase(assertNotNull(f.name))
            let type = this.use(f.type)
            out.blockComment(f.docs)
            out.line(`${name}: ${type}`)
        })
    }

    private useVariant(type: VariantType, ti: Ti): string {
        let name = this.getName(ti)
        if (this.generatedNames.has(name)) return name
        this.generatedNames.add(name)
        this.queue.push(out => {
            out.line()
            out.blockComment(type.docs)
            out.line(`export type ${name} = ${type.variants.map(v => name + '_' + v.name).join(' | ')}`)
            type.variants.forEach(v => {
                out.line()
                out.blockComment(v.docs)
                out.block(`export interface ${name + '_' + v.name}`, () => {
                    out.line(`__kind: '${v.name}'`)
                    if (v.fields.length > 0) {
                        if (v.fields[0].name != null) {
                            this.printStructFields(out, v.fields)
                        } else {
                            out.line(`value: ${this.makeTuple(v.fields.map(f => f.type))}`)
                        }
                    }
                })
            })
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

    qualify(ns: string, typeExp: string): string {
        let names = typeExp
            .split(/[<>&|,()\[\]{}:]/)
            .map((t) => t.trim())
            .filter((t) => !!t)
        let local = new Set(names.filter(name => this.assignedNames.has(name)))
        local.forEach(name => {
            typeExp = typeExp.replace(new RegExp(`\\b${name}\\b`, 'g'), ns + '.' + name)
        })
        return typeExp
    }
}


function toNativePrimitive(primitive: Primitive): string {
    switch(primitive) {
        case 'I8':
        case 'U8':
        case 'I16':
        case 'U16':
        case 'I32':
        case 'U32':
            return 'number'
        case 'I64':
        case 'U64':
        case 'I128':
        case 'U128':
        case 'I256':
        case 'U256':
            return 'bigint'
        case 'Bool':
            return 'boolean'
        case 'Str':
            return 'string'
        default:
            throw unexpectedCase(primitive)
    }
}
