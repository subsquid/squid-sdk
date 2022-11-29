import {CodecStructType, getCodecType} from "@subsquid/scale-codec/lib/types-codec"
import {Field, Ti, Type, TypeKind, VariantType} from "@subsquid/substrate-metadata"
import {assertNotNull, unexpectedCase} from "@subsquid/util-internal"
import {Output} from "@subsquid/util-internal-code-printer"
import {toCamelCase} from "@subsquid/util-naming"
import assert from "assert"
import {needsName} from "./names"
import {asOptionType, asResultType, toNativePrimitive} from './util'


export class Interfaces {
    private assignedNames: Set<string>
    private generated: (string | undefined)[]
    private generatedNames = new Set<string>()
    private queue: ((out: Output) => void)[] = []

    constructor(
        private types: Type[],
        private nameAssignment: Map<Ti, string>
    ) {
        this.assignedNames = new Set(this.nameAssignment.values())
        this.generated = new Array(this.types.length)
    }

    use(ti: Ti): string {
        let name = this.generated[ti]
        if (name != null) return name

        name = this.makeType(ti)

        if (!needsName(this.types, ti) && this.nameAssignment.has(ti)) {
            let alias = this.nameAssignment.get(ti)!
            if (!this.generatedNames.has(alias)) {
                this.generatedNames.add(alias)
                let typeExp = name
                this.queue.push(out => {
                    out.line()
                    out.blockComment( this.types[ti].docs)
                    out.line(`export type ${alias} = ${typeExp}`)
                })
            }
            name = alias
        }

        return this.generated[ti] = name
    }

    private makeType(ti: Ti): string {
        let codecType = getCodecType(this.types, ti)
        switch(codecType.kind) {
            case TypeKind.Primitive:
                return toNativePrimitive(codecType.primitive)
            case TypeKind.Compact:
                return toNativePrimitive(codecType.integer)
            case TypeKind.BitSequence:
            case TypeKind.Bytes:
            case TypeKind.BytesArray:
                return 'Uint8Array'
            case TypeKind.Sequence:
            case TypeKind.Array:
                return this.use(codecType.type) + '[]'
            case TypeKind.Tuple:
                return this.makeTuple(codecType.tuple)
            case TypeKind.Struct:
                return this.makeStruct(codecType, ti)
            case TypeKind.Variant: {
                let type = this.types[ti]
                assert(type.kind == TypeKind.Variant)
                let result = asResultType(this.types[ti])
                if (result) {
                    return `Result<${this.use(result.ok)}, ${this.use(result.err)}>`
                }
                let option = asOptionType(this.types[ti])
                if (option) {
                    return `Option<${this.use(option.some)}>`
                }
                return this.makeVariant(type, ti)
            }
            case TypeKind.Option:
                return `(${this.use(codecType.type)} | undefined)`
            case TypeKind.BooleanOption:
                return `(boolean | undefined)`
            case TypeKind.DoNotConstruct:
                return 'never'
            default:
                throw unexpectedCase((codecType as any).kind)
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

    private makeStruct(type: CodecStructType, ti: Ti): string {
        let name = this.getName(ti)
        if (this.generatedNames.has(name)) return name
        this.generatedNames.add(name)
        this.queue.push(out => {
            out.line()
            out.blockComment(this.types[ti].docs)
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

    private makeVariant(type: VariantType, ti: Ti): string {
        let name = this.getName(ti)
        if (this.generatedNames.has(name)) return name
        this.generatedNames.add(name)
        this.queue.push(out => {
            out.line()
            out.blockComment(type.docs)
            if (type.variants.length == 0) {
                out.line(`export type ${name} = never`)
                return
            }
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
