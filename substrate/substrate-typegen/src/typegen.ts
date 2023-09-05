import {SpecVersion} from '@subsquid/substrate-metadata-explorer/lib/specVersion'
import {QualifiedName, Runtime} from '@subsquid/substrate-runtime'
import {Constant, OldSpecsBundle, OldTypesBundle, StorageItem} from '@subsquid/substrate-runtime/lib/metadata'
import {getTypeHash} from '@subsquid/substrate-runtime/lib/sts'
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
        this.generateStorage()
        this.generateConsts()
        this.sts.forEach((sts, runtime) => {
            if (sts.sink.isEmpty()) return
            let fileName = toCamelCase(this.getVersionName(runtime)) + '.ts'
            let file = this.dir.file(fileName)
            file.line(`import {sts, Result, Option, Bytes} from './support'`)
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

        out.line(`import {${fix}Type, sts} from './support'`)
        let runtimeImports = this.runtimeImports(out)

        for (let [qn, v] of this.enumerateVersions(items)) {
            let versionName = this.getVersionName(v.runtime)
            let itemName = this.createName(v.def.pallet, v.def.name, fix, versionName)
            let sts = this.getSts(v.runtime)

            out.line()
            out.blockComment(v.def.docs)
            out.line(`export const ${itemName} = new ${fix}Type(`)
            out.indentation(() => {
                if (v.def.fields.length == 0 || v.def.fields[0].name == null) {
                    if (v.def.fields.length == 1) {
                        out.line(this.qualify(runtimeImports, v.runtime, sts.use(v.def.fields[0].type)))
                    } else {
                        let texp = v.def.fields.map(f => sts.use(f.type)).join(', ')
                        texp = this.qualify(runtimeImports, v.runtime, texp)
                        if (texp) {
                            out.line(`sts.tuple(${texp})`)
                        } else {
                            out.line('sts.unit()')
                        }
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

        out.write()
    }

    private generateConsts(): void {
        let items = this.collectItems(
            this.options.constants,
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
            (runtime, qualifiedName) => {
                let [prefix, name] = qualifiedName.split('.')
                let def = runtime.description.constants[prefix][name]
                return getTypeHash(runtime.description.types, def.type)
            }
        )

        if (items.size == 0) return

        let out = this.dir.file(`constants.ts`)
        out.line(`import {ConstantType, sts} from './support'`)
        let imports = this.runtimeImports(out)

        for (let [qn, v] of this.enumerateVersions(items)) {
            let [pallet, name] = qn.split('.')
            let versionName = this.getVersionName(v.runtime)
            let itemName = this.createName(pallet, name, 'Const', versionName)
            let sts = this.getSts(v.runtime)
            let type = sts.use(v.def.type)
            let qualifiedType = this.qualify(imports, v.runtime, type)

            out.line()
            out.blockComment(v.def.docs)
            out.line(`export const ${itemName} = new ConstantType(`)
            out.indentation(() => {
                out.line(`'${qn}',`)
                out.line(qualifiedType)
            })
            out.line(')')
        }

        out.write()
    }

    private generateStorage(): void {
        let items = this.collectItems(
            this.options.storage,
            runtime => {
                let items: Item<StorageItem>[] = []
                let storage = runtime.description.storage
                for (let prefix in storage) {
                    for (let name in storage[prefix]) {
                        items.push({
                            runtime,
                            name: prefix + '.' + name,
                            def: storage[prefix][name]
                        })
                    }
                }
                return items
            },
            (runtime, qualifiedName) => {
                let [prefix, name] = qualifiedName.split('.')
                let def = runtime.description.storage[prefix][name]
                return JSON.stringify({
                    modifier: def.modifier,
                    key: def.keys.map(ti => getTypeHash(runtime.description.types, ti)),
                    value: getTypeHash(runtime.description.types, def.value)
                })
            }
        )

        if (items.size == 0) return

        let out = this.dir.file('storage.ts')
        out.line(`import {StorageType, sts, Block, Bytes, Option, Result} from './support'`)
        let importedInterfaces = this.runtimeImports(out)

        for (let [qn, v] of this.enumerateVersions(items)) {
            if (isEmptyStorageItem(v)) continue // Storage item can't hold any value

            let [prefix, name] = qn.split('.')
            let an = this.createName(prefix, name, 'Storage', this.getVersionName(v.runtime))
            let sts = this.getSts(v.runtime)

            {
                let keyListExp = this.qualify(
                    importedInterfaces,
                    v.runtime,
                    v.def.keys.map(ti => sts.use(ti)).join(', ')
                )

                let valueExp = this.qualify(
                    importedInterfaces,
                    v.runtime,
                    sts.use(v.def.value)
                )

                out.line()
                out.blockComment(v.def.docs)
                out.line(`export const ${an}: I${an} = new StorageType(`)
                out.indentation(() => {
                    out.line(`'${qn}',`)
                    out.line(`'${v.def.modifier}',`)
                    out.line(`[${keyListExp}],`)
                    out.line(valueExp)
                })
                out.line(')')
            }

            out.line()
            out.blockComment(v.def.docs)
            out.block(`export interface I${an} `, () => {
                let value = this.qualify(importedInterfaces, v.runtime, sts.ifs.use(v.def.value))

                let keys = v.def.keys.map(ti => {
                    return this.qualify(importedInterfaces, v.runtime, sts.ifs.use(ti))
                })

                let args = keys.length == 1
                    ? [`key: ${keys[0]}`]
                    : keys.map((exp, idx) => `key${idx+1}: ${exp}`)

                let fullKey = keys.length == 1 ? keys[0] : `[${keys.join(', ')}]`

                let ret = v.def.modifier == 'Required' ? value : `${value} | undefined`

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

                if (v.def.modifier == 'Default') {
                    out.line(`getDefault(block: Block): ${value}`)
                }

                out.line(`get(${['block: Block'].concat(args).join(', ')}): Promise<${ret}>`)

                if (args.length > 0) {
                    out.line(`getMany(block: Block, keys: ${fullKey}[]): Promise<${ret}[]>`)
                    if (isStorageKeyDecodable(v.def)) {
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

    createName(pallet: string, name: string, suffix: string, version: string): string {
        return upperCaseFirst(
            toCamelCase(`${pallet}_${name}_${suffix}_${version}`)
        )
    }

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

    private *enumerateVersions<T>(items: Map<QualifiedName, Item<T>[]>): Iterable<[QualifiedName, Item<T>]> {
        let names = Array.from(items.keys()).sort()
        for (let name of names) {
            for (let item of items.get(name)!) {
                yield [name, item]
            }
        }
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
