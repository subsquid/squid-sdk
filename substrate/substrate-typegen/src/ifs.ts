import {CompositeType, Field, Ti, Type, TypeKind, VariantType} from '@subsquid/substrate-runtime/lib/metadata'
import {assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import {Output} from '@subsquid/util-internal-code-printer'
import assert from 'assert'
import {needsName} from './names'
import {asOptionType, asResultType, toNativePrimitive} from './util'


export type Exp = string


export class Sink {
    private queue: ((out: Output) => void)[] = []
    private assignedNames = new Set<string>()

    constructor(
        public readonly types: Type[],
        private nameAssignment: Map<Ti, string>
    ) {
        for (let name of this.nameAssignment.values()) {
            this.assignedNames.add(name)
        }
    }

    push(cb: (out: Output) => void): void {
        this.queue.push(cb)
    }

    getName(ti: Ti): string {
        return assertNotNull(this.nameAssignment.get(ti))
    }

    hasName(ti: Ti): boolean {
        return this.nameAssignment.has(ti)
    }

    needsName(ti: Ti): boolean {
        return needsName(this.types, ti)
    }

    isEmpty(): boolean {
        return this.queue.length == 0
    }

    generate(out: Output): void {
        let cb
        while (cb = this.queue.pop()) {
            cb(out)
        }
    }

    qualify(ns: string, exp: Exp): Exp {
        let names = exp
            .split(/[<>&|,()\[\]{}:]/)
            .map(t => t.trim())
            .filter(t => !!t)

        let local = new Set(
            names.filter(
                name => this.assignedNames.has(name) || name[0] == 'I' && this.assignedNames.has(name.slice(1))
            )
        )

        local.forEach(name => {
            exp = exp.replace(new RegExp(`\\b${name}\\b`, 'g'), ns + '.' + name)
        })

        return exp
    }
}


export class Interfaces {
    private generated: Exp[]
    private generatedNames = new Set<string>()

    constructor(public readonly sink: Sink) {
        this.generated = new Array(this.sink.types.length).fill('')
    }

    use(ti: Ti): Exp {
        let exp = this.generated[ti]
        if (exp) return exp

        exp = this.makeType(ti)

        if (!this.sink.needsName(ti) && this.sink.hasName(ti)) {
            let alias = this.getName(ti)
            if (!this.generatedNames.has(alias)) {
                this.generatedNames.add(alias)
                let def = exp
                this.sink.push(out => {
                    out.line()
                    out.blockComment(this.sink.types[ti].docs)
                    out.line(`export type ${alias} = ${def}`)
                })
            }
            exp = alias
        }

        return this.generated[ti] = exp
    }

    private getName(ti: Ti): string {
        return this.sink.getName(ti)
    }

    private makeType(ti: Ti): string {
        let ty = this.sink.types[ti]
        switch(ty.kind) {
            case TypeKind.Primitive:
                return toNativePrimitive(ty.primitive)
            case TypeKind.Compact: {
                let compact = this.sink.types[ty.type]
                assert(compact.kind == TypeKind.Primitive)
                return toNativePrimitive(compact.primitive)
            }
            case TypeKind.BitSequence:
                return 'Uint8Array'
            case TypeKind.HexBytes:
            case TypeKind.HexBytesArray:
                return 'Bytes'
            case TypeKind.Sequence:
            case TypeKind.Array:
                return this.use(ty.type) + '[]'
            case TypeKind.Tuple:
                return this.makeTuple(ty.tuple)
            case TypeKind.Composite:
                if (ty.fields.length == 0 || ty.fields[0].name == null) {
                    return this.makeTuple(ty.fields.map(f => {
                        assert(f.name == null)
                        return f.type
                    }))
                } else {
                    return this.makeStruct(ty, ti)
                }
            case TypeKind.Variant: {
                let result = asResultType(ty)
                if (result) {
                    return `Result<${this.use(result.ok)}, ${this.use(result.err)}>`
                }
                let option = asOptionType(ty)
                if (option) {
                    return `Option<${this.use(option.some)}>`
                }
                return this.makeVariant(ty, ti)
            }
            case TypeKind.Option:
                return `(${this.use(ty.type)} | undefined)`
            case TypeKind.DoNotConstruct:
                return 'never'
            default:
                throw unexpectedCase((ty as any).kind)
        }
    }

    private makeTuple(fields: Ti[]): string {
        if (fields.length == 0) return 'null'
        return '[' + fields.map(f => this.use(f)).join(', ') + ']'
    }

    private makeStruct(type: CompositeType, ti: Ti): string {
        let name = this.getName(ti)
        if (this.generatedNames.has(name)) return name
        this.generatedNames.add(name)
        this.sink.push(out => {
            out.line()
            out.blockComment(this.sink.types[ti].docs)
            out.block(`export interface ${name}`, () => {
                this.printStructFields(out, type.fields)
            })
        })
        return name
    }

    private printStructFields(out: Output, fields: Field[]): void {
        fields.forEach(f => {
            let name = assertNotNull(f.name)
            let exp = this.use(f.type)
            let opt = this.isUndefined(f.type) ? '?' : ''
            out.blockComment(f.docs)
            out.line(`${name}${opt}: ${exp}`)
        })
    }

    private isUndefined(ti: Ti): boolean {
        return this.sink.types[ti].kind == TypeKind.Option
    }

    private isUnit(ti: Ti): boolean {
        let ty = this.sink.types[ti]
        switch(ty.kind) {
            case TypeKind.Composite:
                return ty.fields.length == 0
            case TypeKind.Tuple:
                return ty.tuple.length == 0
            default:
                return false
        }
    }

    private makeVariant(type: VariantType, ti: Ti): string {
        let name = this.getName(ti)
        if (this.generatedNames.has(name)) return name
        this.generatedNames.add(name)
        this.sink.push(out => {
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
                        } else if (v.fields.length == 1) {
                            let ti = v.fields[0].type
                            if (!this.isUnit(ti)) {
                                let opt = this.isUndefined(ti) ? '?' : ''
                                out.line(`value${opt}: ${this.use(ti)}`)
                            }
                        } else {
                            out.line(`value: ${this.makeTuple(v.fields.map(f => f.type))}`)
                        }
                    }
                })
            })
        })
        return name
    }
}


