import {SpecVersion} from '@subsquid/substrate-metadata-explorer/lib/specVersion'
import {QualifiedName, Runtime} from '@subsquid/substrate-runtime'
import {OldSpecsBundle, OldTypesBundle, StorageItem} from '@subsquid/substrate-runtime/lib/metadata'
import {getTypeHash} from '@subsquid/substrate-runtime/lib/sts'
import {def, groupBy} from '@subsquid/util-internal'
import {OutDir, Output} from '@subsquid/util-internal-code-printer'
import {toCamelCase} from '@subsquid/util-naming'
import {Sink, Sts} from './ifs'
import {assignNames, deriveName} from './names'
import {isEmptyVariant, upperCaseFirst} from './util'


export interface TypegenOptions {
    outDir: string
    specVersions: SpecVersion[]
    typesBundle?: OldTypesBundle | OldSpecsBundle
    events?: string[] | boolean
    calls?: string[] | boolean
    storage?: string[] | boolean
    constants?: string[] | boolean
}


export class Typegen {
    static generate(options: TypegenOptions): void {
        new Typegen(options).generate()
    }

    private dir: OutDir

    constructor(private options: TypegenOptions) {
        this.dir = new OutDir(options.outDir)
    }

    generate(): void {
        this.dir.del()

        let collectors = this.collectors()

        for (let runtime of this.runtimes()) {
            let versionName = this.getVersionName(runtime)
            let outDir = this.dir.path(versionName)

            RuntimeTypegen.generate({
                outDir,
                runtime,
                events: collectors.events.get(runtime),
                calls: collectors.calls.get(runtime),
                constants: collectors.constants.get(runtime),
                storage: collectors.storage.get(runtime),
            })
        }

        this.dir.add('support.ts', [__dirname, '../src/support.ts'])
    }

    @def
    collectors() {
        let events = new ItemCollector(
            this.options.events,
            (r) => Object.keys(r.events.definitions),
            (r, n) => r.events.getTypeHash(n)
        )

        let calls = new ItemCollector(
            this.options.calls,
            (r) => Object.keys(r.calls.definitions),
            (r, n) => r.calls.getTypeHash(n)
        )

        let constants = new ItemCollector(
            this.options.constants,
            (r) => {
                let items: string[] = []
                let consts = r.description.constants
                for (let prefix in consts) {
                    for (let name in consts[prefix]) {
                        items.push(prefix + '.' + name)
                    }
                }
                return items
            },
            (r, n) => {
                let [prefix, name] = n.split('.')
                let def = r.description.constants[prefix][name]
                return getTypeHash(r.description.types, def.type)
            }
        )

        let storage = new ItemCollector(
            this.options.storage,
            (r) => {
                let items: string[] = []
                let storage = r.description.storage
                for (let prefix in storage) {
                    for (let name in storage[prefix]) {
                        items.push(prefix + '.' + name)
                    }
                }
                return items
            },
            (r, n) => {
                let [prefix, name] = n.split('.')
                let def = r.description.storage[prefix][name]
                return JSON.stringify({
                    modifier: def.modifier,
                    key: def.keys.map((ti) => getTypeHash(r.description.types, ti)),
                    value: getTypeHash(r.description.types, def.value),
                })
            }
        )

        return {
            events,
            calls,
            constants,
            storage,
        }
    }

    @def
    runtimes(): Runtime[] {
        return this.options.specVersions.map((v) => {
            return new Runtime(
                {
                    specName: v.specName,
                    specVersion: v.specVersion,
                    implName: '-',
                    implVersion: 0,
                },
                v.metadata,
                this.options.typesBundle
            )
        })
    }

    private getVersionName(runtime: Runtime): string {
        if (this.specNameNotChanged()) {
            return `v${runtime.specVersion}`
        } else {
            return `${toCamelCase(runtime.specName)}-v${runtime.specVersion}`
        }
    }

    @def
    private specNameNotChanged(): boolean {
        return new Set(this.runtimes().map((v) => v.specName)).size < 2
    }
}

enum RuntimeModule {
    Events = 'events',
    Calls = 'calls',
    Storage = 'storage',
    Constants = 'constants',
    Types = 'types',
}

interface RuntimeTypegenOptions {
    outDir: string
    runtime: Runtime
    events: QualifiedName[]
    calls: QualifiedName[]
    storage: QualifiedName[]
    constants: QualifiedName[]
}

export class RuntimeTypegen {
    static generate(options: RuntimeTypegenOptions): void {
        new RuntimeTypegen(options).generate()
    }

    private dir: OutDir
    private sts: Sts

