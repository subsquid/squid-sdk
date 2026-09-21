import {Logger} from '@subsquid/logger'
import {assertNotNull, unexpectedCase} from '@subsquid/util-internal'
import {FileOutput, OutDir} from '@subsquid/util-internal-code-printer'
import {toCamelCase, toJsName} from '@subsquid/util-naming'
import {Event, Instruction, Program, TypeDef} from './program/description'
import {GenericArgKind, Primitive, Type, TypeKind} from './program/types'
import assert from 'assert'

export class Typegen {
    private dest: OutDir
    private modules: Set<string> = new Set()

    constructor(dest: OutDir, private program: Program, basename: string, private log: Logger) {
        this.dest = dest.child(basename)
    }

    generate(): void {
        this.generateInstructions()
        this.generateEvents()
        this.generateTypes()

        const out = this.dest.file(`index.ts`)

        for (const module of this.modules) {
            out.line(`export * as ${module} from './${module}.js'`)
        }

        if (this.program.programId) {
            out.line()
            out.line(`export const programId = '${this.program.programId}'`)
        }

        out.write()
        this.log.info(`saved ${out.file}`)
    }

    private generateInstructions() {
        const instructions = this.program.instructions
        if (!instructions.length) return

        this.modules.add('instructions')
        const out = new TypeModuleOutput(this.dest.path('instructions.ts'))

        for (let i of instructions) {
            out.printInstruction(i)
        }

        out.write()
        this.log.info(`saved ${out.file}`)
    }

    private generateEvents() {
        let events = this.program.events
        if (events.length == 0) {
            return
        }

        this.modules.add('events')

        const out = new TypeModuleOutput(this.dest.path('events.ts'))

        for (let e of events) {
            out.printEvent(e)
        }

        out.write()
        this.log.info(`saved ${out.file}`)
    }

    private generateTypes() {
        let types = this.program.types
        if (types.length == 0) {
            return
        }

        this.modules.add('types')

        const out = new TypeModuleOutput(this.dest.path('types.ts'), true)

        for (let t of orderTypes(types)) {
            out.printTypeDef(t)
        }

        out.write()
        this.log.info(`saved ${out.file}`)
    }
}

type Import = string | {name: string; alias?: string}

export class TypeModuleOutput extends FileOutput {
    private borsh: Set<Import> = new Set()
    private support: Set<Import> = new Set()
    private types: Set<Import> = new Set()

    private scope: Set<string> = new Set()

    constructor(file: string, private isTypes: boolean = false) {
        super(file)

        this.lazy(() => {
            this.printImports(this.borsh, '@subsquid/borsh')
            this.printImports(this.support, '../abi.support.js')
            if (!isTypes) {
                this.printImports(this.types, './types.js')
            }
        })
    }

    printInstruction(ins: Instruction): void {
        const argsType: Type =
            ins.args.length > 0
                ? {kind: TypeKind.Struct, fields: ins.args}
                : {kind: TypeKind.Primitive, primitive: 'unit'}

        const typeName = toTypeName(ins.name)
        this.line()
        this.blockComment(ins.docs)
        if (argsType.kind === TypeKind.Struct) {
            this.printType(`export interface ${typeName} `, {type: argsType, name: typeName})
        } else {
            this.printType(`export type ${typeName} = `, {type: argsType, name: typeName})
        }

        this.import('support', 'instruction')

        const varName = toCamelCaseWithUnderscore(toJsName(ins.name))
        this.line()
        this.blockComment(ins.docs)
        this.line(`export const ${varName} = instruction(`)
        this.indentation(() => {
            this.line(`{`)
            this.indentation(() => {
                this.line(`d${(ins.discriminator.length - 2) / 2}: '${ins.discriminator}',`)
            })
            this.line(`},`)
            this.line(`{`)
            this.indentation(() => {
                for (let j = 0; j < ins.accounts.length; j++) {
                    this.blockComment(ins.accounts[j].docs)
                    this.line(`${toPropName(ins.accounts[j].name)}: ${j},`)
                }
            })
            this.line(`},`)
            this.printDsl(``, {type: argsType}, `,`)
        })
        this.line(')')
    }

