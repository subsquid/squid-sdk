import {
    CompositeType,
    Constant,
    Field,
    RuntimeDescription,
    StorageItem,
    Ti,
    Type,
    TypeKind,
    VariantType,
} from '@subsquid/substrate-runtime/lib/metadata'
import {assertNotNull, def, last, unexpectedCase} from '@subsquid/util-internal'
import {OutDir, Output} from '@subsquid/util-internal-code-printer'
import assert from 'assert'
import {assignNames, needsName} from './names'
import {asOptionType, asResultType, toNativePrimitive, upperCaseFirst} from './util'
import {Runtime} from '@subsquid/substrate-runtime'
import {toCamelCase} from '@subsquid/util-naming'
import {createScaleType} from '@subsquid/substrate-runtime/lib/runtime/util'

export type Exp = string

// export class Sink {
//     private queue: ((out: Output) => void)[] = []
//     private assignedNames = new Set<string>()

//     constructor(public readonly types: Type[], private nameAssignment: Map<Ti, string>) {
//         for (let name of this.nameAssignment.values()) {
//             this.assignedNames.add(name)
//         }
//     }

//     push(cb: (out: Output) => void): void {
//         this.queue.push(cb)
//     }

//     getName(ti: Ti): string {
//         return assertNotNull(this.nameAssignment.get(ti))
//     }

//     hasName(ti: Ti): boolean {
//         return this.nameAssignment.has(ti)
//     }

//     needsName(ti: Ti): boolean {
//         return needsName(this.types, ti)
//     }

//     isEmpty(): boolean {
//         return this.queue.length == 0
//     }

//     generate(out: Output): void {
//         let cb
//         while ((cb = this.queue.pop())) {
//             cb(out)
//         }
//     }

//     qualify(ns: string, exp: Exp): Exp {
//         let names = exp
//             .split(/[<>&|,()\[\]{}:]/)
//             .map((t) => t.trim())
//             .filter((t) => !!t)

//         let local = new Set(names.filter((name) => this.assignedNames.has(name)))

//         local.forEach((name) => {
//             exp = exp.replace(new RegExp(`\\b${name}\\b`, 'g'), ns + '.' + name)
//         })

//         return exp
//     }
// }

// export class Interfaces {
//     private generated: Exp[]
//     private generatedNames = new Set<string>()

//     constructor(public readonly sink: Sink) {
//         this.generated = new Array(this.sink.types.length).fill('')
//     }

//     use(ti: Ti): Exp {
//         let exp = this.generated[ti]
//         if (exp) return exp

//         exp = this.makeType(ti)

//         if (!this.sink.needsName(ti) && this.sink.hasName(ti)) {
//             let alias = this.getName(ti)
//             if (!this.generatedNames.has(alias)) {
//                 this.generatedNames.add(alias)
//                 let def = exp
//                 this.sink.push((out) => {
//                     out.line()
//                     out.blockComment(this.sink.types[ti].docs)
//                     out.line(`export type ${alias} = ${def}`)
//                 })
//             }
//             exp = alias
//         }

//         return (this.generated[ti] = exp)
//     }

//     private getName(ti: Ti): string {
//         return this.sink.getName(ti)
//     }

//     private makeType(ti: Ti): string {
//         let ty = this.sink.types[ti]
//         switch (ty.kind) {
//             case TypeKind.Primitive:
//                 return toNativePrimitive(ty.primitive)
//             case TypeKind.Compact: {
//                 let compact = this.sink.types[ty.type]
//                 assert(compact.kind == TypeKind.Primitive)
//                 return toNativePrimitive(compact.primitive)
//             }
//             case TypeKind.BitSequence:
//                 return 'Uint8Array'
//             case TypeKind.HexBytes:
//             case TypeKind.HexBytesArray:
//                 return 'Bytes'
//             case TypeKind.Sequence:
//             case TypeKind.Array:
//                 return this.use(ty.type) + '[]'
//             case TypeKind.Tuple:
//                 return this.makeTuple(ty.tuple)
//             case TypeKind.Composite:
//                 if (ty.fields.length == 0 || ty.fields[0].name == null) {
//                     return this.makeTuple(
//                         ty.fields.map((f) => {
//                             assert(f.name == null)
//                             return f.type
//                         })
//                     )
//                 } else {
//                     return this.makeStruct(ty, ti)
//                 }
//             case TypeKind.Variant: {
//                 let result = asResultType(ty)
//                 if (result) {
//                     return `Result<${this.use(result.ok)}, ${this.use(result.err)}>`
//                 }
//                 let option = asOptionType(ty)
//                 if (option) {
//                     return `Option<${this.use(option.some)}>`
//                 }
//                 return this.makeVariant(ty, ti)
//             }
//             case TypeKind.Option:
//                 return `(${this.use(ty.type)} | undefined)`
//             case TypeKind.DoNotConstruct:
//                 return 'never'
//             default:
//                 throw unexpectedCase((ty as any).kind)
//         }
//     }

