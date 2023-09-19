import {SpecVersion} from '@subsquid/substrate-metadata-explorer/lib/specVersion'
import {Runtime} from '@subsquid/substrate-runtime'
import type * as md from '@subsquid/substrate-runtime/lib/metadata'
import {getTypeHash} from '@subsquid/substrate-runtime/lib/sts'
import {def, last, maybeLast} from '@subsquid/util-internal'
import {FileOutput, OutDir, Output} from '@subsquid/util-internal-code-printer'
import {toCamelCase} from '@subsquid/util-naming'
import {assignNames} from './names'
import {groupBy, isEmptyVariant, upperCaseFirst} from './util'
import {createScaleType} from '@subsquid/substrate-runtime/lib/runtime/util'
import {create} from 'domain'
import {Sts} from './ifs'

type Exp = string

interface Pallet {
    name: string
    events: Item[]
    calls: Item[]
    constants: Item[]
    storage: Item[]
}

interface Item {
    name: string
    versions: Runtime[]
}

export interface TypegenOptions {
    outDir: string
    specVersions: SpecVersion[]
    typesBundle?: md.OldTypesBundle | md.OldSpecsBundle
    pallets: string[] | boolean
}

export class Typegen {
    static generate(options: TypegenOptions): void {
        new Typegen(options).generate()
    }

    private sts = new Map<Runtime, Sts>()
    private dir: OutDir

    constructor(private options: TypegenOptions) {
        this.dir = new OutDir(options.outDir)
        // this.types = new StsManager(new OutDir(this.dir.path('versions')), this.runtimes())
    }

    generate(): void {
        this.dir.del()

        let pallets = this.collectPallets()
        for (let pallet of pallets) {
            this.generatePallet(pallet)
        }

        // this.sts.forEach((sts, runtime) => {
        //     if (sts.sink.isEmpty()) return
        //     let fileName = toCamelCase(this.getVersionName(runtime)) + '.ts'
        //     let file = this.dir.file(fileName)
        //     file.line(`import {sts, Result, Option, Bytes} from './support'`)
        //     sts.sink.generate(file)
        //     file.write()
        // })
        for (let s of this.sts.values()) {
            s.generate()
        }

        this.dir.add('pallet.support.ts', [__dirname, '../src/pallet.support.ts'])
    }

    // private getConstants() {
    //     return this.collectItems(
    //         this.options.pallets,
    //         (runtime) => {
    //             let items: Item<Constant>[] = []
    //             let consts = runtime.description.constants
    //             for (let prefix in consts) {
    //                 for (let name in consts[prefix]) {
    //                     items.push({
    //                         runtime,
    //                         name: prefix + '.' + name,
    //                         def: consts[prefix][name],
    //                     })
    //                 }
    //             }
    //             return items
    //         },
    //         (runtime, qualifiedName) => {
    //             let [prefix, name] = qualifiedName.split('.')
    //             let def = runtime.description.constants[prefix][name]
    //             return getTypeHash(runtime.description.types, def.type)
    //         }
    //     )
    // }

    // private getStorage() {
    //     return this.collectItems(
    //         this.options.pallets,
    //         (runtime) => {
    //             let items: Item<StorageItem>[] = []
    //             let storage = runtime.description.storage
    //             for (let pallet in storage) {
    //                 for (let name in storage[pallet]) {
    //                     items.push({
    //                         runtime,
    //                         name: pallet + '.' + name,
    //                         def: storage[pallet][name],
    //                     })
    //                 }
    //             }
    //             return items
    //         },
    //         (runtime, qualifiedName) => {
    //             let [pallet, name] = qualifiedName.split('.')
    //             let def = runtime.description.storage[pallet][name]
    //             return JSON.stringify({
    //                 modifier: def.modifier,
    //                 key: def.keys.map((ti) => getTypeHash(runtime.description.types, ti)),
    //                 value: getTypeHash(runtime.description.types, def.value),
    //             })
    //         }
    //     )
    // }

    // private generateEnums(kind: 'events' | 'calls', items: Map<string, Item<EACDefinition>>): void {
    //     if (items.size == 0) return

    //     let out = this.dir.file(`${kind}.ts`)
    //     let fix = kind == 'events' ? 'Event' : 'Call'

    //     out.line(`import {${fix}, sts} from './support'`)
    //     let runtimeImports = this.runtimeImports(out)