    printEvent(event: Event): void {
        const typeName = toTypeName(event.name)
        this.import('types', typeName, dedupe(typeName))
        this.line()
        this.line(`export type ${typeName} = ${dedupe(typeName)}`)

        this.import('support', 'event')

        const varName = toJsName(sanitize(event.name))
        this.line()
        this.line(`export const ${varName} = event(`)
        this.indentation(() => {
            this.line(`{`)
            this.indentation(() => {
                this.line(`d${(event.discriminator.length - 2) / 2}: '${event.discriminator}',`)
            })
            this.line(`},`)
            this.line(dedupe(varName) + `,`)
        })
        this.line(')')
    }

    printTypeDef(type: TypeDef) {
        const typeName = toTypeName(type.name)
        const typeGenerics = type.generics ? `<${type.generics.map((g) => `${g.name}`).join(', ')}>` : ''

        this.import('borsh', 'Codec')

        const dslName = toTypeName(type.name)
        const dslGenerics = type.generics
            ? `${typeGenerics}(${type.generics
                  .map((g) => `${g.name}: Codec<${g.name}>`)
                  .join(', ')}): Codec<${typeName}${typeGenerics}> => `
            : ''

        if (type.type.kind === TypeKind.Enum) {
            for (const v of type.type.variants) {
                this.line()
                this.printType(`export type ${typeName}_${v.name} = `, {type: v.type, name: typeName})
                this.line()
                this.printDsl(`export const ${dslName}_${v.name} = `, {
                    type: v.type,
                    name: dslName,
                })
            }
        }
        this.line()
        this.blockComment(type.docs)
        if (type.type.kind === TypeKind.Struct) {
            this.printType(`export interface ${typeName}${typeGenerics} `, {type: type.type, name: typeName})
        } else {
            this.printType(`export type ${typeName}${typeGenerics} = `, {type: type.type, name: typeName})
        }
        this.line()
        this.blockComment(type.docs)
        this.printDsl(`export const ${dslName}${!!dslGenerics ? ` = ${dslGenerics}` : `: Codec<${typeName}> = `}`, {
            type: type.type,
            name: dslName,
        })

        this.scope.add(dslName)
    }

    private printDsl(start: string, {name, type}: {name?: string; type: Type}, end: string = ''): void {
        switch (type.kind) {
            case TypeKind.Primitive:
                this.import('borsh', type.primitive)
                this.line(start + type.primitive + end)
                break
            case TypeKind.Array:
                this.import('borsh', 'array')
                this.printDsl(start + `array(`, {type: type.type}, `)` + end)
                break
            case TypeKind.FixedArray:
                assert(typeof type.len === 'number', 'Generic array length not supported')
                this.import('borsh', 'fixedArray')
                this.printDsl(start + `fixedArray(`, {type: type.type}, `, ${type.len})` + end)
                break
            case TypeKind.Option:
                this.import('borsh', 'option')
                this.printDsl(start + `option(`, {type: type.type}, `)` + end)
                break
            case TypeKind.Struct:
                this.import('borsh', 'struct')
                this.line(start + `struct({`)
                this.indentation(() => {
                    for (const f of type.fields) {
                        this.blockComment(f.docs)
                        this.printDsl(`${toPropName(f.name)}: `, {type: f.type}, ',')
                    }
                })
                this.line(`})` + end)
                break
            case TypeKind.Tuple:
                this.import('borsh', 'tuple')
                this.line(start + `tuple([`)
                this.indentation(() => {
                    for (const t of type.tuple) {
                        this.printDsl(``, {type: t}, ',')
                    }
                })
                this.line(`])` + end)
                break
            case TypeKind.HashMap:
                this.import('borsh', 'hashMap')
                this.line(start + `hashMap(`)
                this.indentation(() => {
                    this.printDsl(``, {type: type.key}, ',')
                    this.printDsl(``, {type: type.value}, '')
                })
                this.line(`)` + end)
                break
            case TypeKind.HashSet:
                this.import('borsh', 'hashSet')
                this.printDsl(start + `hashSet(`, {type: type.type}, `)` + end)
                break
            case TypeKind.Defined:
                const typeName = toTypeName(type.name)
                this.import('types', typeName)
                if (!this.scope.has(typeName)) {
                    this.import('borsh', 'ref')
                    start = start + 'ref(() => '
                    end = ')' + end
                }
                if (type.generics) {
                    if (type.generics.length > 1) {
                        this.line(start + typeName + '(')
                        this.indentation(() => {
                            for (const g of type.generics!) {
                                assert(g.kind === GenericArgKind.Type, 'Generic consts not supported')
                                this.printDsl('', {type: g.type}, ',')
                            }
                        })
                        this.line(')' + end)
                    } else {
                        let g = type.generics[0]
                        assert(g.kind === GenericArgKind.Type, 'Generic consts not supported')
                        this.printDsl(start + typeName + '(', {type: g.type}, ')' + end)
                    }
                } else {
                    this.line(start + typeName + end)
                }
                break
            case TypeKind.Enum:
                this.import('borsh', 'sum')
                this.line(start + `sum(${type.discriminatorType}, {`)
                this.indentation(() => {
                    for (let v of type.variants) {
                        this.line(`${v.name}: {`)
                        this.indentation(() => {
                            this.line(`discriminator: ${v.discriminator},`)
                            if (name) {
                                this.line(`value: ${name}_${v.name},`)
                            } else {
                                this.printDsl(`value: `, {type: v.type}, ',')
                            }
                        })
                        this.line(`},`)
                    }
                })
                this.line(`})` + end)
                break
            case TypeKind.Generic:
                this.line(start + type.name + end)
                break
        }
    }