//     private makeTuple(fields: Ti[]): string {
//         if (fields.length == 0) return 'null'
//         return '[' + fields.map((f) => this.use(f)).join(', ') + ']'
//     }

//     private makeStruct(type: CompositeType, ti: Ti): string {
//         let name = this.getName(ti)
//         if (this.generatedNames.has(name)) return name
//         this.generatedNames.add(name)
//         this.sink.push((out) => {
//             out.line()
//             out.blockComment(this.sink.types[ti].docs)
//             out.block(`export type ${name} = `, () => {
//                 this.printStructFields(out, type.fields)
//             })
//         })
//         return name
//     }

//     private printStructFields(out: Output, fields: Field[]): void {
//         fields.forEach((f) => {
//             let name = assertNotNull(f.name)
//             let exp = this.use(f.type)
//             let opt = this.isUndefined(f.type) ? '?' : ''
//             out.blockComment(f.docs)
//             out.line(`${name}${opt}: ${exp}`)
//         })
//     }

//     private isUndefined(ti: Ti): boolean {
//         return this.sink.types[ti].kind == TypeKind.Option
//     }

//     private isUnit(ti: Ti): boolean {
//         let ty = this.sink.types[ti]
//         switch (ty.kind) {
//             case TypeKind.Composite:
//                 return ty.fields.length == 0
//             case TypeKind.Tuple:
//                 return ty.tuple.length == 0
//             default:
//                 return false
//         }
//     }

//     private makeVariant(type: VariantType, ti: Ti): string {
//         let name = this.getName(ti)
//         if (this.generatedNames.has(name)) return name
//         this.generatedNames.add(name)
//         this.sink.push((out) => {
//             out.line()
//             out.blockComment(type.docs)
//             if (type.variants.length == 0) {
//                 out.line(`export type ${name} = never`)
//                 return
//             }
//             out.line(`export type ${name} = ${type.variants.map((v) => name + '_' + v.name).join(' | ')}`)
//             type.variants.forEach((v) => {
//                 out.line()
//                 out.blockComment(v.docs)
//                 out.block(`export interface ${name + '_' + v.name}`, () => {
//                     out.line(`__kind: '${v.name}'`)
//                     if (v.fields.length > 0) {
//                         if (v.fields[0].name != null) {
//                             this.printStructFields(out, v.fields)
//                         } else if (v.fields.length == 1) {
//                             let ti = v.fields[0].type
//                             if (!this.isUnit(ti)) {
//                                 let opt = this.isUndefined(ti) ? '?' : ''
//                                 out.line(`value${opt}: ${this.use(ti)}`)
//                             }
//                         } else {
//                             out.line(`value: ${this.makeTuple(v.fields.map((f) => f.type))}`)
//                         }
//                     }
//                 })
//             })
//         })
//         return name
//     }
// }

export class StsManager {
    private sts: Map<Runtime, Sts>

    constructor(dir: OutDir, private runtimes: Runtime[]) {
        // this.dir = new OutDir(outDir)
        // this.ifs = new Interfaces()
        this.sts = new Map()
        for (let r of runtimes) {
            let name = this.getVersionName(r)
            let outDir = dir.path(toCamelCase(name))
            this.sts.set(r, new Sts(outDir, name, r))
        }
    }

