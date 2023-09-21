import {Runtime} from '@subsquid/substrate-runtime'
import {CompositeType, Field, Ti, Type, TypeKind, VariantType} from '@subsquid/substrate-runtime/lib/metadata'
import {createScaleType} from '@subsquid/substrate-runtime/lib/runtime/util'
import {assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import {OutDir, Output} from '@subsquid/util-internal-code-printer'
import {toCamelCase} from '@subsquid/util-naming'
import assert from 'assert'
import {assignNames} from './names'
import {asOptionType, asResultType, toNativePrimitive, upperCaseFirst} from './util'

type Exp = {
    type: string
    value: string
}

type Queue = ((out: Output, types?: Set<string>) => void)[]

export class Sink {
    private pallets = new Map<string, Queue>()
    readonly types: Queue = []

    private modules = new Set()

    constructor(private dir: OutDir) {}

    pallet(pallet: string) {
        let name = toCamelCase(pallet)

        let queue = this.pallets.get(name)
        if (queue == null) {
            queue = []
            this.pallets.set(name, queue)
        }

        return queue
    }

    write() {
        for (let pallet of this.pallets) {
            this.writePallet(...pallet)
        }

        this.writePrimitives()

        this.writeIndex()
    }

    private writeIndex() {
        if (this.modules.size === 0) return

        let out = this.dir.file('index.ts')
        for (let module of this.modules) {
            out.line(`export * from './${module}'`)
        }
        out.write()
    }

    private writePrimitives() {
        if (this.types.length === 0) return

        let out = this.dir.file('types.ts')
        out.line(`import {sts, Result, Option, Bytes} from '../../pallet.support'`)

        let cb
        while ((cb = this.types.pop())) {
            cb(out)
        }

        out.write()

        this.modules.add('types')
    }

    private writePallet(name: string, queue: Queue) {
        if (queue.length === 0) return

        let out = this.dir.file(name + '.ts')

        out.line(`import {sts} from '../../pallet.support'`)

        let imports = new Set<string>()

        out.lazy(() => {
            if (imports.size > 0) {
                out.line(`import {${[...imports].join(', ')}} from './types'`)
            }
        })

        let cb
        while ((cb = queue.pop())) {
            cb(out, imports)
        }

        out.write()

        this.modules.add(name)
    }

    // private queue: ((out: Output) => void)[] = []
    // private assignedNames = new Set<string>()

    // constructor(
    //     public readonly types: Type[],
    //     private typeNames: Map<Ti, string>
    // ) {
    //     for (let name of this.typeNames.values()) {
    //         this.assignedNames.add(name)
    //     }
    // }

    // push(cb: (out: Output) => void): void {
    //     this.queue.push(cb)
    // }

    // getName(ti: Ti): string {
    //     return assertNotNull(this.typeNames.get(ti))
    // }

    // hasName(ti: Ti): boolean {
    //     return this.typeNames.has(ti)
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
}

export class Sts {
    // public readonly ifs: Interfaces

    private typeNames: Map<Ti, string>

    private events = new Map<string, Exp>()
    private calls = new Map<string, Exp>()
    private constants = new Map<string, Exp>()
    private storage = new Map<string, Exp>()
    private types = new Map<Ti, Exp>()

    private assignedNames = new Set<string>()

    private sink: Sink

    constructor(private dir: OutDir, readonly name: string, private runtime: Runtime) {
        this.sink = new Sink(new OutDir(dir.path(toCamelCase(name))))
        // this.ifs = new Interfaces(this.sink)
        this.typeNames = assignNames(runtime.description)
    }

    generate() {
        this.sink.write()
    }

    useType(ti: Ti): Exp {
        let exp = this.types.get(ti)
        if (exp == null) {
            let name = this.typeNames.get(ti)
            let def = this.runtime.description.types[ti]

            if (name != null) {
                this.types.set(ti, {type: name, value: name})
                this.assignedNames.add(name)
            }

            let out = this.sink.types
            exp = this.makeType(out, name, def)
        }

        return exp
    }

    useEvent(pallet: string, event: string) {
        let qn = `${pallet}.${event}`
        let type = this.events.get(qn)
        if (type == null) {
            let name = createName(pallet, event, 'Event')
            let def = this.runtime.description.pallets[pallet].events[event]
            let scaleType = createScaleType(this.runtime.description.types, def)

            type = {value: name, type: name}
            this.events.set(qn, type)
            this.assignedNames.add(name)

            let queue = this.sink.pallet(pallet)
            this.makeType(queue, name, scaleType)
        }
        return type
    }

    useCall(pallet: string, call: string) {
        let qn = `${pallet}.${call}`
        let type = this.events.get(qn)
        if (type == null) {
            let name = createName(pallet, call, 'Call')
            let def = this.runtime.description.pallets[pallet].calls[call]
            let scaleType = createScaleType(this.runtime.description.types, def)

            type = {value: name, type: name}
            this.calls.set(qn, type)
            this.assignedNames.add(name)

            let queue = this.sink.pallet(pallet)
            this.makeType(queue, name, scaleType)
        }
        return type
    }

    useConstant(pallet: string, name: string) {
        let type = createName(pallet, name, 'Constant')
        this.assignedNames.add(type)
        return type
    }

    useStorage(pallet: string, name: string) {
        let type = createName(pallet, name, 'Storage')
        this.assignedNames.add(type)
        return type
    }

    qualify(exp: string, ns?: string): string {
        if (ns == null) return exp

        this.extractNames(exp).forEach((name) => {
            exp = exp.replace(new RegExp(`\\b${name}\\b`, 'g'), ns + '.' + name)
        })

        return exp
    }

    private extractNames(exp: string) {
        let names = exp
            .split(/[<>&|,()\[\]{}:]/)
            .map((t) => t.trim())
            .filter((t) => !!t)

        return new Set(names.filter((name) => this.assignedNames.has(name)))
    }

    private makeType(queue: Queue, name: string | undefined, ty: Type): Exp {
        switch (ty.kind) {
            case TypeKind.Composite: {
                assert(name != null)
                this.makeComposite(queue, name, ty)
                return {value: name, type: name}
            }
            case TypeKind.Variant: {
                let result = asResultType(ty)
                if (result) {
                    let ok = this.useType(result.ok)
                    let err = this.useType(result.err)
                    return {
                        value: `sts.result(${ok.value}, ${err.value})`,
                        type: `Result<${ok.value}, ${err.value}>`,
                    }
                }
                let option = asOptionType(ty)
                if (option) {
                    let some = this.useType(option.some)
                    return {
                        value: `sts.closedEnum({Some: ${some.value}, None: sts.unit()})`,
                        type: `Option<${some.type}>`,
                    }
                }
                assert(name != null)
                this.makeVariant(queue, name, ty)
                return {value: name, type: name}
            }
            default: {
                let exp = this.renderType(ty)
                if (name != null) {
                    queue.push((out, types) => {
                        this.extractNames(exp.type).forEach((n) => types?.add(n))
                        out.line()
                        out.blockComment(ty.docs)
                        out.line(`export type ${name} = ${exp.type}`)
                        out.line()
                        out.line(`export const ${name}: sts.Type<${name}> = ${exp.value}`)
                    })
                    return {value: name, type: name}
                } else {
                    return exp
                }
            }
        }
    }

    private makeComposite(queue: Queue, name: string, ty: CompositeType): void {
        queue.push((out, types) => {
            out.line()
            out.blockComment(ty.docs)
            if (ty.fields.length == 0 || ty.fields[0].name == null) {
                let exp = this.renderTuple(ty.fields.map((f) => f.type))
                this.extractNames(exp.type).forEach((n) => types?.add(n))
                out.line(`export type ${name} = ${exp.type}`)
                out.line()
                out.line(`export const ${name}: sts.Type<${name}> = ${exp.value}`)
            } else {
                let fieldsExp = ty.fields.map((f) => this.useType(f.type))
                fieldsExp.forEach((exp) => this.extractNames(exp.type).forEach((n) => types?.add(n)))
                out.line(`export type ${name} = {`)
                out.indentation(() =>
                    ty.fields.forEach((f, i) => {
                        let name = assertNotNull(f.name)
                        let opt = this.isUndefined(f.type) ? '?' : ''
                        out.line(`${name}${opt}: ${fieldsExp[i].type},`)
                    })
                )
                out.line('}')
                out.line()
                out.line(`export const ${name}: sts.Type<${name}> = sts.struct(() => {`)
                out.indentation(() => {
                    out.block('return ', () =>
                        ty.fields.forEach((f, i) => {
                            let name = assertNotNull(f.name)
                            out.line(`${name}: ${fieldsExp[i].value},`)
                        })
                    )
                })
                out.line('})')
            }
        })
    }

    private makeVariant(queue: Queue, name: string, ty: VariantType): void {
        queue.push((out, types) => {
            out.line()
            out.blockComment(ty.docs)
            let variantsExp = ty.variants.map((v) => v.fields.map((f) => this.useType(f.type)))
            variantsExp.forEach((v) => v.forEach((exp) => this.extractNames(exp.type).forEach((n) => types?.add(n))))
            if (ty.variants.length == 0) {
                out.line(`export type ${name} = never`)
                return
            } else {
                out.line(`export type ${name} = ${ty.variants.map((v) => name + '_' + v.name).join(' | ')}`)
                ty.variants.forEach((v, i) => {
                    out.line()
                    out.blockComment(v.docs)
                    out.block(`export interface ${name + '_' + v.name}`, () => {
                        out.line(`__kind: '${v.name}'`)
                        if (v.fields.length > 0) {
                            if (v.fields[0].name != null) {
                                v.fields.forEach((f, j) => {
                                    let name = assertNotNull(f.name)
                                    let opt = this.isUndefined(f.type) ? '?' : ''
                                    out.line(`${name}${opt}: ${variantsExp[i][j].type},`)
                                })
                            } else if (v.fields.length == 1) {
                                let ti = v.fields[0].type
                                if (!this.isUnit(ti)) {
                                    let opt = this.isUndefined(ti) ? '?' : ''
                                    out.line(`value${opt}: ${variantsExp[i][0].type}`)
                                }
                            } else {
                                out.line(`value: ${this.renderTuple(v.fields.map((f) => f.type)).type}`)
                            }
                        }
                    })
                })
            }
            out.line()
            out.line(`export const ${name}: sts.Type<${name}> = sts.closedEnum(() => {`)
            out.indentation(() => {
                out.block('return ', () => {
                    ty.variants.forEach((v, i) => {
                        if (v.fields.length == 0 || v.fields[0].name == null) {
                            if (v.fields.length == 1) {
                                out.line(`${v.name}: ${variantsExp[i][0].value},`)
                            } else {
                                out.line(`${v.name}: ${this.renderTuple(v.fields.map((f) => f.type)).value},`)
                            }
                        } else {
                            out.line(`${v.name}: sts.enumStruct({`)
                            out.indentation(() =>
                                v.fields.forEach((f, j) => {
                                    let name = assertNotNull(f.name)
                                    out.line(`${name}: ${variantsExp[i][j].value},`)
                                })
                            )
                            out.line('}),')
                        }
                    })
                })
            })
            out.line('})')
        })
    }

    private renderType(ty: Type): Exp {
        switch (ty.kind) {
            case TypeKind.Primitive: {
                let type = toNativePrimitive(ty.primitive)
                return {
                    value: `sts.${type}()`,
                    type,
                }
            }
            case TypeKind.Compact: {
                let compact = this.runtime.description.types[ty.type]
                assert(compact.kind == TypeKind.Primitive)
                let type = toNativePrimitive(compact.primitive)
                return {
                    value: `sts.${type}()`,
                    type,
                }
            }
            case TypeKind.BitSequence:
                return {
                    value: `sts.uint8array()`,
                    type: 'Uint8Array',
                }
            case TypeKind.HexBytes:
            case TypeKind.HexBytesArray:
                return {
                    value: 'sts.bytes()',
                    type: 'Bytes',
                }
            case TypeKind.Sequence:
            case TypeKind.Array: {
                let exp = this.useType(ty.type)
                return {
                    value: `sts.array(() => ${exp.value})`,
                    type: exp.type + '[]',
                }
            }
            case TypeKind.Tuple:
                return this.renderTuple(ty.tuple)
            case TypeKind.Option: {
                let exp = this.useType(ty.type)
                return {
                    value: `sts.option(() => ${exp.value})`,
                    type: `(${exp.type} | undefined)`,
                }
            }
            case TypeKind.DoNotConstruct:
                return {type: 'never', value: 'undefined'}
            default:
                throw unexpectedCase()
        }
    }

    private renderTuple(tuple: Ti[]): Exp {
        if (tuple.length === 0) {
            return {
                value: 'sts.unit()',
                type: `null`,
            }
        } else {
            let exps = tuple.map((ti) => this.useType(ti))
            return {
                value: `sts.tuple(() => ${exps.map((exp) => exp.value).join(', ')})`,
                type: '[' + exps.map((exp) => exp.type).join(', ') + ']',
            }
        }
    }

    private isUndefined(ti: Ti): boolean {
        return this.runtime.description.types[ti].kind == TypeKind.Option
    }

    private isUnit(ti: Ti): boolean {
        let ty = this.runtime.description.types[ti]
        switch (ty.kind) {
            case TypeKind.Composite:
                return ty.fields.length == 0
            case TypeKind.Tuple:
                return ty.tuple.length == 0
            default:
                return false
        }
    }
}

function createName(pallet: string, name: string, suffix: string): string {
    return upperCaseFirst(toCamelCase(`${pallet}_${name}_${suffix}`))
}
