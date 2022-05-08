import {
    ChainDescription,
    decodeMetadata,
    getChainDescriptionFromMetadata,
    OldTypesBundle,
    QualifiedName,
    SpecVersion, StorageItem,
    Type
} from "@subsquid/substrate-metadata"
import * as eac from "@subsquid/substrate-metadata/lib/events-and-calls"
import {getTypesFromBundle} from "@subsquid/substrate-metadata/lib/old/typesBundle"
import {getStorageItemTypeHash} from "@subsquid/substrate-metadata/lib/storage"
import {def, OutDir, toCamelCase} from "@subsquid/util"
import assert from "assert"
import {Interfaces} from "./ifs"
import {groupBy, isEmptyVariant, upperCaseFirst} from "./util"


export interface ChainVersion {
    specVersion: SpecVersion
    blockNumber: number
    blockHash: string
    metadata: string
}


export interface TypegenOptions {
    outDir: string
    chainVersions: ChainVersion[]
    typesBundle?: OldTypesBundle
    events?: string[] | boolean
    calls?: string[] | boolean
    storage?: string[] | boolean
}


export class Typegen {
    static generate(options: TypegenOptions): void {
        new Typegen(options).generate()
    }

    private interfaces = new Map<SpecVersion, Interfaces>()
    private dir: OutDir

    constructor(private options: TypegenOptions) {
        this.dir = new OutDir(options.outDir)
    }

    generate(): void {
        this.dir.del()
        this.generateEnums('events')
        this.generateEnums('calls')
        this.generateStorage()
        this.interfaces.forEach((ifs, specVersion) => {
            if (ifs.isEmpty()) return
            let file = this.dir.file(`v${specVersion}.ts`)
            ifs.generate(file)
            file.write()
        })
        this.dir.add('support.ts', [__dirname, '../src/support.ts'])
    }

    private generateEnums(kind: 'events' | 'calls'): void {
        let items = this.collectItems(
            this.options[kind],
            chain => Object.entries(chain[kind].definitions).map(([name, def]) => {
                return {name, def, chain}
            }),
            (chain, name) => chain[kind].getHash(name)
        )

        if (items.size == 0) return

        let out = this.dir.file(`${kind}.ts`)
        let fix = kind == 'events' ? 'Event' : 'Call'
        let ctx = kind == 'events' ? 'event' : 'extrinsic'
        let names = Array.from(items.keys()).sort()
        let importedInterfaces = new Set<SpecVersion>()

        out.line(`import assert from 'assert'`)
        out.line(`import {${fix}Context, Result, deprecateLatest} from './support'`)
        out.lazy(() => Array.from(importedInterfaces).sort().map(v => `import * as v${v} from './v${v}'`))
        names.forEach(name => {
            let versions = items.get(name)!
            let {def: {pallet, name: unqualifiedName}} = versions[0]
            let className = upperCaseFirst(toCamelCase(`${pallet}_${unqualifiedName}`)) + fix
            out.line()
            out.block(`export class ${className}`, () => {
                out.block(`constructor(private ctx: ${fix}Context)`, () => {
                    let camelCased = toCamelCase(pallet) + '.' + toCamelCase(unqualifiedName)
                    if (camelCased == name || ctx == 'event') {
                        out.line(`assert(this.ctx.${ctx}.name === '${name}')`)
                    } else {
                        out.line(`assert(this.ctx.${ctx}.name === '${camelCased}' || this.ctx.${ctx}.name === '${name}')`)
                    }
                })
                versions.forEach((version, idx) => {
                    let isLatest = versions.length === idx + 1
                    let v = version.chain.specVersion
                    let ifs = this.getInterface(v)
                    let unqualifiedTypeExp: string
                    if (version.def.fields[0]?.name == null) {
                        unqualifiedTypeExp = ifs.makeTuple(version.def.fields.map(f => f.type))
                    } else {
                        unqualifiedTypeExp = `{${version.def.fields.map(f => `${f.name}: ${ifs.use(f.type)}`).join(', ')}}`
                    }
                    let typeExp = ifs.qualify('v'+v, unqualifiedTypeExp)
                    if (typeExp != unqualifiedTypeExp) {
                        importedInterfaces.add(v)
                    }
                    out.line()
                    out.blockComment(version.def.docs)
                    out.block(`get isV${v}(): boolean`, () => {
                        let hash = version.chain[kind].getHash(name)
                        out.line(`return this.ctx._chain.get${fix}Hash('${name}') === '${hash}'`)
                    })
                    out.line()
                    out.blockComment(version.def.docs)
                    out.block(`get asV${v}(): ${typeExp}`, () => {
                        out.line(`assert(this.isV${v})`)
                        out.line(`return this.ctx._chain.decode${fix}(this.ctx.${ctx})`)
                    })
                    if (isLatest) {
                        out.line()
                        out.block(`get isLatest(): boolean`, () => {
                            out.line(`deprecateLatest()`)
                            out.line(`return this.isV${v}`)
                        })
                        out.line()
                        out.block(`get asLatest(): ${typeExp}`, () => {
                            out.line(`deprecateLatest()`)
                            out.line(`return this.asV${v}`)
                        })
                    }
                })
            })
        })

        out.write()
    }