    private modules: Set<RuntimeModule>

    constructor(private options: RuntimeTypegenOptions) {
        this.dir = new OutDir(options.outDir)

        let runtime = options.runtime
        let sink = new Sink(runtime.description.types, assignNames(runtime.description))
        this.sts = new Sts(sink)

        this.modules = new Set()
    }

    generate(): void {
        this.dir.del()
        this.generateCalls()
        this.generateEvents()
        this.generateStorage()
        this.generateConstants()
        this.generateTypes()
        this.generateIndex()
    }

    private generateIndex(): void {
        if (this.modules.size == 0) return

        let out = this.dir.file('index.ts')
        for (let module of this.modules) {
            out.line(`export * as ${module} from './${module}'`)
        }
        out.write()
    }

    private generateTypes(): void {
        if (this.sts.sink.isEmpty()) return

        this.useModule(RuntimeModule.Types)

        let out = this.dir.file('types.ts')
        out.line(`import {sts, Result, Option, Bytes} from '../support'`)
        this.sts.sink.generate(out)
        out.write()
    }

    private generateEvents() {
        this.generateEnums(RuntimeModule.Events)
    }

    private generateCalls() {
        this.generateEnums(RuntimeModule.Calls)
    }

    private generateEnums(module: RuntimeModule.Events | RuntimeModule.Calls): void {
        let items = this.options[module]
        if (items == null || items.length == 0) return

        this.useModule(module)

        let runtime = this.options.runtime

        let prefix = module == RuntimeModule.Events ? 'Event' : 'Call'

        let itemsByPallets = groupBy(items, (i) => i.split('.')[0])
        for (let [pallet, palletItems] of itemsByPallets) {
            let out = this.dir.file(`${module}/${toCamelCase(pallet)}.ts`)

            out.line(`import {${prefix}Type, sts} from '../../support'`)
            let runtimeImports = this.runtimeImports(out)

            for (let qn of palletItems) {
                let def = runtime[module].definitions[qn]

                out.line()
                out.blockComment(def.docs)
                out.line(`export const ${def.name} = new ${prefix}Type(`)
                out.indentation(() => {
                    out.line(`'${qn}',`)
                    if (def.fields.length == 0 || def.fields[0].name == null) {
                        if (def.fields.length == 1) {
                            out.line(this.qualify(runtimeImports, this.sts.use(def.fields[0].type)))
                        } else {
                            let texp = def.fields.map((f) => this.sts.use(f.type)).join(', ')
                            texp = this.qualify(runtimeImports, texp)
                            if (texp) {
                                out.line(`sts.tuple(${texp})`)
                            } else {
                                out.line('sts.unit()')
                            }
                        }
                    } else {
                        out.line('sts.struct({')
                        out.indentation(() => {
                            for (let f of def.fields) {
                                let texp = this.qualify(runtimeImports, this.sts.use(f.type))
                                out.blockComment(f.docs)
                                out.line(`${f.name}: ${texp},`)
                            }
                        })
                        out.line('})')
                    }
                })
                out.line(')')
            }
            out.write()
        }

        let out = this.dir.file(`${module}/index.ts`)
        for (let pallet of itemsByPallets.keys()) {
            out.line(`export * as ${pallet} from './${toCamelCase(pallet)}'`)
        }
        out.write()
    }

    private generateConstants(): void {
        let items = this.options.constants
        if (items == null || items.length == 0) return

        let module = RuntimeModule.Constants
        this.useModule(module)

        let runtime = this.options.runtime

        let itemsByPallets = groupBy(items, (i) => i.split('.')[0])
        for (let [pallet, palletItems] of itemsByPallets) {
            let out = this.dir.file(`${module}/${toCamelCase(pallet)}.ts`)

            out.line(`import {ConstantType, sts} from '../../support'`)
            let runtimeImports = this.runtimeImports(out)

            for (let qn of palletItems) {
                let [, name] = qn.split('.')
                let def = runtime.description.constants[pallet][name]

                let type = this.sts.use(def.type)
                let qualifiedType = this.qualify(runtimeImports, type)

                out.line()
                out.blockComment(def.docs)
                out.line(`export const ${name} = new ConstantType(`)
                out.indentation(() => {
                    out.line(`'${qn}',`)
                    out.line(qualifiedType)
                })
                out.line(')')
            }
            out.write()
        }

        let out = this.dir.file(`${module}/index.ts`)
        for (let pallet of itemsByPallets.keys()) {
            out.line(`export * as ${pallet} from './${toCamelCase(pallet)}'`)
        }
        out.write()
    }