    //     for (let [qn, v] of this.enumerateVersions(items)) {
    //         let versionName = this.getVersionName(v.runtime)
    //         let itemName = this.createName(v.def.pallet, v.def.name, fix)
    //         let sts = this.getSts(v.runtime)

    //         out.line()
    //         out.blockComment(v.def.docs)
    //         out.line(`export const ${itemName} = new ${fix}(`)
    //         out.indentation(() => {
    //             out.line(`'${qn}',`)
    //             if (v.def.fields.length == 0 || v.def.fields[0].name == null) {
    //                 if (v.def.fields.length == 1) {
    //                     out.line(this.qualify(runtimeImports, v.runtime, v.def.fields[0].type))
    //                 } else {
    //                     if (v.def.fields.length > 0) {
    //                         let texp = v.def.fields
    //                             .map((f) => this.qualify(runtimeImports, v.runtime, f.type))
    //                             .join(', ')
    //                         out.line(`sts.tuple(${texp})`)
    //                     } else {
    //                         out.line('sts.unit()')
    //                     }
    //                 }
    //             } else {
    //                 out.line('sts.struct({')
    //                 out.indentation(() => {
    //                     for (let f of v.def.fields) {
    //                         let texp = this.qualify(runtimeImports, v.runtime, f.type)
    //                         out.blockComment(f.docs)
    //                         out.line(`${f.name}: ${texp},`)
    //                     }
    //                 })
    //                 out.line('})')
    //             }
    //         })
    //         out.line(')')
    //     }

    //     out.write()
    // }

    // private generateConsts(items: Map<string, Item<Constant>>): void {
    //     if (items.size == 0) return

    //     let out = this.dir.file(`constants.ts`)
    //     out.line(`import {Constant, sts} from './support'`)
    //     let imports = this.runtimeImports(out)

    //     for (let [qn, v] of this.enumerateVersions(items)) {
    //         let [pallet, name] = qn.split('.')
    //         let versionName = this.getVersionName(v.runtime)
    //         let itemName = this.createName(pallet, name, 'Const')
    //         let qualifiedType = this.qualify(imports, v.runtime, v.def.type)

    //         out.line()
    //         out.blockComment(v.def.docs)
    //         out.line(`export const ${itemName} = new Constant(`)
    //         out.indentation(() => {
    //             out.line(`'${qn}',`)
    //             out.line(qualifiedType)
    //         })
    //         out.line(')')
    //     }

    //     out.write()
    // }

    // private generateStorage(items: Map<string, Item<StorageItem>>): void {
    //     if (items.size == 0) return

    //     let out = this.dir.file('storage.ts')
    //     out.line(`import {Storage, sts, Block, Bytes, Option, Result} from './support'`)
    //     let importedInterfaces = this.runtimeImports(out)

    //     for (let [qn, v] of this.enumerateVersions(items)) {
    //         if (isEmptyStorageItem(v)) continue // Storage item can't hold any value

    //         let [pallet, name] = qn.split('.')
    //         let an = this.createName(pallet, name, 'Storage', this.getVersionName(v.runtime))
    //         {
    //             let keyListExp = v.def.keys.map((ti) => this.qualify(importedInterfaces, v.runtime, ti)).join(', ')

    //             let valueExp = this.qualify(importedInterfaces, v.runtime, v.def.value)

    //             out.line()
    //             out.blockComment(v.def.docs)
    //             out.line(`export const ${an}: I${an} = new Storage(`)
    //             out.indentation(() => {
    //                 out.line(`'${qn}',`)
    //                 out.line(`'${v.def.modifier}',`)
    //                 out.line(`[${keyListExp}],`)
    //                 out.line(valueExp)
    //             })
    //             out.line(')')
    //         }

    //         out.line()
    //         out.blockComment(v.def.docs)
    //         out.block(`export interface I${an} `, () => {
    //             let value = this.qualify(importedInterfaces, v.runtime, v.def.value)

    //             let keys = v.def.keys.map((ti) => {
    //                 return this.qualify(importedInterfaces, v.runtime, ti)
    //             })

    //             let args = keys.length == 1 ? [`key: ${keys[0]}`] : keys.map((exp, idx) => `key${idx + 1}: ${exp}`)