    private generateStorage(): void {
        let items = this.collectItems(
            this.options.storage,
            chain => {
                let items: Item<StorageItem>[] = []
                let storage = chain.description.storage
                for (let prefix in storage) {
                    for (let name in storage[prefix]) {
                        items.push({
                            chain,
                            name: prefix + '.' + name,
                            def: storage[prefix][name]
                        })
                    }
                }
                return items
            },
            (chain, name) => {
                let [prefix, itemName] = name.split('.')
                return getStorageItemTypeHash(chain.description.types, chain.description.storage[prefix][itemName])
            }
        )
        if (items.size == 0) return

        let out = this.dir.file('storage.ts')
        let names = Array.from(items.keys()).sort()
        let importedInterfaces = new Set<SpecVersion>()

        out.line(`import assert from 'assert'`)
        out.line(`import {StorageContext, Result} from './support'`)
        out.lazy(() => Array.from(importedInterfaces).sort().map(v => `import * as v${v} from './v${v}'`))
        names.forEach(qualifiedName => {
            let versions = items.get(qualifiedName)!
            let [prefix, name] = qualifiedName.split('.')
            out.line()
            out.block(`export class ${prefix}${name}Storage`, () => {
                out.line(`constructor(private ctx: StorageContext) {}`)
                versions.forEach(v => {
                    let hash = getStorageItemTypeHash(v.chain.description.types, v.def)
                    let ifs = this.getInterface(v.chain.specVersion)
                    let types = v.def.keys.concat(v.def.value).map(ti => ifs.use(ti))
                    let qualifiedTypes = types.map(texp => ifs.qualify(`v${v.chain.specVersion}`, texp))
                    if (qualifiedTypes.some((texp, idx) => texp != types[idx])) {
                        importedInterfaces.add(v.chain.specVersion)
                    }

                    out.line()
                    out.blockComment(v.def.docs)
                    out.block(`get isV${v.chain.specVersion}()`, () => {
                        out.line(`return this.ctx._chain.getStorageItemTypeHash('${prefix}', '${name}') === '${hash}'`)
                    })

                    if (isEmptyVariant(v.chain.description.types[v.def.value])) {
                        // Meaning storage item can't hold any value
                        // Let's just silently omit .get method for this case
                    } else {
                        out.line()
                        out.blockComment(v.def.docs)
                        let returnType = qualifiedTypes[qualifiedTypes.length - 1]
                        if (v.def.modifier == 'Optional') {
                            returnType = `${returnType} | undefined`
                        }
                        let keyTypes = qualifiedTypes.slice(0, qualifiedTypes.length - 1)
                        let keyNames = keyTypes.map((type, idx) => {
                            if (qualifiedTypes.length == 2) {
                                return `key`
                            } else {
                                return `key${idx + 1}`
                            }
                        })
                        let params = keyNames.map((k, idx) => `${k}: ${keyTypes[idx]}`)
                        let args = ['this.ctx.block.hash', `'${prefix}'`, `'${name}'`]
                        out.block(`async getAsV${v.chain.specVersion}(${params.join(', ')}): Promise<${returnType}>`, () => {
                            out.line(`assert(this.isV${v.chain.specVersion})`)
                            out.line(`return this.ctx._chain.getStorage(${args.concat(keyNames).join(', ')})`)
                        })
                        if (keyNames.length > 0) {
                            out.line()
                            out.block(`async queryAsV${v.chain.specVersion}(keys: ${keyTypes.length > 1 ? `[${params.join(', ')}]` : keyTypes[0]}[]): Promise<${returnType}[]>`, () => {
                                out.line(`assert(this.isV${v.chain.specVersion})`)
                                out.line(`return this.ctx._chain.queryStorage(${args.concat(`keys`).join(', ')})`)
                            })
                        }
                    }
                })
                out.line()
                out.blockComment([
                    'Checks whether the storage item is defined for the current chain version.'
                ])
                out.block(`get isExists(): boolean`, () => {
                    out.line(`return this.ctx._chain.getStorageItemTypeHash('${prefix}', '${name}') != null`)
                })
            })
        })

        out.write()
    }