    get(runtime: Runtime): Sts {
        return this.sts.get(runtime)!
    }

    generate() {
        this.sts.forEach((s) => s.generate())
    }

    private getVersionName(runtime: Runtime): string {
        if (this.specNameNotChanged() || last(this.runtimes).specName == runtime.specName) {
            return `V${runtime.specVersion}`
        } else {
            let isName = toCamelCase(`is-${runtime.specName}-v${runtime.specVersion}`)
            return isName.slice(2)
        }
    }

    @def
    private specNameNotChanged(): boolean {
        return new Set(this.runtimes.map((v) => v.specName)).size < 2
    }
}

export class Sts {
    private generated = new Map<number, Exp>()
    private generatedNames = new Set<string>()
    private dir: OutDir

    private events = new Map<string, string>()
    private calls = new Map<string, string>()
    private constants = new Map<string, string>()
    private storage = new Map<string, string>()
    private types = new Map<Ti, string>()

    constructor(outDir: string, readonly name: string, private runtime: Runtime) {
        this.dir = new OutDir(outDir)
    }

    useType(ti: Ti, prefix?: string): Exp {
        let type = this.types.get(ti)
        if (type == null) {
            type = this.names().get(ti)!
            this.types.set(ti, type)

            let def = this.runtime.description.types[ti]
            switch (def.kind) {
                case TypeKind.Primitive:
                    break
                case TypeKind.Compact:
                    this.useType(def.type)
                    break
                case TypeKind.BitSequence:
                    break
                case TypeKind.HexBytes:
                case TypeKind.HexBytesArray:
                    break
                case TypeKind.Sequence:
                case TypeKind.Array:
                    this.useType(def.type)
                    break
                case TypeKind.Tuple:
                    def.tuple.forEach((i) => this.useType(i))
                    break
                case TypeKind.Composite:
                    def.fields.forEach((f) => this.useType(f.type))
                    break
                case TypeKind.Variant: {
                    let result = asResultType(def)
                    if (result) break

                    let option = asOptionType(def)
                    if (option) break

                    for (let v of def.variants) {
                        v.fields.forEach((f) => this.useType(f.type))
                    }
                    break
                }
                case TypeKind.Option:
                    break
                default:
                    throw unexpectedCase()
            }
        }

        return makePrefix(type, prefix)
    }

    useEvent(pallet: string, name: string, prefix?: string) {
        let qn = `${pallet}.${name}`

        let type = this.events.get(qn)
        if (type == null) {
            type = this.createName(pallet, name, 'Event')
            this.events.set(qn, type)

            let def = this.runtime.description.pallets[pallet].events[name]
            for (let field of def.fields) {
                this.useType(field.type)
            }
        }

        return makePrefix(type, prefix)
    }

    useCall(pallet: string, name: string, prefix?: string) {
        let qn = `${pallet}.${name}`

        let type = this.calls.get(qn)
        if (type == null) {
            type = this.createName(pallet, name, 'Call')
            this.calls.set(qn, type)

            let def = this.runtime.description.pallets[pallet].calls[name]
            for (let field of def.fields) {
                this.useType(field.type)
            }
        }

        return makePrefix(type, prefix)
    }

    useConstant(pallet: string, name: string, prefix?: string) {
        let qn = `${pallet}.${name}`

        let type = this.constants.get(qn)
        if (type == null) {
            type = this.createName(pallet, name, 'Constant')
            this.constants.set(qn, type)

            let def = this.runtime.description.pallets[pallet].constants[name]
            this.useType(def.type)
        }

        return makePrefix(type, prefix)
    }

    useStorage(pallet: string, name: string, prefix?: string) {
        let qn = `${pallet}.${name}`

        let type = this.storage.get(qn)
        if (type == null) {
            type = this.createName(pallet, name, 'Storage')
            this.storage.set(qn, type)

            let def = this.runtime.description.pallets[pallet].storage[name]
            this.useType(def.value)
            def.keys.forEach((i) => this.useType(i))
        }

        return makePrefix(type, prefix)
    }

    generate() {
        this.generateEvents()
        this.generateTypes()
    }