    private generateStorage(): void {
        let items = this.options.storage
        if (items.length == 0) return

        let module = RuntimeModule.Storage
        this.useModule(module)

        let runtime = this.options.runtime

        let itemsByPallets = groupBy(items, (i) => i.split('.')[0])
        for (let [prefix, palletItems] of itemsByPallets) {
            let out = this.dir.file(`${module}/${toCamelCase(prefix)}.ts`)

            out.line(`import {StorageType, sts, Block, Bytes, Option, Result} from '../../support'`)
            let runtimeImports = this.runtimeImports(out)

            for (let qn of palletItems) {
                let [, name] = qn.split('.')

                let def = runtime.description.storage[prefix][name]
                if (isEmptyVariant(runtime.description.types[def.value])) continue // Storage item can't hold any value

                let an = this.createName(prefix, name)

                let keyListExp = this.qualify(runtimeImports, def.keys.map((ti) => this.sts.use(ti)).join(', '))

                let valueExp = this.qualify(runtimeImports, this.sts.use(def.value))

                out.line()
                out.blockComment(def.docs)
                out.line(`export const ${name}: ${an}Storage = new StorageType(`)
                out.indentation(() => {
                    out.line(`'${qn}',`)
                    out.line(`'${def.modifier}',`)
                    out.line(`[${keyListExp}],`)
                    out.line(valueExp)
                })
                out.line(')')

                out.line()
                out.blockComment(def.docs)
                out.block(`export interface ${an}Storage `, () => {
                    let value = this.qualify(runtimeImports, this.sts.ifs.use(def.value))

                    let keys = def.keys.map((ti) => {
                        return this.qualify(runtimeImports, this.sts.ifs.use(ti))
                    })

                    let args = keys.length == 1 ? [`key: ${keys[0]}`] : keys.map((exp, idx) => `key${idx + 1}: ${exp}`)

                    let fullKey = keys.length == 1 ? keys[0] : `[${keys.join(', ')}]`

                    let ret = def.modifier == 'Required' ? value : `${value} | undefined`

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

                    if (def.modifier == 'Default') {
                        out.line(`getDefault(block: Block): ${value}`)
                    }

                    out.line(`get(${['block: Block'].concat(args).join(', ')}): Promise<${ret}>`)

                    if (args.length > 0) {
                        out.line(`getMany(block: Block, keys: ${fullKey}[]): Promise<${ret}[]>`)
                        if (isStorageKeyDecodable(def)) {
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
                        }
                    }
                })
            }
            out.write()
        }

        let out = this.dir.file(`${module}/index.ts`)
        for (let pallet of itemsByPallets.keys()) {
            out.line(`export * as ${pallet} from './${toCamelCase(pallet)}'`)
        }
        out.write()
    }

    private useModule(name: RuntimeModule) {
        this.modules.add(name)
    }

    private qualify(importedInterfaces: Set<string>, texp: string): string {
        let qualified = this.sts.sink.qualify(RuntimeModule.Types, texp)
        if (texp !== qualified) {
            importedInterfaces.add(texp)
        }
        return qualified
    }

    private createName(pallet: string, name: string): string {
        return upperCaseFirst(toCamelCase(`${pallet}_${name}`))
    }

    private runtimeImports(out: Output): Set<string> {
        let set = new Set<string>()
        out.lazy(() => {
            if (set.size > 0) {
                out.line(`import * as types from '../${RuntimeModule.Types}'`)
            }
        })
        return set
    }
}


class ItemCollector {
    private requested: Set<string> | undefined
    private prevHashes: Map<string, string>

    constructor(
        private req: string[] | boolean | undefined,
        private extract: (runtime: Runtime) => string[],
        private hash: (runtime: Runtime, name: string) => string
    ) {
        this.prevHashes = new Map()
    }

    get(runtime: Runtime) {
        if (this.req == null) return []

        this.requested = Array.isArray(this.req) ? new Set(this.req) : undefined
        if (this.requested?.size === 0) return []

        return this.extract(runtime).filter((name) => {
            if (this.requested == null || this.requested.has(name)) {
                let prev = this.prevHashes.get(name)
                let cur = this.hash(runtime, name)
                if (prev == null || cur !== prev) {
                    this.prevHashes.set(name, cur)
                    return true
                } else {
                    return false
                }
            } else {
                return false
            }
        })
    }
}


function isStorageKeyDecodable(item: StorageItem): boolean {
    return item.hashers.every((hasher) => {
        switch (hasher) {
            case 'Blake2_128Concat':
            case 'Twox64Concat':
            case 'Identity':
                return true
            default:
                return false
        }
    })
}