    //             let fullKey = keys.length == 1 ? keys[0] : `[${keys.join(', ')}]`

    //             let ret = v.def.modifier == 'Required' ? value : `${value} | undefined`

    //             let kv = `[k: ${fullKey}, v: ${ret}]`

    //             function* enumeratePartialApps(leading?: string): Iterable<string> {
    //                 let list: string[] = []
    //                 if (leading) {
    //                     list.push(leading)
    //                 }
    //                 list.push('block: Block')
    //                 yield list.join(', ')
    //                 for (let arg of args) {
    //                     list.push(arg)
    //                     yield list.join(', ')
    //                 }
    //             }

    //             if (v.def.modifier == 'Default') {
    //                 out.line(`getDefault(block: Block): ${value}`)
    //             }

    //             out.line(`get(${['block: Block'].concat(args).join(', ')}): Promise<${ret}>`)

    //             if (args.length > 0) {
    //                 out.line(`getMany(block: Block, keys: ${fullKey}[]): Promise<${ret}[]>`)
    //                 if (isStorageKeyDecodable(v.def)) {
    //                     for (let args of enumeratePartialApps()) {
    //                         out.line(`getKeys(${args}): Promise<${fullKey}[]>`)
    //                     }
    //                     for (let args of enumeratePartialApps('pageSize: number')) {
    //                         out.line(`getKeysPaged(${args}): AsyncIterable<${fullKey}[]>`)
    //                     }
    //                     for (let args of enumeratePartialApps()) {
    //                         out.line(`getPairs(${args}): Promise<${kv}[]>`)
    //                     }
    //                     for (let args of enumeratePartialApps('pageSize: number')) {
    //                         out.line(`getPairsPaged(${args}): AsyncIterable<${kv}[]>`)
    //                     }
    //                 }
    //             }
    //         })
    //     }

    //     out.write()
    // }

    private generatePallet(pallet: Pallet) {
        let out = this.dir.file(toCamelCase(pallet.name) + '.ts')
        let exports = new Set()

        out.line(`import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'`)

        let events = sortItems(pallet.events)
        if (events.length > 0) {
            out.line()
            out.block(`export const events =`, () => {
                for (let i of events) {
                    out.line(`${i.name}: createEvent(`)
                    out.indentation(() => {
                        out.line(`'${pallet.name}.${i.name}',`)
                        out.line('{')
                        out.indentation(() => {
                            for (let v of i.versions) {
                                let sts = this.getSts(v)
                                let versionName = toCamelCase(sts.name)
                                let type = sts.useEvent(pallet.name, i.name)
                                out.line(`${versionName}: ${type},`)
                            }
                        })
                        out.line('}')
                    })
                    out.line('),')
                }
            })
            exports.add('events')
        }

        let calls = sortItems(pallet.calls)
        if (calls.length > 0) {
            out.line()
            out.block(`export const calls =`, () => {
                for (let i of calls) {
                    out.line(`${i.name}: createCall(`)
                    out.indentation(() => {
                        out.line(`'${pallet.name}.${i.name}',`)
                        out.line('{')
                        out.indentation(() => {
                            for (let v of i.versions) {
                                let sts = this.getSts(v)
                                let versionName = toCamelCase(sts.name)
                                let type = sts.useCall(pallet.name, i.name)
                                out.line(`${versionName}: ${type},`)
                            }
                        })
                        out.line('}')
                    })
                    out.line('),')
                }
            })
            exports.add('calls')
        }

        let constants = sortItems(pallet.constants)
        if (constants.length > 0) {
            out.line()
            out.block(`export const constants =`, () => {
                for (let i of constants) {
                    out.line(`${i.name}: createConstant(`)
                    out.indentation(() => {
                        out.line(`'${pallet.name}.${i.name}',`)
                        out.line('{')
                        out.indentation(() => {
                            for (let v of i.versions) {
                                let sts = this.getSts(v)
                                let versionName = toCamelCase(sts.name)
                                let type = sts.useConstant(pallet.name, i.name)
                                out.line(`${versionName}: ${type},`)
                            }
                        })
                        out.line('}')
                    })
                    out.line('),')
                }
            })
            exports.add('constants')
        }

        let storage = sortItems(pallet.storage)
        if (storage.length > 0) {
            out.line()
            out.block(`export const storage =`, () => {
                for (let i of storage) {
                    out.line(`${i.name}: createStorage(`)
                    out.indentation(() => {
                        out.line(`'${pallet.name}.${i.name}',`)
                        out.line('{')
                        out.indentation(() => {
                            for (let v of i.versions) {
                                let sts = this.getSts(v)
                                let versionName = toCamelCase(sts.name)
                                let type = sts.useStorage(pallet.name, i.name)
                                out.line(`${versionName}: ${type},`)
                            }
                        })
                        out.line('}')
                    })
                    out.line('),')
                }
            })
        }

        out.line()
        out.line(`export default {${[...exports].join(`, `)}}`)

        out.write()
    }