    /**
     * Create a mapping between qualified name and list of unique versions
     */
    private collectItems<T>(
        req: string[] | boolean | undefined,
        extract: (chain: VersionDescription) => Item<T>[],
        hash: (chain: VersionDescription, name: QualifiedName) => string
    ): Map<QualifiedName, Item<T>[]> {
        if (!req) return new Map()
        let requested = Array.isArray(req) ? new Set(req) : undefined
        if (requested?.size === 0) return new Map()

        let list = this.chain().flatMap(chain => extract(chain))
        let items = groupBy(list, i => i.name)

        requested?.forEach(name => {
            if (!items.has(name)) {
                throw new Error(`${name} is not defined by the chain metadata`)
            }
        })

        items.forEach((versions, name) => {
            if (requested == null || requested.has(name)) {
                versions.sort((a, b) => a.chain.blockNumber - b.chain.blockNumber)
                let unique: Item<T>[] = []
                versions.forEach(v => {
                    let prev = unique.length ? unique[unique.length - 1] : undefined
                    if (prev && hash(v.chain, name) === hash(prev.chain, name)) {
                        // TODO: use the latest definition, but set specVersion and blockNumber of a previous one
                        // for hopefully better docs
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

    @def
    chain(): VersionDescription[] {
        return this.options.chainVersions.map(v => {
            let metadata = decodeMetadata(v.metadata)
            let oldTypes = this.options.typesBundle && getTypesFromBundle(this.options.typesBundle, v.specVersion)
            let d = getChainDescriptionFromMetadata(metadata, oldTypes)
            return {
                specVersion: v.specVersion,
                blockNumber: v.blockNumber,
                types: d.types,
                events: new eac.Registry(d.types, d.event),
                calls: new eac.Registry(d.types, d.call),
                description: d
            }
        }).sort((a, b) => a.blockNumber - b.blockNumber)
    }

    getInterface(specVersion: SpecVersion): Interfaces {
        let ifs = this.interfaces.get(specVersion)
        if (ifs) return ifs
        let d = this.chain().find(v => v.specVersion == specVersion)
        assert(d != null)
        ifs = new Interfaces(d.description)
        this.interfaces.set(specVersion, ifs)
        return ifs
    }
}


interface VersionDescription {
    specVersion: SpecVersion
    blockNumber: number
    types: Type[]
    events: eac.Registry
    calls: eac.Registry
    description: ChainDescription
}


interface Item<T> {
    name: QualifiedName
    def: T
    chain: VersionDescription
}
