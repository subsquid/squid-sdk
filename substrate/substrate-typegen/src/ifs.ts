import {Runtime} from '@subsquid/substrate-runtime'
import {
    CompositeType,
    Field,
    RuntimeDescription,
    StorageItem,
    Ti,
    Type,
    TypeKind,
    VariantType,
} from '@subsquid/substrate-runtime/lib/metadata'
import {createScaleType} from '@subsquid/substrate-runtime/lib/runtime/util'
import {assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import {OutDir, Output} from '@subsquid/util-internal-code-printer'
import {toCamelCase} from '@subsquid/util-naming'
import assert from 'assert'
import {assignNames} from './names'
import {asOptionType, asResultType, isEmptyVariant, toNativePrimitive, upperCaseFirst} from './util'
import {ItemKind, getItemName} from './items'

export interface Exp {
    type: string
    value: string
}

type QueueItem = (out: Output, imports?: Set<string>) => void

export class Sink {
    private queue: QueueItem[] = []

    constructor() {}

    push(cb: QueueItem): void {
        this.queue.push(cb)
    }

    isEmpty(): boolean {
        return this.queue.length == 0
    }

    generate(out: Output, imports?: Set<string>): void {
        let cb
        while ((cb = this.queue.pop())) {
            cb(out, imports)
        }
    }
}

export class Sts {
    readonly sink = new Sink()

    protected types = new Map<Ti, Exp>()

    protected assignedNames = new Set<string>()

    constructor(protected typeDefs: Type[], protected typeNames: Map<Ti, string>) {}

    useType(ti: Ti): Exp {
        let exp = this.types.get(ti)
        if (exp == null) {
            let name = this.typeNames.get(ti)
            let def = this.typeDefs[ti]

            if (name != null) {
                this.types.set(ti, {type: name, value: name})
                this.assignedNames.add(name)
            }

            let out = this.sink
            exp = this.makeType(out, name, def)
        }

        return exp
    }

    qualify(exp: string, ns?: string): string {
        if (ns == null) return exp

        this.extractNames(exp).forEach((name) => {
            exp = exp.replace(new RegExp(`\\b${name}\\b`, 'g'), ns + '.' + name)
        })

        return exp
    }

    protected extractNames(exp: string) {
        let names = exp
            .split(/[<>&|,()\[\]{}:]/)
            .map((t) => t.trim())
            .filter((t) => !!t)

        return new Set(names.filter((name) => this.assignedNames.has(name)))
    }

    protected makeType(sink: Sink, name: string | undefined, ty: Type): Exp {
        switch (ty.kind) {
            case TypeKind.Composite: {
                assert(name != null)
                this.makeComposite(sink, name, ty)
                return {value: name, type: name}
            }
            case TypeKind.Variant: {
                let result = asResultType(ty)
                if (result) {
                    let ok = this.useType(result.ok)
                    let err = this.useType(result.err)
                    return {
                        value: `sts.result(${this.renderGetter(ok.value)}, ${this.renderGetter(err.value)})`,
                        type: `Result<${ok.value}, ${err.value}>`,
                    }
                }
                let option = asOptionType(ty)
                if (option) {
                    let some = this.useType(option.some)
                    return {
                        value: `sts.closedEnum({Some: ${this.renderGetter(some.value)}, None: sts.unit()})`,
                        type: `Option<${some.type}>`,
                    }
                }
                assert(name != null)
                this.makeVariant(sink, name, ty)
                return {value: name, type: name}
            }
            default: {
                let exp = this.renderType(ty)
                if (name != null) {
                    sink.push((out, types) => {
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

    protected makeComposite(sink: Sink, name: string, ty: CompositeType): void {
        sink.push((out, types) => {
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
                out.block(`export type ${name} =`, () => {
                    ty.fields.forEach((f, i) => {
                        let name = assertNotNull(f.name)
                        let opt = this.isUndefined(f.type) ? '?' : ''
                        out.line(`${name}${opt}: ${fieldsExp[i].type},`)
                    })
                })
                out.line()
                out.line(`export const ${name}: sts.Type<${name}> = sts.struct(() => {`)
                out.indentation(() => {
                    out.block('return', () =>
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

    protected makeVariant(sink: Sink, name: string, ty: VariantType): void {
        sink.push((out, types) => {
            out.line()
            out.blockComment(ty.docs)
            if (ty.variants.length == 0) {
                out.line(`export type ${name} = never`)
                out.line()
                out.line(`export const ${name}: sts.Type<${name}> = sts.closedEnum({})`)
                return
            } else {
                let variantsExp = ty.variants.map((v) => v.fields.map((f) => this.useType(f.type)))
                variantsExp.forEach((v) =>
                    v.forEach((exp) => this.extractNames(exp.type).forEach((n) => types?.add(n)))
                )

                out.line(`export type ${name} = ${ty.variants.map((v) => name + '_' + v.name).join(' | ')}`)
                ty.variants.forEach((v, i) => {
                    out.line()
                    out.blockComment(v.docs)
                    out.block(`export type ${name + '_' + v.name} =`, () => {
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
                out.line()
                out.line(`export const ${name}: sts.Type<${name}> = sts.closedEnum(() => {`)
                out.indentation(() => {
                    out.block('return', () => {
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
            }
        })
    }

    protected renderType(ty: Type): Exp {
        switch (ty.kind) {
            case TypeKind.Primitive: {
                let type = toNativePrimitive(ty.primitive)
                return {
                    value: `sts.${type}()`,
                    type,
                }
            }
            case TypeKind.Compact: {
                let compact = this.typeDefs[ty.type]
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
                return {type: 'never', value: 'sts.unit()'}
            default:
                throw unexpectedCase()
        }
    }

    protected renderTuple(tuple: Ti[]): Exp {
        if (tuple.length === 0) {
            return {
                value: 'sts.unit()',
                type: `null`,
            }
        } else {
            let exps = tuple.map((ti) => this.useType(ti))
            return {
                value: `sts.tuple(() => [${exps.map((exp) => exp.value).join(', ')}])`,
                type: '[' + exps.map((exp) => exp.type).join(', ') + ']',
            }
        }
    }

    protected renderGetter(str: string) {
        return this.assignedNames.has(str) ? `() => ${str}` : str
    }

    protected isUndefined(ti: Ti): boolean {
        return this.typeDefs[ti].kind == TypeKind.Option
    }

    protected isUnit(ti: Ti): boolean {
        let ty = this.typeDefs[ti]
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

export class RuntimeSts extends Sts {
    private items = {
        events: new Map<string, Exp>(),
        calls: new Map<string, Exp>(),
        constants: new Map<string, Exp>(),
        storage: new Map<string, Exp>(),
    }

    public readonly palletSinks = new Map<string, Sink>()

    constructor(private runtime: RuntimeDescription) {
        let typeNames = assignNames(runtime)
        super(runtime.types, typeNames)
    }

    useItem(pallet: string, item: string, kind: ItemKind) {
        let qn = `${pallet}.${item}`
        let type = this.items[kind].get(qn)
        if (type == null) {
            let fix = getItemName(kind)
            let name = createName(pallet, item, fix)
            this.assignedNames.add(name)

            type = {value: name, type: name}
            this.items[kind].set(qn, type)

            let queue = this.getPalletSink(pallet)
            switch (kind) {
                case ItemKind.Call:
                case ItemKind.Event: {
                    let def = this.runtime.pallets[pallet][kind][item]
                    let scaleType = createScaleType(this.runtime.types, def)
                    this.makeType(queue, name, scaleType)
                    break
                }
                case ItemKind.Constant: {
                    let def = this.runtime.pallets[pallet][kind][item]
                    queue.push((out, types) => {
                        let exp = this.useType(def.type)
                        this.extractNames(exp.type).forEach((n) => types?.add(n))

                        out.line()
                        out.blockComment(def.docs)
                        out.line(`export type ${name} = ${exp.type}`)
                        out.line()
                        out.line(`export const ${name}: sts.Type<${name}> = ${exp.value}`)
                    })
                    break
                }
                case ItemKind.Storage: {
                    let def = this.runtime.pallets[pallet][kind][item]
                    queue.push((out, types) => {
                        out.line()
                        out.blockComment(def.docs)

                        let keysExp = def.keys.map((k) => this.useType(k))
                        keysExp.forEach((exp) => this.extractNames(exp.type).forEach((n) => types?.add(n)))

                        let valueExp = this.useType(def.value)
                        this.extractNames(valueExp.type).forEach((n) => types?.add(n))

                        out.block(`export type ${name} =`, () => {
                            let args =
                                def.keys.length == 1
                                    ? [`key: ${keysExp[0].type}`]
                                    : keysExp.map((exp, idx) => `key${idx + 1}: ${exp.type}`)

                            let fullKey =
                                def.keys.length == 1
                                    ? keysExp[0].type
                                    : `[${keysExp.map((exp) => exp.type).join(', ')}]`

                            let ret = def.modifier == 'Required' ? valueExp.type : `${valueExp.type} | undefined`

                            let kv = `[k: ${fullKey}, v: ${ret}]`

                            function* enumeratePartialApps(leading?: string): Iterable<string> {
                                let list: string[] = []
                                if (leading) {
                                    list.push(leading)
                                }
                                list.push('block: Block')
                                yield list.join(', ')
                                for (let arg of args) {
                                    list.push(arg)
                                    yield list.join(', ')
                                }
                            }

                            if (def.modifier === 'Default') {
                                out.line(`getDefault(block: Block): ${valueExp.type}`)
                            }

                            out.line(`get(${['block: Block'].concat(args).join(', ')}): Promise<${ret}>`)

                            for (let args of enumeratePartialApps()) {
                                out.line(`getValues(${args}): Promise<${ret}[]>`)
                            }
                            for (let args of enumeratePartialApps('pageSize: number')) {
                                out.line(`getValuesPaged(${args}): AsyncIterable<${ret}[]>`)
                            }

                            if (args.length > 0) {
                                out.line(`getMany(block: Block, keys: ${fullKey}[]): Promise<${ret}[]>`)
                                for (let args of enumeratePartialApps()) {
                                    out.line(`getKeys(${args}): Promise<${fullKey}[]>`)
                                }
                                for (let args of enumeratePartialApps('pageSize: number')) {
                                    out.line(`getKeysPaged(${args}): AsyncIterable<${fullKey}[]>`)
                                }
                                for (let args of enumeratePartialApps()) {
                                    out.line(`getPairs(${args}): Promise<${kv}[]>`)
                                }
                                for (let args of enumeratePartialApps('pageSize: number')) {
                                    out.line(`getPairsPaged(${args}): AsyncIterable<${kv}[]>`)
                                }

                                out.line(`isStorageKeyDecodable(): boolean`)
                            }
                        })
                        out.line()
                        out.block(`export const ${name} =`, () => {
                            out.line(`keys: [${keysExp.map((exp) => exp.value).join(', ')}],`)
                            out.line(`value: ${valueExp.value},`)
                            out.line(`modifier: '${def.modifier}',`)
                        })
                    })
                    break
                }
            }
        }
        return type
    }

    private getPalletSink(pallet: string) {
        let name = toCamelCase(pallet)

        let sink = this.palletSinks.get(name)
        if (sink == null) {
            sink = new Sink()
            this.palletSinks.set(name, sink)
        }

        return sink
    }

    /**
     * Returns true when storage item actually can't hold any value
     */
    private isEmptyStorageItem(item: StorageItem): boolean {
        return isEmptyVariant(this.runtime.types[item.value])
    }
}

function createName(pallet: string, name: string, fix: string): string {
    return upperCaseFirst(toCamelCase(`${pallet}_${name}_${fix}`))
}

// function isStorageKeyDecodable(item: StorageItem): boolean {
//     return item.hashers.every((hasher) => {
//         switch (hasher) {
//             case 'Blake2_128Concat':
//             case 'Twox64Concat':
//             case 'Identity':
//                 return true
//             default:
//                 return false
//         }
//     })
// }