export class Sts {
    public readonly ifs: Interfaces
    private generated: Exp[]
    private generatedNames = new Set<string>()

    constructor(public readonly sink: Sink) {
        this.ifs = new Interfaces(this.sink)
        this.generated = new Array(this.sink.types.length).fill('')
    }

    use(ti: Ti): Exp {
        let exp = this.generated[ti]
        if (exp) return exp

        exp = this.makeType(ti)

        if (!this.sink.needsName(ti) && this.sink.hasName(ti)) {
            let alias = this.sink.getName(ti)
            if (!this.generatedNames.has(alias)) {
                this.generatedNames.add(alias)
                let def = exp
                this.sink.push(out => {
                    out.line()
                    out.blockComment(this.sink.types[ti].docs)
                    out.line(`export const ${alias} = ${def}`)
                })
            }
            exp = alias
        }

        return this.generated[ti] = exp
    }

    private makeType(ti: Ti): Exp {
        let ty = this.sink.types[ti]
        switch(ty.kind) {
            case TypeKind.Primitive:
                return `sts.${toNativePrimitive(ty.primitive)}()`
            case TypeKind.Compact: {
                let compact = this.sink.types[ty.type]
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
                return this.renderTuple(ty.tuple)
            case TypeKind.Composite:
                if (ty.fields.length == 0 || ty.fields[0].name == null) {
                    return this.renderTuple(ty.fields.map(f => f.type))
                } else {
                    return this.makeStruct(ty, ti)
                }
            case TypeKind.Variant: {
                let result = asResultType(ty)
                if (result) {
                    return `sts.result(${this.use(result.ok)}, ${this.use(result.err)})`
                }
                let option = asOptionType(ty)
                if (option) {
                    return `sts.closedEnum({Some: ${this.use(option.some)}, None: sts.unit()})`
                }
                return this.makeVariant(ty, ti)
            }
            case TypeKind.Option:
                return `sts.option(() => ${this.use(ty.type)})`
            default:
                throw unexpectedCase()
        }
    }

    private makeStruct(ty: CompositeType, ti: Ti): Exp {
        let name = this.sink.getName(ti)
        if (this.generatedNames.has(name)) return name
        this.generatedNames.add(name)
        this.sink.push(out => {
            out.line()
            out.line(`export const ${name}: sts.Type<${this.ifs.use(ti)}> = sts.struct(() => {`)
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
            out.line(`${name}: ${exp},`)
        })
    }

    private makeVariant(ty: VariantType, ti: Ti): Exp {
        let name = this.sink.getName(ti)
        if (this.generatedNames.has(name)) return name
        this.generatedNames.add(name)
        this.sink.push(out => {
            out.line()
            out.blockComment(ty.docs)
            out.line(`export const ${name}: sts.Type<${this.ifs.use(ti)}> = sts.closedEnum(() => {`)
            out.indentation(() => {
                out.block('return ', () => {
                    for (let v of ty.variants) {
                        if (v.fields.length == 0 || v.fields[0].name == null) {
                            if (v.fields.length == 1) {
                                out.line(`${v.name}: ${this.use(v.fields[0].type)},`)
                            } else {
                                out.line(`${v.name}: ${this.renderTuple(v.fields.map(f => f.type))},`)
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

    private renderTuple(tuple: Ti[]): Exp {
        let list = tuple.map(ti => this.use(ti)).join(', ')
        return list ? `sts.tuple(${list})` : 'sts.unit()'
    }
}
