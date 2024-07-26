import {SpecVersion} from '@subsquid/substrate-metadata-explorer/lib/specVersion'
import {QualifiedName, Runtime} from '@subsquid/substrate-runtime'
import {Constant, OldSpecsBundle, OldTypesBundle, StorageItem} from '@subsquid/substrate-runtime/lib/metadata'
import {EACDefinition} from '@subsquid/substrate-runtime/lib/runtime/events-and-calls'
import {getTypeHash} from '@subsquid/substrate-runtime/lib/sts'
import {assertNotNull, def, last, maybeLast, unexpectedCase} from '@subsquid/util-internal'
import {FileOutput, OutDir} from '@subsquid/util-internal-code-printer'
import {toCamelCase, toSnakeCase} from '@subsquid/util-naming'
import {Sink, Sts} from './ifs'
import {assignNames} from './names'
import {groupBy, isEmptyVariant, splitQualifiedName, toJsName, upperCaseFirst} from './util'


type Exp = string


interface Item<T> {
    name: QualifiedName
    def: T
    runtime: Runtime
}


export interface TypegenOptions extends ItemSelection {
    outDir: string
    specVersions: SpecVersion[]
    typesBundle?: OldTypesBundle | OldSpecsBundle
    pallets?: {
        [name: string]: ItemSelection | boolean
    }
}


export interface ItemSelection {
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
    private palletModules = new Map<string, Set<string>>

    public readonly dir: OutDir

    private constructor(private options: TypegenOptions) {
        this.dir = new OutDir(options.outDir)
    }

    private generate(): void {
        this.dir.del()
        this.generateEnums('events')
        this.generateEnums('calls')
        this.generateStorage()
        this.generateConsts()
        this.generatePalletModules()

        let index = this.dir.file('index.ts')

        this.sts.forEach((sts, runtime) => {
            if (sts.sink.isEmpty()) return
            let version = this.getVersionName(runtime)
            let file = this.dir.file(version + '.ts')
            file.line(`import {sts, Result, Option, Bytes, BitSequence} from './support'`)
            sts.sink.generate(file)
            file.write()
            index.line(`export * as ${version} from './${version}'`)
        })

        for (let [kind, items] of [
            ['events', this.events()],
            ['calls', this.calls()],
            ['constants', this.constants()],
            ['storage', this.storageItems()]
        ] as [string, Item<unknown>[]][]) {
            if (items.length == 0) continue
            index.line(`export * as ${kind} from './${kind}'`)
            let file = this.dir.file(kind + '.ts')
            for (let pallet of groupBy(items, it => it.name.split('.')[0]).keys()) {
                file.line(`export * as ${toJsName(pallet)} from './${getPalletDir(pallet)}/${kind}'`)
            }
            file.write()
        }

        index.write()

        this.dir.add('support.ts', [__dirname, '../src/support.ts'])
    }

    private generateEnums(kind: 'events' | 'calls'): void {
        const fix = kind == 'events' ? 'Event' : 'Call'

        let items = this[kind]()

        for (let [pallet, palletItems] of groupBy(items, it => it.def.pallet)) {
            let file = new ItemFile(this, pallet, fix)
            let out = file.out

            this.getPalletModule(pallet).add(file.name)

            for (let [name, versions] of groupBy(palletItems, it => it.def.name)) {
                out.line()
                out.line(`export const ${toJsName(name)} = ${fix.toLowerCase()}_('${pallet}.${name}', {`)
                out.indentation(() => {
                    for (let it of versions) {
                        let useSts = file.useSts(it.runtime)

                        out.blockComment(it.def.docs)
                        let versionName = this.getVersionName(it.runtime)
                        if (it.def.fields.length == 0 || it.def.fields[0].name == null) {
                            if (it.def.fields.length == 1) {
                                out.line(`${versionName}: ${useSts(it.def.fields[0].type)},` )
                            } else {
                                let list = it.def.fields.map(f => useSts(f.type)).join(', ')
                                if (list) {
                                    out.line(`${versionName}: sts.tuple([${list}]),`)
                                } else {
                                    out.line(`${versionName}: sts.unit(),`)
                                }
                            }
                        } else {
                            out.line(`${versionName}: sts.struct({`)
                            out.indentation(() => {
                                for (let f of it.def.fields) {
                                    out.blockComment(f.docs)
                                    out.line(`${f.name}: ${useSts(f.type)},`)
                                }
                            })
                            out.line('}),')
                        }
                    }
                })
                out.line('})')
            }

            file.write()
        }
    }