    private printType(start: string, {type, name}: {name?: string; type: Type}, end: string = ''): void {
        switch (type.kind) {
            case TypeKind.Primitive:
                this.line(start + toJsPrimitive(type.primitive) + end)
                break
            case TypeKind.Array:
            case TypeKind.FixedArray:
                this.printType(start + `Array<`, {type: type.type}, `>` + end)
                break
            case TypeKind.Option:
                this.printType(start, {type: type.type}, ` | undefined` + end)
                break
            case TypeKind.Struct:
                this.line(start + `{`)
                this.indentation(() => {
                    for (const f of type.fields) {
                        this.blockComment(f.docs)
                        this.printType(`${toPropName(f.name)}${isOptional(f.type) ? `?` : ``}: `, {type: f.type})
                    }
                })
                this.line(`}` + end)
                break
            case TypeKind.Tuple:
                this.line(start + `[`)
                this.indentation(() => {
                    for (const t of type.tuple) {
                        this.printType(``, {type: t}, `,`)
                    }
                })
                this.line(`]` + end)
                break
            case TypeKind.HashMap:
                this.line(start + `Map<`)
                this.indentation(() => {
                    this.printType(``, {type: type.key}, `,`)
                    this.printType(``, {type: type.value}, ``)
                })
                this.line(`>` + end)
                break
            case TypeKind.HashSet:
                this.printType(start + `Set<`, {type: type.type}, `>` + end)
                break
            case TypeKind.Defined:
                this.import('types', toTypeName(type.name))
                if (!!type.generics) {
                    if (type.generics.length > 1) {
                        this.line(start + toTypeName(type.name) + '<')
                        this.indentation(() => {
                            for (let i = 0; i < type.generics!.length; i++) {
                                const g = type.generics![i]
                                assert(g.kind === GenericArgKind.Type, 'Generic consts not supported')
                                this.printType('', {type: g.type}, i === type.generics!.length - 1 ? '' : ',')
                            }
                        })
                        this.line('>' + end)
                    } else {
                        let g = type.generics![0]
                        assert(g.kind === GenericArgKind.Type, 'Generic consts not supported')
                        this.printType(start + toTypeName(type.name) + '<', {type: g.type}, '>' + end)
                    }
                } else {
                    this.line(start + toTypeName(type.name) + end)
                }
                break
            case TypeKind.Enum:
                this.line(start)
                this.indentation(() => {
                    for (let i = 0; i < type.variants.length; i++) {
                        const v = type.variants[i]
                        this.line(`| {`)
                        this.indentation(() => {
                            this.line(`kind: '${v.name}'`)
                            if (name) {
                                this.line(`value${isOptional(v.type) ? `?` : ``}: ${name}_${v.name}`)
                            } else {
                                this.printType(`value${isOptional(v.type) ? `?` : ``}: `, {type: v.type})
                            }
                        })
                        this.line(`  }`)
                    }
                })
                if (end) this.line(end)
                break
            case TypeKind.Generic:
                this.line(start + `${type.name}` + end)
                break
        }
    }

