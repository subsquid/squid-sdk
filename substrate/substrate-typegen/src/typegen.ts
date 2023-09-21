import {SpecVersion} from '@subsquid/substrate-metadata-explorer/lib/specVersion'
import {Runtime} from '@subsquid/substrate-runtime'
import type * as md from '@subsquid/substrate-runtime/lib/metadata'
import {def, last} from '@subsquid/util-internal'
import {OutDir, Output} from '@subsquid/util-internal-code-printer'
import {toCamelCase} from '@subsquid/util-naming'
import {PalletRequest} from './config'
import {Sts} from './ifs'
import {groupBy} from './util'

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
    pallets: Record<string, PalletRequest> | boolean
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

        let pallets = this.collectPallets(this.options.pallets)
        for (let pallet of pallets) {
            this.generatePallet(pallet)
        }

        for (let s of this.sts.values()) {
            s.generate()
        }

        this.dir.add('pallet.support.ts', [__dirname, '../src/pallet.support.ts'])
    }

    private generatePallet(pallet: Pallet) {
        let out = this.dir.file(toCamelCase(pallet.name) + '.ts')
        let exports = new Set()

        out.line(`import {createEvent, createCall, createConstant, createStorage, sts} from './pallet.support'`)
        let imports = this.runtimeImports(out)

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
                                imports.add(versionName)
                                let exp = sts.useEvent(pallet.name, i.name)
                                out.line(`${versionName}: ${sts.qualify(exp.value, versionName)},`)
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
                                imports.add(versionName)
                                let exp = sts.useCall(pallet.name, i.name)
                                out.line(`${versionName}: ${sts.qualify(exp.value, versionName)},`)
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
                                imports.add(versionName)
                                let type = sts.useConstant(pallet.name, i.name)
                                out.line(`${versionName}: ${sts.qualify(type, versionName)},`)
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
                                imports.add(versionName)
                                let type = sts.useStorage(pallet.name, i.name)
                                out.line(`${versionName}: ${sts.qualify(type, versionName)},`)
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

    private collectPallets(req: Record<string, PalletRequest> | boolean) {
        let requested = typeof req === 'boolean' ? undefined : new Set(Object.keys(this.options.pallets))
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

            let events = this.collectItems(
                typeof req === 'boolean' || req[name].events,
                runtimes,
                (r) => r.description.pallets[name].events,
                (r, item) => r.getTypeHash(r.createScaleType(item))
            )

            let calls = this.collectItems(
                typeof req === 'boolean' || req[name].calls,
                runtimes,
                (r) => r.description.pallets[name].calls,
                (r, item) => r.getTypeHash(r.createScaleType(item))
            )

            let constants = this.collectItems(
                typeof req === 'boolean' || req[name].constants,
                runtimes,
                (r) => r.description.pallets[name].constants,
                (r, item) => r.getTypeHash(item.type)
            )

            let storage = this.collectItems(
                typeof req === 'boolean' || req[name].storage,
                runtimes,
                (r) => r.description.pallets[name].storage,
                (r, item) =>
                    JSON.stringify({
                        modifier: item.modifier,
                        key: item.keys.map((ti) => r.getTypeHash(ti)),
                        value: r.getTypeHash(item.value),
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

    private collectItems<I>(
        req: string[] | boolean | undefined,
        runtimes: Runtime[],
        extract: (runtime: Runtime) => Record<string, I>,
        hash: (runtime: Runtime, item: I) => string
    ) {
        let requested = typeof req === 'boolean' ? undefined : new Set(req ?? [])
        if (requested?.size === 0) return []

        let list = runtimes.flatMap((runtime) =>
            Object.entries(extract(runtime))
                .filter(([name]) => requested?.has(name) ?? true)
                .map(([name, def]) => ({name, def, runtime}))
        )
        let items = groupBy(list, (i) => i.name)

        return Array.from(items.entries()).map(([name, versions]) => {
            let uniques: Runtime[] = []

            let prevHash: string | undefined
            versions.forEach((v) => {
                let newHash = hash(v.runtime, v.def)
                if (prevHash == null || newHash !== prevHash) {
                    uniques.push(v.runtime)
                    prevHash = newHash
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
        sts = new Sts(new OutDir(this.dir.path('types')), name, runtime)
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

    private runtimeImports(out: Output): Set<string> {
        let set = new Set<string>()
        out.lazy(() => {
            Array.from(set)
                .sort((a, b) => (a > b ? -1 : 1))
                .forEach((v) => {
                    out.line(`import * as ${v} from './types/${v}'`)
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