    private generateConsts(): void {
        let items = this.constants()

        for (let [pallet, palletItems] of groupBy(items, it => splitQualifiedName(it.name)[0])) {
            let file = new ItemFile(this, pallet, 'Constant')
            let out = file.out

            this.getPalletModule(pallet).add(file.name)

            for (let [name, versions] of groupBy(palletItems, it => splitQualifiedName(it.name)[1])) {
                out.line()
                out.line(`export const ${toJsName(name)} = constant_('${pallet}.${name}', {`)
                out.indentation(() => {
                    for (let it of versions) {
                        let useSts = file.useSts(it.runtime)

                        out.blockComment(it.def.docs)
                        out.line(`${this.getVersionName(it.runtime)}: ${useSts(it.def.type)},`)
                    }
                })
                out.line(`})`)
            }

            file.write()
        }
    }

    private generateStorage(): void {
        let items = this.storageItems()

        for (let [pallet, palletItems] of groupBy(items, it => splitQualifiedName(it.name)[0])) {
            let file = new ItemFile(this, pallet, 'Storage')
            let out = file.out

            this.getPalletModule(pallet).add(file.name)

            for (let [name, versions] of groupBy(palletItems, it => toJsName(splitQualifiedName(it.name)[1]))) {
                let jsName = toJsName(name)

                let ifs: (() => void)[] = []

                out.line()
                out.line(`export const ${jsName} = storage_('${pallet}.${name}', {`)
                out.indentation(() => {
                    for (let it of versions) {
                        let ifName = upperCaseFirst(
                            toCamelCase(`${jsName}_${this.getVersionName(it.runtime)}`)
                        )

                        let useSts = file.useSts(it.runtime)
                        let useIfs = file.useIfs(it.runtime)

                        let keyListExp = it.def.keys.map(ti => useSts(ti)).join(', ')
                        let valueExp = useSts(it.def.value)

                        out.blockComment(it.def.docs)
                        out.line(
                            `${this.getVersionName(it.runtime)}: {` +
                            `key: [${keyListExp}], ` +
                            `value: ${valueExp}, ` +
                            `modifier: '${it.def.modifier}', ` +
                            `isKeyDecodable: ${isStorageKeyDecodable(it.def)}` +
                            `} as const,`
                        )

                        ifs.push(() => {
                            let value = useIfs(it.def.value)
                            
                            let keys = it.def.keys.map(ti => useIfs(ti))
                            let args = keys.length == 1
                                ? [`key: ${keys[0]}`]
                                : keys.map((exp, idx) => `key${idx+1}: ${exp}`)

                            out.line()
                            out.blockComment(it.def.docs)
                            out.line(`export type ${ifName} = GetStorageType<[${args.join(`, `)}], ${value}, '${it.def.modifier}', ${isStorageKeyDecodable(it.def)}>`)
                        })
                    }
                })
                out.line('})')

                for (let i of ifs) {
                    i()
                }
            }

            file.write()
        }
    }

    private generatePalletModules() {
        for (let [pallet, modules] of this.palletModules) {
            let out = this.dir.child(getPalletDir(pallet)).file('index.ts')

            for (let module of modules) {
                let moduleName = module.slice(0, module.length - 3) // remove '.ts'
                out.line(`export * as ${moduleName} from './${moduleName}'`)
            }

            out.write()
        }
    }