    private collectPallets() {
        let requested = Array.isArray(this.options.pallets) ? new Set(this.options.pallets) : undefined
        if (requested?.size === 0) return []

        let list = this.runtimes().flatMap((runtime) =>
            Object.keys(runtime.description.pallets)
                .filter((name) => requested?.has(name) ?? true)
                .map((name) => ({name, runtime}))
        )

        let pallets = groupBy(list, (i) => i.name)
        requested?.forEach((name) => {
            if (!pallets.has(name)) {
                throw new Error(`${name} is not defined by the chain metadata`)
            }
        })

        let res: Pallet[] = []
        pallets.forEach((versions, name) => {
            let runtimes = versions.map((p) => p.runtime)

            let events = this.collectItems(runtimes, name, 'events', (r, def) =>
                getTypeHash(r.description.types, createScaleType(r.description.types, def))
            )

            let calls = this.collectItems(runtimes, name, 'calls', (r, def) =>
                getTypeHash(r.description.types, createScaleType(r.description.types, def))
            )

            let constants = this.collectItems(runtimes, name, 'constants', (r, def) =>
                getTypeHash(r.description.types, def.type)
            )

            let storage = this.collectItems(runtimes, name, 'storage', (r, def) =>
                JSON.stringify({
                    modifier: def.modifier,
                    key: def.keys.map((ti) => getTypeHash(r.description.types, ti)),
                    value: getTypeHash(r.description.types, def.value),
                })
            )

            res.push({
                name,
                events,
                calls,
                constants,
                storage,
            })
        })

        return res
    }

    private collectItems<K extends 'events' | 'calls' | 'storage' | 'constants', I extends md.Pallet[K][string]>(
        runtimes: Runtime[],
        pallet: string,
        kind: K,
        hash: (runtime: Runtime, def: I) => string
    ) {
        let list = runtimes.flatMap((runtime) =>
            Object.keys(runtime.description.pallets[pallet][kind]).map((name) => ({name, runtime}))
        )
        let items = groupBy(list, (i) => i.name)

        return Array.from(items.entries()).map(([name, versions]) => {
            let uniques: Runtime[] = []

            versions.forEach((v) => {
                let prev = maybeLast(uniques)
                if (
                    prev == null ||
                    hash(v.runtime, v.runtime.description.pallets[pallet][kind][name] as any) !==
                        hash(prev, prev.description.pallets[pallet][kind][name] as any)
                ) {
                    uniques.push(v.runtime)
                }
            })

            return {
                name,
                versions: uniques,
            }
        })
    }

    private getSts(runtime: Runtime): Sts {
        let sts = this.sts.get(runtime)
        if (sts) return sts

        let name = this.getVersionName(runtime)
        sts = new Sts(new OutDir(this.dir.path('versions')), name, runtime)
        this.sts.set(runtime, sts)
        return sts
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
        return new Set(this.runtimes().map((v) => v.specName)).size < 2
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

    private runtimeImports(out: Output): Set<Runtime> {
        let set = new Set<Runtime>()
        out.lazy(() => {
            Array.from(set)
                .sort((a, b) => a.specVersion - b.specVersion)
                .forEach((v) => {
                    let sts = this.getSts(v)
                    let versionName = toCamelCase(sts.name)
                    out.line(`import * as ${versionName} from './${versionName}'`)
                })
        })
        return set
    }
}

function sortItems(items: Item[]) {
    return items.sort((a, b) => (a.name > b.name ? 1 : -1))
}

/**
 * Returns true when storage item actually can't hold any value
 */
// function isEmptyStorageItem(item: Item<StorageItem>): boolean {
//     return isEmptyVariant(item.runtime.description.types[item.def.value])
// }

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
