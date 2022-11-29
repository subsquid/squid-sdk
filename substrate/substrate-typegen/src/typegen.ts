import {
    ChainDescription,
    Constant,
    decodeMetadata,
    getChainDescriptionFromMetadata,
    getOldTypesBundle,
    getTypeHash,
    isPreV14,
    OldSpecsBundle,
    OldTypes,
    OldTypesBundle,
    QualifiedName,
    StorageItem,
    Type
} from "@subsquid/substrate-metadata"
import {SpecVersion} from "@subsquid/substrate-metadata-explorer/lib/specVersion"
import * as eac from "@subsquid/substrate-metadata/lib/events-and-calls"
import {getTypesFromBundle} from "@subsquid/substrate-metadata/lib/old/typesBundle"
import {getStorageItemTypeHash} from "@subsquid/substrate-metadata/lib/storage"
import {assertNotNull, def, last, maybeLast} from "@subsquid/util-internal"
import {OutDir, Output} from "@subsquid/util-internal-code-printer"
import {toCamelCase} from "@subsquid/util-naming"
import {Interfaces} from "./ifs"
import {assignNames} from "./names"
import {groupBy, isEmptyVariant, upperCaseFirst} from "./util"


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

    private interfaces = new Map<VersionDescription, Interfaces>()
    private dir: OutDir

    constructor(private options: TypegenOptions) {
        this.dir = new OutDir(options.outDir)
    }

    generate(): void {
        this.dir.del()
        this.generateEnums('events')
        this.generateEnums('calls')
        this.generateStorage()
        this.generateConsts()
        this.interfaces.forEach((ifs, v) => {
            if (ifs.isEmpty()) return
            let fileName = toCamelCase(this.getVersionName(v)) + '.ts'
            let file = this.dir.file(fileName)
            file.line(`import type {Result, Option} from './support'`)
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
        let ctx = kind == 'events' ? 'event' : 'call'
        let names = Array.from(items.keys()).sort()

        out.line(`import assert from 'assert'`)
        out.line(`import {Chain, ChainContext, ${fix}Context, ${fix}, Result, Option} from './support'`)
        let importedInterfaces = this.importInterfaces(out)
        names.forEach(name => {
            let versions = items.get(name)!
            let {def: {pallet, name: unqualifiedName}} = versions[0]
            let className = upperCaseFirst(toCamelCase(`${pallet}_${unqualifiedName}`)) + fix
            out.line()
            out.block(`export class ${className}`, () => {
                out.line(`private readonly _chain: Chain`)
                out.line(`private readonly ${ctx}: ${fix}`)
                out.line()
                out.line(`constructor(ctx: ${fix}Context)`)
                out.line(`constructor(ctx: ChainContext, ${ctx}: ${fix})`)
                out.block(`constructor(ctx: ${fix}Context, ${ctx}?: ${fix})`, () => {
                    out.line(`${ctx} = ${ctx} || ctx.${ctx}`)
                    out.line(`assert(${ctx}.name === '${name}')`)
                    out.line(`this._chain = ctx._chain`)
                    out.line(`this.${ctx} = ${ctx}`)
                })
                versions.forEach(v => {
                    let versionName = this.getVersionName(v.chain)
                    let ifs = this.getInterface(v.chain)
                    let unqualifiedTypeExp: string
                    if (v.def.fields[0]?.name == null) {
                        unqualifiedTypeExp = ifs.makeTuple(v.def.fields.map(f => f.type))
                    } else {
                        unqualifiedTypeExp = `{${v.def.fields.map(f => `${f.name}: ${ifs.use(f.type)}`).join(', ')}}`
                    }
                    let typeExp = this.qualify(importedInterfaces, v.chain, unqualifiedTypeExp)
                    out.line()
                    out.blockComment(v.def.docs)
                    out.block(`get is${versionName}(): boolean`, () => {
                        let hash = v.chain[kind].getHash(name)
                        out.line(`return this._chain.get${fix}Hash('${name}') === '${hash}'`)
                    })
                    out.line()
                    out.blockComment(v.def.docs)
                    out.block(`get as${versionName}(): ${typeExp}`, () => {
                        out.line(`assert(this.is${versionName})`)
                        out.line(`return this._chain.decode${fix}(this.${ctx})`)
                    })
                })
            })
        })

        out.write()
    }

    private generateConsts(): void {
        let items = this.collectItems(
            this.options.constants,
            chain => {
                let items: Item<Constant>[] = []
                let consts = chain.description.constants
                for (let prefix in consts) {
                    for (let name in consts[prefix]) {
                        items.push({
                            chain,
                            name: prefix + '.' + name,
                            def: consts[prefix][name]
                        })
                    }
                }
                return items
            },
            (chain, name) => {
                let [prefix, itemName] = name.split('.')
                let def = chain.description.constants[prefix][itemName]
                return getTypeHash(chain.description.types, def.type)
            }
        )

        if (items.size == 0) return

        let out = this.dir.file(`constants.ts`)
        let names = Array.from(items.keys()).sort()

        out.line(`import assert from 'assert'`)
        out.line(`import {Block, Chain, ChainContext, BlockContext, Result, Option} from './support'`)
        let importedInterfaces = this.importInterfaces(out)
        names.forEach(qualifiedName => {
            let versions = items.get(qualifiedName)!
            let [pallet, name] = qualifiedName.split('.')
            out.line()
            out.block(`export class ${pallet}${name}Constant`, () => {
                out.line(`private readonly _chain: Chain`)
                out.line()
                out.block(`constructor(ctx: ChainContext)`, () => {
                    out.line(`this._chain = ctx._chain`)
                })
                versions.forEach(v => {
                    let versionName = this.getVersionName(v.chain)
                    let hash = getTypeHash(v.chain.description.types, v.def.type)
                    let ifs = this.getInterface(v.chain)
                    let type = ifs.use(v.def.type)
                    let qualifiedType = this.qualify(importedInterfaces, v.chain, type)

                    out.line()
                    out.blockComment(v.def.docs)
                    out.block(`get is${versionName}()`, () => {
                        out.line(`return this._chain.getConstantTypeHash('${pallet}', '${name}') === '${hash}'`)
                    })

                    out.line()
                    out.blockComment(v.def.docs)
                    out.block(`get as${versionName}(): ${qualifiedType}`, () => {
                        out.line(`assert(this.is${versionName})`)
                        out.line(`return this._chain.getConstant('${pallet}', '${name}')`)
                    })
                })
                out.line()
                out.blockComment([
                    'Checks whether the constant is defined for the current chain version.'
                ])
                out.block(`get isExists(): boolean`, () => {
                    out.line(`return this._chain.getConstantTypeHash('${pallet}', '${name}') != null`)
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

        out.line(`import assert from 'assert'`)
        out.line(`import {Block, Chain, ChainContext, BlockContext, Result, Option} from './support'`)
        let importedInterfaces = this.importInterfaces(out)
        names.forEach(qualifiedName => {
            let versions = items.get(qualifiedName)!
            let [prefix, name] = qualifiedName.split('.')
            out.line()
            out.block(`export class ${prefix}${name}Storage`, () => {
                out.line(`private readonly _chain: Chain`)
                out.line(`private readonly blockHash: string`)
                out.line()
                out.line(`constructor(ctx: BlockContext)`)
                out.line(`constructor(ctx: ChainContext, block: Block)`)
                out.block(`constructor(ctx: BlockContext, block?: Block)`, () => {
                    out.line(`block = block || ctx.block`)
                    out.line(`this.blockHash = block.hash`)
                    out.line(`this._chain = ctx._chain`)
                })
                versions.forEach(v => {
                    let versionName = this.getVersionName(v.chain)
                    let hash = getStorageItemTypeHash(v.chain.description.types, v.def)
                    let ifs = this.getInterface(v.chain)
                    let types = v.def.keys.concat(v.def.value).map(ti => ifs.use(ti))
                    let qualifiedTypes = types.map(texp => this.qualify(importedInterfaces, v.chain, texp))

                    out.line()
                    out.blockComment(v.def.docs)
                    out.block(`get is${versionName}()`, () => {
                        out.line(`return this._chain.getStorageItemTypeHash('${prefix}', '${name}') === '${hash}'`)
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

                        let args = ['this.blockHash', `'${prefix}'`, `'${name}'`]
                        out.block(`async getAs${versionName}(${keyNames.map((k, idx) => `${k}: ${keyTypes[idx]}`).join(', ')}): Promise<${returnType}>`, () => {
                            out.line(`assert(this.is${versionName})`)
                            out.line(`return this._chain.getStorage(${args.concat(keyNames).join(', ')})`)
                        })
                        if (keyNames.length > 0) {
                            out.line()
                            out.block(`async getManyAs${versionName}(keys: ${keyNames.length > 1 ? `[${keyTypes.join(', ')}]` : keyTypes[0]}[]): Promise<(${returnType})[]>`, () => {
                                out.line(`assert(this.is${versionName})`)
                                let query = keyNames.length > 1 ? 'keys' : 'keys.map(k => [k])'
                                out.line(`return this._chain.queryStorage(${args.concat(query).join(', ')})`)
                            })
                            out.line()
                            out.block(`async getAllAs${versionName}(): Promise<(${qualifiedTypes[qualifiedTypes.length - 1]})[]>`, () => {
                                out.line(`assert(this.is${versionName})`)
                                out.line(`return this._chain.queryStorage(${args.join(', ')})`)
                            })
                        }
                    }
                })
                out.line()
                out.blockComment([
                    'Checks whether the storage item is defined for the current chain version.'
                ])
                out.block(`get isExists(): boolean`, () => {
                    out.line(`return this._chain.getStorageItemTypeHash('${prefix}', '${name}') != null`)
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
                let unique: Item<T>[] = []
                versions.forEach(v => {
                    let prev = maybeLast(unique)
                    if (prev && hash(v.chain, name) === hash(prev.chain, name)) {
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

    private getVersionName(v: VersionDescription): string {
        if (this.specNameNotChanged() || last(this.chain()).specName == v.specName) {
            return `V${v.specVersion}`
        } else {
            let isName = toCamelCase(`is-${v.specName}-v${v.specVersion}`)
            return isName.slice(2)
        }
    }

    @def
    private specNameNotChanged(): boolean {
        return new Set(this.chain().map(v => v.specName)).size < 2
    }

    @def
    chain(): VersionDescription[] {
        return this.options.specVersions.map(v => {
            let metadata = decodeMetadata(v.metadata)
            let oldTypes: OldTypes | undefined
            if (isPreV14(metadata)) {
                let typesBundle = assertNotNull(
                    this.options.typesBundle || getOldTypesBundle(v.specName),
                    `types bundle is required for ${v.specName} chain`
                )
                oldTypes = getTypesFromBundle(typesBundle, v.specVersion, v.specName)
            }
            let d = getChainDescriptionFromMetadata(metadata, oldTypes)
            return {
                specName: v.specName,
                specVersion: v.specVersion,
                blockNumber: v.blockNumber,
                types: d.types,
                events: new eac.Registry(d.types, d.event),
                calls: new eac.Registry(d.types, d.call),
                description: d
            }
        })
    }

    getInterface(version: VersionDescription): Interfaces {
        let ifs = this.interfaces.get(version)
        if (ifs) return ifs
        ifs = new Interfaces(version.description.types, assignNames(version.description))
        this.interfaces.set(version, ifs)
        return ifs
    }

    private importInterfaces(out: Output): Set<VersionDescription> {
        let set = new Set<VersionDescription>()
        out.lazy(() => {
            Array.from(set).sort((a, b) => a.blockNumber - b.blockNumber).forEach(v => {
                let name = toCamelCase(this.getVersionName(v))
                out.line(`import * as ${name} from './${name}'`)
            })
        })
        return set
    }

    private qualify(importedInterfaces: Set<VersionDescription>, v: VersionDescription, texp: string): string {
        let ifs = this.getInterface(v)
        let prefix = toCamelCase(this.getVersionName(v))
        let qualified = ifs.qualify(prefix, texp)
        if (qualified != texp) {
            importedInterfaces.add(v)
        }
        return qualified
    }
}


interface VersionDescription {
    specName: string
    specVersion: number
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