    @def
    private events(): Item<EACDefinition>[] {
        return this.collectItems(
            toItemRequest(this.options, 'events'),
            runtime => Object.entries(runtime.events.definitions).map(([name, def]) => {
                return {name, def, runtime}
            }),
            item => item.runtime.events.getTypeHash(item.name)
        )
    }

    @def
    private calls(): Item<EACDefinition>[] {
        return this.collectItems(
            toItemRequest(this.options, 'calls'),
            runtime => Object.entries(runtime.calls.definitions).map(([name, def]) => {
                return {name, def, runtime}
            }),
            item => item.runtime.calls.getTypeHash(item.name)
        )
    }

    @def
    private storageItems(): Item<StorageItem & {prefix: string}>[] {
        return this.collectItems(
            toItemRequest(this.options, 'storage'),
            runtime => {
                let storage = runtime.description.storage
                return getStorageItems(runtime).map(({pallet, prefix, name}) => {
                    let def = assertNotNull(storage[pallet]?.items[name])
                    return {
                        runtime,
                        name: pallet + '.' + name,
                        def: {...def, prefix}
                    }
                })
            },
            item => {
                return JSON.stringify({
                    modifier: item.def.modifier,
                    key: item.def.keys.map(ti => getTypeHash(item.runtime.description.types, ti)),
                    value: getTypeHash(item.runtime.description.types, item.def.value)
                })
            }
        ).filter(
            it => !isEmptyStorageItem(it)
        )
    }

    @def
    private constants(): Item<Constant>[] {
        return this.collectItems(
            toItemRequest(this.options, 'constants'),
            runtime => {
                let items: Item<Constant>[] = []
                let consts = runtime.description.constants
                for (let prefix in consts) {
                    for (let name in consts[prefix]) {
                        items.push({
                            runtime,
                            name: prefix + '.' + name,
                            def: consts[prefix][name]
                        })
                    }
                }
                return items
            },
            item => {
                let [prefix, name] = item.name.split('.')
                let def = item.runtime.description.constants[prefix][name]
                return getTypeHash(item.runtime.description.types, def.type)
            }
        )
    }

    private collectItems<T>(
        req: ItemRequest,
        extract: (runtime: Runtime) => Item<T>[],
        hash: (item: Item<T>) => string
    ): Item<T>[] {
        let list = this.runtimes().flatMap(chain => extract(chain))

        let byName = groupBy(list, i => i.name)

        if (req !== true) {
            for (let qn of byName.keys()) {
                let [pallet, name] = splitQualifiedName(qn)
                let pr = req[pallet]
                if (!pr || Array.isArray(pr) && !pr.includes(name)) {
                    byName.delete(qn)
                }
            }
        }

        let items: Item<T>[] = []

        byName.forEach(versions => {
            let unique: Item<T>[] = []
            versions.forEach(v => {
                let prev = maybeLast(unique)
                if (prev && hash(prev) === hash(v)) {
                } else {
                    unique.push(v)
                }
            })
            items.push(...unique)
        })

        return items
    }

    getVersionName(runtime: Runtime): string {
        if (this.specNameNotChanged() || last(this.runtimes()).specName == runtime.specName) {
            return `v${runtime.specVersion}`
        } else {
            return toCamelCase(`${runtime.specName}-v${runtime.specVersion}`)
        }
    }

    @def
    private specNameNotChanged(): boolean {
        return new Set(this.runtimes().map(v => v.specName)).size < 2
    }

    @def
    private runtimes(): Runtime[] {
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

    getPalletModule(pallet: string) {
        let module = this.palletModules.get(pallet)
        if (module == null) {
            module = new Set()
            this.palletModules.set(pallet, module)
        }
        return module
    }
}


class ItemFile {
    private imported = new Set<Runtime>()
    readonly out: FileOutput
    readonly name: string

