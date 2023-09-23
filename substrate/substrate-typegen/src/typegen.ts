import {SpecVersion} from '@subsquid/substrate-metadata-explorer/lib/specVersion'
import {Runtime} from '@subsquid/substrate-runtime'
import type * as md from '@subsquid/substrate-runtime/lib/metadata'
import {def, last} from '@subsquid/util-internal'
import {OutDir, Output} from '@subsquid/util-internal-code-printer'
import {toCamelCase} from '@subsquid/util-naming'
import {PalletRequest} from './config'
import {RuntimeSts} from './ifs'
import {groupBy} from './util'
import {ItemKind, getItemName} from './items'

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

    private sts = new Map<Runtime, RuntimeSts>()
    private dir: OutDir

    constructor(private options: TypegenOptions) {
        this.dir = new OutDir(options.outDir)
    }

    generate(): void {
        this.dir.del()

        this.generatePallets()
        this.generateTypes()

        this.dir.add('pallet.support.ts', [__dirname, '../src/pallet.support.ts'])
    }

    private generatePallets() {
        let pallets = this.collectPallets(this.options.pallets)
        for (let pallet of pallets) {
            let out = this.dir.file(toCamelCase(pallet.name) + '.ts')
            let exports = new Set()

            out.line(
                `import {VersionedEvent, VersionedCall, VersionedConstant, VersionedStorage, sts} from './pallet.support'`
            )
            let imports = this.runtimeImports(out)

            const generateItems = (kind: ItemKind) => {
                let items = sortItems(pallet[kind])
                if (items.length === 0) return

                out.line()
                out.block(`export const ${kind} =`, () => {
                    for (let i of items) {
                        out.line(`${i.name}: Versioned${getItemName(kind)}(`)
                        out.indentation(() => {
                            out.line(`'${pallet.name}.${i.name}',`)
                            out.line('{')
                            out.indentation(() => {
                                for (let v of i.versions) {
                                    let sts = this.getSts(v)
                                    let versionName = this.getVersionName(v)
                                    imports.add(versionName)
                                    let exp = sts.useItem(pallet.name, i.name, kind)
                                    out.line(`${versionName}: ${sts.qualify(exp.value, versionName)},`)
                                }
                            })
                            out.line('}')
                        })
                        out.line('),')
                    }
                })
                exports.add(kind)
            }

            generateItems(ItemKind.Event)
            generateItems(ItemKind.Call)
            generateItems(ItemKind.Constant)
            // generateItems(ItemKind.Storage)

            out.line()
            out.line(`export default {${[...exports].join(`, `)}}`)

            out.write()
        }
    }

    private generateTypes() {
        for (let [runtime, sts] of this.sts) {
            let modules = new Set()

            let versionName = this.getVersionName(runtime)
            let basePath = `types/${versionName}`

            for (let [pallet, sink] of sts.palletSinks) {
                if (sink.isEmpty()) continue

                let out = this.dir.file(`${basePath}/${pallet}.ts`)
                let imports = new Set<string>()

                out.line(`import {sts} from '../../pallet.support'`)
                out.lazy(() => {
                    if (imports.size > 0) {
                        out.line(`import {${[...imports].join(', ')}} from './types'`)
                    }
                })
                sink.generate(out, imports)
                out.write()

                modules.add(pallet)
            }

            if (!sts.sink.isEmpty()) {
                let out = this.dir.file(`${basePath}/types.ts`)

                out.line(`import {sts, Result, Option, Bytes} from '../../pallet.support'`)
                sts.sink.generate(out)
                out.write()

                modules.add('types')
            }

            if (modules.size > 0) {
                let out = this.dir.file(`${basePath}/index.ts`)

                for (let module of modules) {
                    out.line(`export * from './${module}'`)
                }

                out.write()
            }
        }
    }

    private collectPallets(req: Record<string, PalletRequest | boolean> | boolean) {
        if (!req) return []

        let requested = req === true ? undefined : new Set(Object.keys(req))
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
                req === true || getItemsRequest(req[name], ItemKind.Event),
                runtimes,
                (r) => r.description.pallets[name].events,
                (r, item) => r.getTypeHash(r.createScaleType(item))
            )

            let calls = this.collectItems(
                req === true || getItemsRequest(req[name], ItemKind.Call),
                runtimes,
                (r) => r.description.pallets[name].calls,
                (r, item) => r.getTypeHash(r.createScaleType(item))
            )

            let constants = this.collectItems(
                req === true || getItemsRequest(req[name], ItemKind.Constant),
                runtimes,
                (r) => r.description.pallets[name].constants,
                (r, item) => r.getTypeHash(item.type)
            )

            let storage = this.collectItems(
                req === true || getItemsRequest(req[name], ItemKind.Storage),
                runtimes,
                (r) => r.description.pallets[name].storage,
                (r, item) =>
                    JSON.stringify({
                        key: item.keys.map((ti) => r.getTypeHash(ti)),
                        value: r.getTypeHash(item.value),
                        modifier: item.modifier,
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
        if (!req) return []

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

    private getSts(runtime: Runtime): RuntimeSts {
        let sts = this.sts.get(runtime)
        if (sts) return sts

        sts = new RuntimeSts(runtime.description)
        this.sts.set(runtime, sts)
        return sts
    }

    private getVersionName(runtime: Runtime): string {
        if (this.specNameNotChanged() || last(this.runtimes()).specName == runtime.specName) {
            return toCamelCase(`V${runtime.specVersion}`)
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

function getItemsRequest(req: PalletRequest | boolean, kind: ItemKind) {
    return typeof req === 'boolean' ? req : req[kind]
}

/**
 * Returns true when storage item actually can't hold any value
 */
// function isEmptyStorageItem(item: Item<StorageItem>): boolean {
//     return isEmptyVariant(item.runtime.description.types[item.def.value])
// }

// function isStorageKeyDecodable(item: md.StorageItem): boolean {
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