    generateEvents() {
        if (this.events.size == 0) return

        let out = this.dir.file('events.ts')

        out.line(`import * as sts from '@subsquid/substrate-runtime/lib/sts'`)

        for (let [qn, type] of this.events) {
            let [pallet, name] = qn.split('.')

            let def = this.runtime.description.pallets[pallet].events[name]
            let scaleType = createScaleType(this.runtime.description.types, def)

            out.line()
            out.blockComment(def.docs)
            out.line(`export const ${type} = ${this.makeType(scaleType)}`)
            out.line()
            out.line(`export type ${type} = sts.GetType<typeof ${type}>`)
        }

        out.write()
    }

    generateTypes() {
        if (this.types.size == 0) return

        let out = this.dir.file('types.ts')

        out.line(`import * as sts from '@subsquid/substrate-runtime/lib/sts'`)


        let items = Array.from(this.types).sort((a, b) => a[0] = b[0])
        for (let [ti, type] of items) {
            let def = this.runtime.description.types[ti]

            out.line()
            out.blockComment(def.docs)
            out.line(`export const ${type} = ${this.makeType(def)}`)
            out.line()
            out.line(`export type ${type} = sts.GetType<typeof ${type}>`)
        }

        out.write()
    }

    private makeType(ty: Type): Exp {
        switch (ty.kind) {
            case TypeKind.Primitive:
                return `sts.${toNativePrimitive(ty.primitive)}()`
            case TypeKind.Compact: {
                return this.useType(ty.type)
            }
            case TypeKind.BitSequence:
                return `sts.uint8array()`
            case TypeKind.HexBytes:
            case TypeKind.HexBytesArray:
                return 'sts.bytes()'
            case TypeKind.Sequence:
            case TypeKind.Array:
                return `sts.array(() => ${this.useType(ty.type)})`
            case TypeKind.Tuple:
                return this.renderTuple(ty.tuple)
            case TypeKind.Composite:
                if (ty.fields.length == 0 || ty.fields[0].name == null) {
                    return this.renderTuple(ty.fields.map((f) => f.type))
                } else {
                    return this.makeStruct(ty)
                }
            case TypeKind.Variant: {
                let result = asResultType(ty)
                if (result) {
                    return `sts.result(${this.useType(result.ok)}, ${this.useType(result.err)})`
                }
                let option = asOptionType(ty)
                if (option) {
                    return `sts.closedEnum({Some: ${this.useType(option.some)}, None: sts.unit()})`
                }
                return this.makeVariant(ty)
            }
            case TypeKind.Option:
                return `sts.option(() => ${this.useType(ty.type)})`
            default:
                throw unexpectedCase(ty.kind)
        }
    }

    private makeStruct(ty: CompositeType): Exp {
        return `sts.struct(() => ({${this.printStructFields(ty.fields)}}))`
    }

    private printStructFields(fields: Field[]): string {
        return fields
            .map((f) => {
                let name = assertNotNull(f.name)
                let exp = this.useType(f.type)
                return `${name}: ${exp}`
            })
            .join(', ')
    }

    private makeVariant(ty: VariantType): Exp {
        return `sts.closedEnum(() => ({${ty.variants
            .map((v) => {
                if (v.fields.length == 0 || v.fields[0].name == null) {
                    if (v.fields.length == 1) {
                        return `${v.name}: ${this.useType(v.fields[0].type)}`
                    } else {
                        return `${v.name}: ${this.renderTuple(v.fields.map((f) => f.type))}`
                    }
                } else {
                    return `${v.name}: sts.enumStruct({${this.printStructFields(v.fields)}})`
                }
            })
            .join(', ')}}))`
    }

    private renderTuple(tuple: Ti[]): Exp {
        return tuple.length > 0 ? `sts.tuple(${tuple.map((ti) => this.useType(ti)).join(', ')})` : 'sts.unit()'
    }

    private createName(pallet: string, name: string, suffix: string): string {
        return upperCaseFirst(toCamelCase(`${pallet}_${name}_${suffix}`))
    }

    @def
    private names() {
        return assignNames(this.runtime.description)
    }
}

function makePrefix(str: string, prefix?: string) {
    return prefix ? prefix + '.' + str : str
}