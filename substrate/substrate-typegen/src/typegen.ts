import {SpecVersion} from '@subsquid/substrate-metadata-explorer/lib/specVersion'
import {QualifiedName, Runtime} from '@subsquid/substrate-runtime'
import {OldSpecsBundle, OldTypesBundle, StorageItem} from '@subsquid/substrate-runtime/lib/metadata'
import {def, last, maybeLast} from '@subsquid/util-internal'
import {OutDir, Output} from '@subsquid/util-internal-code-printer'
import {toCamelCase} from '@subsquid/util-naming'
import {Sink, Sts} from './ifs'
import {assignNames} from './names'
import {groupBy, isEmptyVariant, upperCaseFirst} from './util'


type Exp = string


interface Item<T> {
    name: QualifiedName
    def: T
    runtime: Runtime
}


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

    private sts = new Map<Runtime, Sts>()
    private dir: OutDir

    constructor(private options: TypegenOptions) {
        this.dir = new OutDir(options.outDir)
    }

    generate(): void {
        this.dir.del()
        this.generateEnums('events')
        this.generateEnums('calls')
        // this.generateStorage()
        // this.generateConsts()
        this.sts.forEach((sts, runtime) => {
            if (sts.sink.isEmpty()) return
            let fileName = toCamelCase(this.getVersionName(runtime)) + '.ts'
            let file = this.dir.file(fileName)
            file.line(`import {Bytes, sts} from './support'`)
            sts.sink.generate(file)
            file.write()
        })
        this.dir.add('support.ts', [__dirname, '../src/support.ts'])
    }

    private generateEnums(kind: 'events' | 'calls'): void {
        let items = this.collectItems(
            this.options[kind],
            runtime => Object.entries(runtime[kind].definitions).map(([name, def]) => {
                return {name, def, runtime}
            }),
            (runtime, name) => runtime[kind].getTypeHash(name)
        )

        if (items.size == 0) return

        let out = this.dir.file(`${kind}.ts`)
        let fix = kind == 'events' ? 'Event' : 'Call'
        let names = Array.from(items.keys()).sort()

        out.line(`import assert from 'assert'`)
        out.line(`import {${fix}Type, sts} from './support'`)
        let runtimeImports = this.runtimeImports(out)

        names.forEach(name => {
            let versions = items.get(name)!
            let {def: {pallet, name: unqualifiedName}} = versions[0]
            let constantName = upperCaseFirst(toCamelCase(`${pallet}_${unqualifiedName}`))

            for (let v of versions) {
                let versionName = this.getVersionName(v.runtime)
                let sts = this.getSts(v.runtime)

                out.line()
                out.blockComment(v.def.docs)
                out.line(`export const ${constantName}${versionName} = new EventType(`)
                out.indentation(() => {
                    if (v.def.fields.length == 0 || v.def.fields[0].name == null) {
                        if (v.def.fields.length == 1) {
                            out.line(this.qualify(runtimeImports, v.runtime, sts.use(v.def.fields[0].type)))
                        } else {
                            let texp = v.def.fields.map(f => sts.use(f.type)).join(', ')
                            texp = this.qualify(runtimeImports, v.runtime, texp)
                            out.line(`sts.tuple(${texp})`)
                        }
                    } else {
                        out.line('sts.struct({')
                        out.indentation(() => {
                            for (let f of v.def.fields) {
                                let texp = this.qualify(runtimeImports, v.runtime, sts.use(f.type))
                                out.blockComment(f.docs)
                                out.line(`${f.name}: ${texp},`)
                            }
                        })
                        out.line('})')
                    }
                })
                out.line(')')
            }
        })

        out.write()
    }

    //
    // private generateConsts(): void {
    //     let items = this.collectItems(
    //         this.options.constants,
    //         chain => {
    //             let items: Item<Constant>[] = []
    //             let consts = chain.description.constants
    //             for (let prefix in consts) {
    //                 for (let name in consts[prefix]) {
    //                     items.push({
    //                         chain,
    //                         name: prefix + '.' + name,
    //                         def: consts[prefix][name]
    //                     })
    //                 }
    //             }
    //             return items
    //         },
    //         (chain, name) => {
    //             let [prefix, itemName] = name.split('.')
    //             let def = chain.description.constants[prefix][itemName]
    //             return getTypeHash(chain.description.types, def.type)
    //         }
    //     )
    //
    //     if (items.size == 0) return
    //
    //     let out = this.dir.file(`constants.ts`)
    //     let names = Array.from(items.keys()).sort()
    //
    //     out.line(`import assert from 'assert'`)
    //     out.line(`import {getRuntime, Runtime, Result, Option} from './support'`)
    //     let importedInterfaces = this.importRuntimes(out)
    //     names.forEach(qualifiedName => {
    //         let versions = items.get(qualifiedName)!
    //         let [pallet, name] = qualifiedName.split('.')
    //         out.line()
    //         out.block(`export class ${pallet}${name}Constant`, () => {
    //             out.line(`private readonly runtime: Runtime`)
    //             out.line()
    //             out.block(`constructor(runtime: RuntimeCtx)`, () => {
    //                 out.line(`this.runtime = getRuntime(runtime)`)
    //             })
    //             versions.forEach(v => {
    //                 let versionName = this.getVersionName(v.chain)
    //                 let hash = getTypeHash(v.chain.description.types, v.def.type)
    //                 let ifs = this.getSts(v.chain)
    //                 let type = ifs.use(v.def.type)
    //                 let qualifiedType = this.qualify(importedInterfaces, v.chain, type)
    //
    //                 out.line()
    //                 out.blockComment(v.def.docs)
    //                 out.block(`get is${versionName}()`, () => {
    //                     out.line(`return this.runtime.getConstantTypeHash('${pallet}', '${name}') === '${hash}'`)
    //                 })
    //
    //                 out.line()
    //                 out.blockComment(v.def.docs)
    //                 out.block(`get as${versionName}(): ${qualifiedType}`, () => {
    //                     out.line(`assert(this.is${versionName})`)
    //                     out.line(`return this.runtime.getConstant('${pallet}', '${name}')`)
    //                 })
    //             })
    //             out.line()
    //             out.blockComment([
    //                 'Checks whether the constant is defined for the current chain version.'
    //             ])
    //             out.block(`get isExists(): boolean`, () => {
    //                 out.line(`return this.runtime.getConstantTypeHash('${pallet}', '${name}') != null`)
    //             })
    //         })
    //     })
    //
    //     out.write()
    // }
    //
    // private generateStorage(): void {
    //     let items = this.collectItems(
    //         this.options.storage,
    //         chain => {
    //             let items: Item<StorageItem>[] = []
    //             let storage = chain.description.storage
    //             for (let prefix in storage) {
    //                 for (let name in storage[prefix]) {
    //                     items.push({
    //                         chain,
    //                         name: prefix + '.' + name,
    //                         def: storage[prefix][name]
    //                     })
    //                 }
    //             }
    //             return items
    //         },
    //         (chain, name) => {
    //             let [prefix, itemName] = name.split('.')
    //             return getStorageItemTypeHash(chain.description.types, chain.description.storage[prefix][itemName])
    //         }
    //     )
    //     if (items.size == 0) return
    //
    //     let out = this.dir.file('storage.ts')
    //     let names = Array.from(items.keys()).sort()
    //
    //     out.line(`import assert from 'assert'`)
    //     out.line(`import {StorageBase} from './support'`)
    //     let importedInterfaces = this.importRuntimes(out)
    //
    //     names.forEach(qualifiedName => {
    //         let versions = items.get(qualifiedName)!
    //         let [prefix, name] = qualifiedName.split('.')
    //
    //         out.line()
    //         out.block(`export class ${prefix}${name}Storage extends StorageBase`, () => {
    //             out.block(`protected getPrefix()`, () => {
    //                 out.line(`return '${prefix}'`)
    //             })
    //             out.line()
    //             out.block(`protected getName()`, () => {
    //                 out.line(`return '${name}'`)
    //             })
    //             versions.forEach(v => {
    //                 let versionName = this.getVersionName(v.chain)
    //                 let hash = getStorageItemTypeHash(v.chain.description.types, v.def)
    //                 out.line()
    //                 out.blockComment(v.def.docs)
    //                 out.block(`get is${versionName}(): boolean`, () => {
    //                     out.line(`return this.getTypeHash() === '${hash}'`)
    //                 })
    //                 if (isUnitStorageItem(v)) {
    //                     // Meaning storage item can't hold any value
    //                     // Let's just silently omit `asVxx` getter for this case
    //                 } else {
    //                     out.line()
    //                     out.blockComment(v.def.docs)
    //                     out.block(`get as${versionName}(): ${prefix}${name}Storage${versionName}`, () => {
    //                         out.line(`assert(this.is${versionName})`)
    //                         out.line(`return this as any`)
    //                     })
    //                 }
    //             })
    //         })
    //
    //         versions.forEach(v => {
    //             if (isUnitStorageItem(v)) return // No asVxx getter
    //
    //             let versionName = this.getVersionName(v.chain)
    //             let ifs = this.getSts(v.chain)
    //             let types = v.def.keys.concat(v.def.value).map(ti => ifs.use(ti))
    //             let qualifiedTypes = types.map(texp => this.qualify(importedInterfaces, v.chain, texp))
    //             let valueType = qualifiedTypes.pop()!
    //             let returnType = v.def.modifier == 'Optional' ? `(${valueType} | undefined)` : valueType
    //             let keyTypes = qualifiedTypes
    //
    //             let keyArgs = keyTypes.map((texp, idx) => {
    //                 let name = keyTypes.length > 1 ? `key${idx + 1}` : 'key'
    //                 return name + ': ' + texp
    //             })
    //
    //             let keyTuple = keyTypes.length == 1 ? keyTypes[0] : `[${keyTypes.join(', ')}]`
    //             let keyValueTuple = `[k: ${keyTuple}, v: ${valueType}]`
    //
    //             function* enumeratePartialKeyArgs(leading?: string): Iterable<string> {
    //                 let list: string[] = []
    //                 if (leading) {
    //                     list.push(leading)
    //                 }
    //                 yield list.join(', ')
    //                 for (let arg of keyArgs) {
    //                     list.push(arg)
    //                     yield list.join(', ')
    //                 }
    //             }
    //
    //             out.line()
    //             out.blockComment(v.def.docs)
    //             out.block(`export interface ${prefix}${name}Storage${versionName}`, () => {
    //                 out.line(`get(${keyArgs.join(', ')}): Promise<${returnType}>`)
    //                 if (keyArgs.length > 0) {
    //                     out.line(`getAll(): Promise<${valueType}[]>`)
    //                     out.line(`getMany(keys: ${keyTuple}[]): Promise<${returnType}[]>`)
    //                     if (isStorageKeyDecodable(v.def)) {
    //                         for (let args of enumeratePartialKeyArgs()) {
    //                             out.line(`getKeys(${args}): Promise<${keyTuple}[]>`)
    //                         }
    //                         for (let args of enumeratePartialKeyArgs('pageSize: number')) {
    //                             out.line(`getKeysPaged(${args}): AsyncIterable<${keyTuple}[]>`)
    //                         }
    //                         for (let args of enumeratePartialKeyArgs()) {
    //                             out.line(`getPairs(${args}): Promise<${keyValueTuple}[]>`)
    //                         }
    //                         for (let args of enumeratePartialKeyArgs('pageSize: number')) {
    //                             out.line(`getPairsPaged(${args}): AsyncIterable<${keyValueTuple}[]>`)
    //                         }
    //                     }
    //                 }
    //             })
    //         })
    //     })
    //
    //     out.write()
    // }

    /**
     * Create a mapping between qualified name and list of unique versions
     */
    private collectItems<T>(
        req: string[] | boolean | undefined,
        extract: (runtime: Runtime) => Item<T>[],
        hash: (runtime: Runtime, name: QualifiedName) => string
    ): Map<QualifiedName, Item<T>[]> {
        if (!req) return new Map()
        let requested = Array.isArray(req) ? new Set(req) : undefined
        if (requested?.size === 0) return new Map()

        let list = this.runtimes().flatMap(chain => extract(chain))
        let items = groupBy(list, i => i.name)

        requested?.forEach((name) => {
            if (!items.has(name)) {
                throw new Error(`${name} is not defined by the chain metadata`)
            }
        })

        items.forEach((versions, name) => {
            if (requested == null || requested.has(name)) {
                let unique: Item<T>[] = []
                versions.forEach((v) => {
                    let prev = maybeLast(unique)
                    if (prev && hash(v.runtime, name) === hash(prev.runtime, name)) {
                    } else {
                        unique.push(v)
                    }
                })
                items.set(name, unique)
            } else {
                items.delete(name)
            }
        })

        return items
    }

    private getVersionName(runtime: Runtime): string {
        if (this.specNameNotChanged() || last(this.runtimes()).specName == runtime.specName) {
            return `V${runtime.specVersion}`
        } else {
            let isName = toCamelCase(`is-${runtime.specName}-v${runtime.specVersion}`)
            return isName.slice(2)
        }
    }

    @def
    private specNameNotChanged(): boolean {
        return new Set(this.runtimes().map(v => v.specName)).size < 2
    }

    @def
    runtimes(): Runtime[] {
        return this.options.specVersions.map(v => {
            return new Runtime(
                {
                    specName: v.specName,
                    specVersion: v.specVersion,
                    implName: '-',
                    implVersion: 0
                },
                v.metadata,
                this.options.typesBundle
            )
        })
    }

    getSts(runtime: Runtime): Sts {
        let sts = this.sts.get(runtime)
        if (sts) return sts
        let sink = new Sink(runtime.description.types, assignNames(runtime.description))
        sts = new Sts(sink)
        this.sts.set(runtime, sts)
        return sts
    }

    private runtimeImports(out: Output): Set<Runtime> {
        let set = new Set<Runtime>()
        out.lazy(() => {
            Array.from(set)
                .sort((a, b) => a.specVersion - b.specVersion)
                .forEach((v) => {
                    let name = toCamelCase(this.getVersionName(v))
                    out.line(`import * as ${name} from './${name}'`)
                })
        })
        return set
    }

    private qualify(importedInterfaces: Set<Runtime>, runtime: Runtime, texp: Exp): Exp {
        let sts = this.getSts(runtime)
        let prefix = toCamelCase(this.getVersionName(runtime))
        let qualified = sts.sink.qualify(prefix, texp)
        if (qualified != texp) {
            importedInterfaces.add(runtime)
        }
        return qualified
    }
}


/**
 * Returns true when storage item actually can't hold any value
 */
function isUnitStorageItem(item: Item<StorageItem>): boolean {
    return isEmptyVariant(item.runtime.description.types[item.def.value])
}


function isStorageKeyDecodable(item: StorageItem): boolean {
    return item.hashers.every(hasher => {
        switch(hasher) {
            case 'Blake2_128Concat':
            case 'Twox64Concat':
            case 'Identity':
                return true
            default:
                return false
        }
    })
}
