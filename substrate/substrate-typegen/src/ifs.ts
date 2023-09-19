import {CompositeType, Field, Ti, Type, TypeKind, VariantType} from '@subsquid/substrate-runtime/lib/metadata'
import {assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import {FileOutput, OutDir, Output} from '@subsquid/util-internal-code-printer'
import assert from 'assert'
import {assignNames, needsName} from './names'
import {asOptionType, asResultType, toNativePrimitive, upperCaseFirst} from './util'
import {toCamelCase} from '@subsquid/util-naming'
import {Runtime} from '@subsquid/substrate-runtime'
import {createScaleType} from '@subsquid/substrate-runtime/lib/runtime/util'

type Exp = string

type Queue = ((out: Output) => void)[]

export class Sink {
    private pallets = new Map<string, Queue>()
    readonly types: Queue = []

    constructor(private dir: OutDir) {
        // this.events = dir.file('events.ts')
        // this.calls = dir.file('calls.ts')
        // this.events = dir.file('events.ts')
        // this.events = dir.file('events.ts')
    }

    // getTypes() {
    //     if (this.types == null) {
    //         this.types = this.dir.file('types.ts')
    //     }

    //     return this.types
    // }

    getPallet(name: string) {
        let pallet = this.pallets.get(name)
        if (pallet == null) {
            pallet = []
            this.pallets.set(name, pallet)
        }

        return pallet
    }

    write() {
        if (this.types.length > 0) {
            let out = this.dir.file('types.ts')
            this.writeQueue(out, this.types)
            out.write()
        }

        // for (let pallet of this.pallets.values()) {
        //     pallet.write()
        // }
    }

    private writeQueue(out: Output, queue: Queue) {
        for (let item of queue) {
            item(out)
        }
    }

    // private queue: ((out: Output) => void)[] = []
    // private assignedNames = new Set<string>()

    // constructor(
    //     public readonly types: Type[],
    //     private nameAssignment: Map<Ti, string>
    // ) {
    //     for (let name of this.nameAssignment.values()) {
    //         this.assignedNames.add(name)
    //     }
    // }

    // push(cb: (out: Output) => void): void {
    //     this.queue.push(cb)
    // }

    // getName(ti: Ti): string {
    //     return assertNotNull(this.nameAssignment.get(ti))
    // }

    // hasName(ti: Ti): boolean {
    //     return this.nameAssignment.has(ti)
    // }

    // isEmpty(): boolean {
    //     return this.queue.length == 0
    // }

    // generate(out: Output): void {
    //     let cb
    //     while (cb = this.queue.pop()) {
    //         cb(out)
    //     }
    // }

    // qualify(ns: string, exp: Exp): Exp {
    //     let names = exp
    //         .split(/[<>&|,()\[\]{}:]/)
    //         .map(t => t.trim())
    //         .filter(t => !!t)

    //     let local = new Set(
    //         names.filter(
    //             name => this.assignedNames.has(name) || name[0] == 'I' && this.assignedNames.has(name.slice(1))
    //         )
    //     )

    //     local.forEach(name => {
    //         exp = exp.replace(new RegExp(`\\b${name}\\b`, 'g'), ns + '.' + name)
    //     })

    //     return exp
    // }
}

export class Interfaces {
    // private generated: Exp[]
    // private generatedNames = new Set<string>()
    // constructor(public readonly sink: Sink) {
    //     this.generated = new Array(this.sink.types.length).fill('')
    // }
    // useType(ti: Ti): Exp {
    //     let exp = this.generated[ti]
    //     if (exp) return exp
    //     exp = this.makeType(ti)
    //     if (this.sink.hasName(ti)) {
    //         let alias = this.getName(ti)
    //         if (!this.generatedNames.has(alias)) {
    //             this.generatedNames.add(alias)
    //             let def = exp
    //             this.sink.push((out) => {
    //                 out.line()
    //                 out.blockComment(this.sink.types[ti].docs)
    //                 out.line(`export type ${alias} = ${def}`)
    //             })
    //         }
    //         exp = alias
    //     }
    //     return (this.generated[ti] = exp)
    // }
    // private getName(ti: Ti): string {
    //     return this.sink.getName(ti)
    // }
    // private makeType(ti: Ti): string {
    //     let ty = this.sink.types[ti]
    //     switch (ty.kind) {
    //         case TypeKind.Primitive:
    //             return toNativePrimitive(ty.primitive)
    //         case TypeKind.Compact: {
    //             let compact = this.sink.types[ty.type]
    //             assert(compact.kind == TypeKind.Primitive)
    //             return toNativePrimitive(compact.primitive)
    //         }
    //         case TypeKind.BitSequence:
    //             return 'Uint8Array'
    //         case TypeKind.HexBytes:
    //         case TypeKind.HexBytesArray:
    //             return 'Bytes'
    //         case TypeKind.Sequence:
    //         case TypeKind.Array:
    //             return this.useType(ty.type) + '[]'
    //         case TypeKind.Tuple:
    //             return this.makeTuple(ty.tuple)
    //         case TypeKind.Composite:
    //             if (ty.fields.length == 0 || ty.fields[0].name == null) {
    //                 return this.makeTuple(
    //                     ty.fields.map((f) => {
    //                         assert(f.name == null)
    //                         return f.type
    //                     })
    //                 )
    //             } else {
    //                 return this.makeStruct(ty, ti)
    //             }
    //         case TypeKind.Variant: {
    //             let result = asResultType(ty)
    //             if (result) {
    //                 return `Result<${this.useType(result.ok)}, ${this.useType(result.err)}>`
    //             }
    //             let option = asOptionType(ty)
    //             if (option) {
    //                 return `Option<${this.useType(option.some)}>`
    //             }
    //             return this.makeVariant(ty, ti)
    //         }
    //         case TypeKind.Option:
    //             return `(${this.useType(ty.type)} | undefined)`
    //         case TypeKind.DoNotConstruct:
    //             return 'never'
    //         default:
    //             throw unexpectedCase((ty as any).kind)
    //     }
    // }
    // private makeTuple(fields: Ti[]): string {
    //     if (fields.length == 0) return 'null'
    //     return '[' + fields.map((f) => this.useType(f)).join(', ') + ']'
    // }
    // private makeStruct(type: CompositeType, ti: Ti): string {
    //     let name = this.getName(ti)
    //     if (this.generatedNames.has(name)) return name
    //     this.generatedNames.add(name)
    //     this.sink.push((out) => {
    //         out.line()
    //         out.blockComment(this.sink.types[ti].docs)
    //         out.block(`export interface ${name}`, () => {
    //             this.printStructFields(out, type.fields)
    //         })
    //     })
    //     return name
    // }
    // private printStructFields(out: Output, fields: Field[]): void {
    //     fields.forEach((f) => {
    //         let name = assertNotNull(f.name)
    //         let exp = this.useType(f.type)
    //         let opt = this.isUndefined(f.type) ? '?' : ''
    //         out.blockComment(f.docs)
    //         out.line(`${name}${opt}: ${exp}`)
    //     })
    // }
    // private isUndefined(ti: Ti): boolean {
    //     return this.sink.types[ti].kind == TypeKind.Option
    // }
    // private isUnit(ti: Ti): boolean {
    //     let ty = this.sink.types[ti]
    //     switch (ty.kind) {
    //         case TypeKind.Composite:
    //             return ty.fields.length == 0
    //         case TypeKind.Tuple:
    //             return ty.tuple.length == 0
    //         default:
    //             return false
    //     }
    // }
    // private makeVariant(type: VariantType, ti: Ti): string {
    //     let name = this.getName(ti)
    //     if (this.generatedNames.has(name)) return name
    //     this.generatedNames.add(name)
    //     this.sink.push((out) => {
    //         out.line()
    //         out.blockComment(type.docs)
    //         if (type.variants.length == 0) {
    //             out.line(`export type ${name} = never`)
    //             return
    //         }
    //         out.line(`export type ${name} = ${type.variants.map((v) => name + '_' + v.name).join(' | ')}`)
    //         type.variants.forEach((v) => {
    //             out.line()
    //             out.blockComment(v.docs)
    //             out.block(`export interface ${name + '_' + v.name}`, () => {
    //                 out.line(`__kind: '${v.name}'`)
    //                 if (v.fields.length > 0) {
    //                     if (v.fields[0].name != null) {
    //                         this.printStructFields(out, v.fields)
    //                     } else if (v.fields.length == 1) {
    //                         let ti = v.fields[0].type
    //                         if (!this.isUnit(ti)) {
    //                             let opt = this.isUndefined(ti) ? '?' : ''
    //                             out.line(`value${opt}: ${this.useType(ti)}`)
    //                         }
    //                     } else {
    //                         out.line(`value: ${this.makeTuple(v.fields.map((f) => f.type))}`)
    //                     }
    //                 }
    //             })
    //         })
    //     })
    //     return name
    // }
}

export class Sts {
    // public readonly ifs: Interfaces

    private nameAssignment: Map<Ti, string>

    private events = new Map<string, string>()
    private calls = new Map<string, string>()
    private constants = new Map<string, string>()
    private storage = new Map<string, string>()
    private types = new Map<Ti, string>()

    private sink: Sink

    constructor(private dir: OutDir, readonly name: string, private runtime: Runtime) {
        this.sink = new Sink(new OutDir(dir.path(toCamelCase(name))))
        // this.ifs = new Interfaces(this.sink)
        this.nameAssignment = assignNames(runtime.description)
    }

    generate() {
        this.sink.write()
    }

    useType(ti: Ti): Exp {
        let exp = this.types.get(ti)
        if (exp == null) {
            let name = this.nameAssignment.get(ti)
            let def = this.runtime.description.types[ti]

            if (name != null) {
                this.types.set(ti, name)
            }

            let out = this.sink.types
            exp = this.makeType(out, name, def)
        }

        return exp
    }

    useEvent(pallet: string, name: string) {
        let qn = `${pallet}.${name}`
        let type = this.events.get(qn)
        if (type == null) {
            type = createName(pallet, name, 'Event')
            let def = this.runtime.description.pallets[pallet].events[name]
            let scaleType = createScaleType(this.runtime.description.types, def)

            this.events.set(qn, type)

            let queue = this.sink.getPallet(pallet)
            this.makeType(queue, type, scaleType)
        }
        return type
    }

    useCall(pallet: string, name: string) {
        return createName(pallet, name, 'Call')
    }

    useConstant(pallet: string, name: string) {
        return createName(pallet, name, 'Constant')
    }

    useStorage(pallet: string, name: string) {
        return createName(pallet, name, 'Storage')
    }

    private makeType(queue: Queue, name: string | undefined, ty: Type): Exp {
        switch (ty.kind) {
            case TypeKind.Composite: {
                assert(name != null)
                this.makeComposite(queue, name, ty)
                return name
            }
            case TypeKind.Variant: {
                assert(name != null)
                this.makeVariant(queue, name, ty)
                return name
            }
            default: {
                let exp = this.renderType(ty)
                if (name != null) {
                    queue.push((out) => {
                        out.line()
                        out.blockComment(ty.docs)
                        out.line(`export const ${name} = ${exp}`)
                    })
                    return name
                } else {
                    return exp
                }
            }
        }
    }

    private renderType(ty: Type) {
        switch (ty.kind) {
            case TypeKind.Primitive:
                return `sts.${toNativePrimitive(ty.primitive)}()`
            case TypeKind.Compact: {
                let compact = this.runtime.description.types[ty.type]
                assert(compact.kind == TypeKind.Primitive)
                return toNativePrimitive(compact.primitive)
            }
            case TypeKind.BitSequence:
                return `sts.uint8array()`
            case TypeKind.HexBytes:
            case TypeKind.HexBytesArray:
                return 'sts.bytes()'
            case TypeKind.Sequence:
            case TypeKind.Array:
                return `sts.array(${this.useType(ty.type)})`
            case TypeKind.Tuple:
                return this.renderTuple(ty.tuple)
            case TypeKind.Option:
                return `sts.option(() => ${this.useType(ty.type)})`
            default:
                throw unexpectedCase()
        }
    }

    private makeComposite(queue: Queue, name: string, ty: CompositeType): void {
        queue.push((out) => {
            out.line()
            out.blockComment(ty.docs)
            if (ty.fields.length == 0 || ty.fields[0].name == null) {
                out.line(`export const ${name} = ${this.renderTuple(ty.fields.map((f) => f.type))}`)
            } else {
                out.line(`export const ${name} = sts.struct(() => {`)
                out.indentation(() => {
                    out.block('return ', () => this.printStructFields(out, ty.fields))
                })
                out.line('})')
            }
        })
    }

    private printStructFields(out: Output, fields: Field[]): void {
        fields.forEach((f) => {
            let name = assertNotNull(f.name)
            let exp = this.useType(f.type)
            out.line(`${name}: ${exp},`)
        })
    }

    private makeVariant(queue: Queue, name: string, ty: VariantType): void {
        queue.push((out) => {
            out.line()
            out.blockComment(ty.docs)
            out.line(`export const ${name} = sts.closedEnum(() => {`)
            out.indentation(() => {
                out.block('return ', () => {
                    for (let v of ty.variants) {
                        if (v.fields.length == 0 || v.fields[0].name == null) {
                            if (v.fields.length == 1) {
                                out.line(`${v.name}: ${this.useType(v.fields[0].type)},`)
                            } else {
                                out.line(`${v.name}: ${this.renderTuple(v.fields.map((f) => f.type))},`)
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
    }

    private renderTuple(tuple: Ti[]): Exp {
        let list = tuple.map((ti) => this.useType(ti)).join(', ')
        return list ? `sts.tuple(${list})` : 'sts.unit()'
    }
}

function createName(pallet: string, name: string, suffix: string): string {
    return upperCaseFirst(toCamelCase(`${pallet}_${name}_${suffix}`))
}