    private printImports(imports: Set<Import>, from: string) {
        if (imports.size == 0) return
        this.line(
            `import {${[...imports]
                .sort()
                .map((i) => (typeof i === 'string' ? i : i.alias ? `${i.name} as ${i.alias}` : i.name))
                .join(', ')}} from '${from}'`
        )
    }

    private import(from: 'borsh' | 'types' | 'support', name: string, alias?: string) {
        if (from === 'types' && this.isTypes) return
        this[from].add(alias ? {name, alias} : name)
        this.scope.add(alias || name)
    }
}

function sanitize(value: string) {
    return value.replace(/[:<>]/g, `_`)
}

function toTypeName(value: string) {
    return toCamelCaseWithUnderscore(toJsName((sanitize(value))), true)
}

function toPropName(value: string) {
    return toCamelCaseWithUnderscore(toJsName(value))
}

function toCamelCaseWithUnderscore(value: string, uppercaseFirstLetter: boolean = false) {
    let camelCaseName = toCamelCase(value, uppercaseFirstLetter)
    return value[0] === '_' ? `_${camelCaseName}` : camelCaseName
}

function dedupe(value: string) {
    return value + '_'
}

function isOptional(type: Type) {
    switch (type.kind) {
        case TypeKind.Option:
            return true
        case TypeKind.Primitive:
            return type.primitive === 'unit'
        default:
            return false
    }
}

function toJsPrimitive(value: Primitive) {
    switch (value) {
        case 'address':
        case 'string':
            return 'string'
        case 'binary':
            return 'Uint8Array'
        case 'bool':
            return 'boolean'
        case 'f32':
        case 'f64':
            return 'number'
        case 'u8':
        case 'i8':
        case 'u16':
        case 'i16':
        case 'u32':
        case 'i32':
            return 'number'
        case 'u64':
        case 'i64':
        case 'u128':
        case 'i128':
        case 'u256':
        case 'i256':
            return 'bigint'
        case 'unit':
            return 'undefined'
        default:
            throw unexpectedCase(value)
    }
}

function orderTypes(types: TypeDef[]): TypeDef[] {
    const nodes = new Map(types.map((node) => [node.name, {value: node, state: 'unvisited'}]))
    const res: TypeDef[] = []

    function traverse(type: Type): string[] {
        switch (type.kind) {
            case TypeKind.Primitive:
            case TypeKind.Generic:
                return []
            case TypeKind.Array:
            case TypeKind.FixedArray:
            case TypeKind.HashSet:
            case TypeKind.Option:
                return traverse(type.type)
            case TypeKind.Defined:
                return [type.name]
            case TypeKind.Enum:
                return type.variants.flatMap((v) => traverse(v.type))
            case TypeKind.Struct:
                return type.fields.flatMap((f) => traverse(f.type))
            case TypeKind.Tuple:
                return type.tuple.flatMap(traverse)
            case TypeKind.HashMap:
                return [...traverse(type.key), ...traverse(type.value)]
            default:
                throw unexpectedCase((type as any).kind)
        }
    }

    function visit(node: {value: TypeDef; state: string}) {
        if (node.state !== 'unvisited') return
        node.state = 'visiting'
        for (const edge of traverse(node.value.type)) {
            const target = nodes.get(edge)
            visit(assertNotNull(target))
        }
        node.state = 'visited'
        res.push(node.value)
    }

    for (const node of nodes.values()) {
        visit(node)
    }

    return res
}