    constructor(
        private typegen: Typegen,
        pallet: string,
        type: 'Event' | 'Call' | 'Constant' | 'Storage'
    ) {
        this.name = type == 'Storage' ? 'storage.ts' : type.toLowerCase() + 's.ts'
        this.out = this.typegen.dir
            .child(getPalletDir(pallet))
            .file(this.name)

        let imports = ['sts', 'Block', 'Bytes', 'Option', 'Result', `${type}Type`, `${type.toLowerCase()} as ${type.toLowerCase()}_`, 'RuntimeCtx' ]
        if (type === 'Storage') {
            imports.push('GetStorageType')
        }

        this.out.line(`import {${imports.join(', ')}} from '../support'`)

        this.out.lazy(() => {
            Array.from(this.imported)
                .sort((a, b) => a.specVersion - b.specVersion)
                .forEach(runtime => {
                    let name = this.typegen.getVersionName(runtime)
                    this.out.line(`import * as ${name} from '../${name}'`)
                })
        })
    }

    useSts(runtime: Runtime): (ti: number) => Exp {
        let sts = this.typegen.getSts(runtime)
        return ti => {
            let exp = sts.use(ti)
            return this.qualify(runtime, exp)
        }
    }

    useIfs(runtime: Runtime): (ti: number) => Exp {
        let sts = this.typegen.getSts(runtime)
        return ti => {
            let exp = sts.ifs.use(ti)
            return this.qualify(runtime, exp)
        }
    }

    private qualify(runtime: Runtime, exp: Exp): Exp {
        let version = this.typegen.getVersionName(runtime)
        let qualified = this.typegen.getSts(runtime).sink.qualify(version, exp)
        if (qualified != exp) {
            this.imported.add(runtime)
        }
        return qualified
    }

    write(): void {
        this.out.write()
    }
}


function getStorageItems(runtime: Runtime): {pallet: string, prefix: string, name: string}[] {
    let metadata = runtime.metadata
    switch(metadata.__kind) {
        case 'V9':
        case 'V10':
        case 'V11':
        case 'V12':
        case 'V13':
            return metadata.value
                .modules
                .flatMap(m => {
                    if (!m.storage) return []
                    let prefix = m.storage.prefix
                    return m.storage.items.map(it => {
                        return {prefix, pallet: m.name, name: it.name}
                    })
                })
        case 'V14':
            return metadata.value
                .pallets
                .flatMap(m => {
                    if (!m.storage) return []
                    let prefix = m.storage.prefix
                    return m.storage.items.map(it => {
                        return {prefix, pallet: m.name, name: it.name}
                    })
                })
        default:
            throw unexpectedCase(metadata.__kind)
    }
}


function getPalletDir(pallet: string): string {
    return toSnakeCase(pallet).replace(/_/g, '-')
}


/**
 * Returns true when storage item actually can't hold any value
 */
function isEmptyStorageItem(item: Item<StorageItem>): boolean {
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


type ItemRequest = true | {
    [pallet: string]: true | string[]
}


function toItemRequest(options: TypegenOptions, kind: keyof ItemSelection): ItemRequest {
    let list = options[kind]
    if (list === true) return true

    let req: {
        [pallet: string]: true | string[]
    } = {}

    if (options.pallets) {
        for (let pallet in options.pallets) {
            let pr = options.pallets[pallet]
            if (pr === true) {
                req[pallet] = true
            } else if (pr) {
                let ir = pr[kind]
                if (ir === true) {
                    req[pallet] = true
                } else if (ir) {
                    req[pallet] = ir.slice()
                }
            }
        }
    }

    if (list) {
        for (let qualifiedName of list) {
            let [pallet, name] = splitQualifiedName(qualifiedName)
            let selected = req[pallet]
            if (selected === true) continue
            if (Array.isArray(selected)) {
                selected.push(name)
            } else {
                req[pallet] = [name]
            }
        }
    }

    return req
}
