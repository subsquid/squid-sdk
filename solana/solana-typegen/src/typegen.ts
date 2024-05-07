import {Logger} from '@subsquid/logger'
import {unexpectedCase} from '@subsquid/util-internal'
import {FileOutput, OutDir} from '@subsquid/util-internal-code-printer'
import {toCamelCase, toJsName} from '@subsquid/util-naming'
import {Program} from './program/description'
import {Primitive, Type, TypeKind} from './program/types'


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
            out.line(`export * as ${module} from './${module}'`)
        }

        if (this.program.programId) {
            out.line()
            out.line(`export const programId = '${this.program.programId}'`)
        }

        out.write()
        this.log.info(`saved ${out.file}`)
    }

    private generateInstructions() {
        let instructions = this.program.instructions
        if (instructions.length == 0) {
            return
        }

        this.modules.add('intructions')

        const out = new TypeModuleOutput(this.dest.path('intructions.ts'))

        out.support.add(`instruction`)

        for (let i of instructions) {
            const argsType: Type =
                i.args.length > 0
                    ? {kind: TypeKind.Struct, fields: i.args}
                    : {kind: TypeKind.Primitive, primitive: 'unit'}

            const typeName = toTypeName(i.name)
            out.line()
            out.blockComment(i.docs)
            if (argsType.kind === TypeKind.Struct) {
                out.printType(`export interface ${typeName} `, {type: argsType, name: typeName})
            } else {
                out.printType(`export type ${typeName} = `, {type: argsType, name: typeName})
            }

            const varName = toCamelCase(toJsName(i.name))
            out.line()
            out.blockComment(i.docs)
            out.line(`export const ${varName} = instruction(`)
            out.indentation(() => {
                out.line(`{`)
                out.indentation(() => {
                    out.line(`d${(i.discriminator.length - 2) / 2}: '${i.discriminator}',`)
                })
                out.line(`},`)
                out.line(`{`)
                out.indentation(() => {
                    for (let j = 0; j < i.accounts.length; j++) {
                        out.blockComment(i.accounts[j].docs)
                        out.line(`${toPropName(i.accounts[j].name)}: ${j},`)
                    }
                })
                out.line(`},`)
                out.printDsl(``, {type: argsType}, `,`)
            })
            out.line(')')
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

        out.support.add(`event`)

        for (let e of events) {
            const typeName = toTypeName(e.name)
            out.types.add({name: typeName, alias: dedup(typeName)})
            out.line()
            out.line(`export type ${typeName} = ${dedup(typeName)}`)

            const varName = toDslName(e.name)
            out.line()
            out.line(`export const ${varName} = event(`)
            out.indentation(() => {
                out.line(`{`)
                out.indentation(() => {
                    out.line(`d${(e.discriminator.length - 2) / 2}: '${e.discriminator}',`)
                })
                out.line(`},`)
                out.line(dedup(varName) + `,`)
            })
            out.line(')')
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

        out.borsh.add(`Codec`)

        for (let t of types) {
            const typeName = toTypeName(t.name)
            if (t.type.kind === TypeKind.Enum) {
                for (const v of t.type.variants) {
                    out.line()
                    out.printType(`export type ${typeName}_${v.name} = `, {type: v.type, name: typeName})
                    out.line()
                    out.printDsl(`export const ${t.name}_${v.name} = `, {type: v.type, name: t.name})
                }
            }
            out.line()
            out.blockComment(t.docs)
            if (t.type.kind === TypeKind.Struct) {
                out.printType(`export interface ${typeName} `, {type: t.type, name: typeName})
            } else {
                out.printType(`export type ${typeName} = `, {type: t.type, name: typeName})
            }

            const varName = toTypeName(t.name)
            out.line()
            out.blockComment(t.docs)
            out.printDsl(`export const ${varName}: Codec<${typeName}> = `, {type: t.type, name: varName})
        }

        out.write()
        this.log.info(`saved ${out.file}`)
    }
}

type Import = string | {name: string; alias?: string}

export class TypeModuleOutput extends FileOutput {
    readonly borsh: Set<Import> = new Set()
    readonly support: Set<Import> = new Set()
    readonly types: Set<Import> = new Set()

    constructor(file: string, private isTypes: boolean = false) {
        super(file)

        this.lazy(() => {
            this.printImports(this.borsh, '@subsquid/borsh')
            this.printImports(this.support, '../idl.support')
            if (!isTypes) {
                this.printImports(this.types, './types')
            }
        })
    }

    printDsl(start: string, {name, type}: {name?: string; type: Type}, end: string = ''): void {
        switch (type.kind) {
            case TypeKind.Primitive:
                this.borsh.add(type.primitive)
                this.line(start + type.primitive + end)
                break
            case TypeKind.Array:
                this.borsh.add('array')
                this.printDsl(start + `array(`, {type: type.type}, `)` + end)
                break
            case TypeKind.FixedArray:
                this.borsh.add('fixedArray')
                this.printDsl(start + `fixedArray(`, {type: type.type}, `, ${type.len})` + end)
                break
            case TypeKind.Option:
                this.borsh.add('option')
                this.printDsl(start + `option(`, {type: type.type}, `)` + end)
                break
            case TypeKind.Struct:
                this.borsh.add('struct')
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
                this.borsh.add('tuple')
                this.line(start + `tuple([`)
                this.indentation(() => {
                    for (const t of type.tuple) {
                        this.printDsl(``, {type: t}, ',')
                    }
                })
                this.line(`])` + end)
                break
            case TypeKind.Defined:
                const typeName = toTypeName(type.name)
                this.types.add(typeName)
                if (this.isTypes) {
                    this.borsh.add('ref')
                    this.line(start + `ref(() => ${typeName})` + end)
                } else {
                    this.line(start + typeName + end)
                }
                break
            case TypeKind.Enum:
                this.borsh.add('sum')
                this.line(start + `sum(1, {`)
                this.indentation(() => {
                    for (let i = 0; i < type.variants.length; i++) {
                        const v = type.variants[i]
                        this.line(`${v.name}: {`)
                        this.indentation(() => {
                            this.line(`discriminator: ${i},`)
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
            default:
                throw unexpectedCase(type.kind)
        }
    }

    printType(start: string, {type, name}: {name?: string; type: Type}, end: string = ''): void {
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
            case TypeKind.Defined:
                this.types.add(toTypeName(type.name))
                this.line(start + toTypeName(type.name) + end)
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
            default:
                throw unexpectedCase(type.kind)
        }
    }

    private printImports(imports: Set<Import>, from: string) {
        if (imports.size == 0) return
        this.line(
            `import {${[...imports]
                .map((i) => (typeof i === 'string' ? i : i.alias ? `${i.name} as ${i.alias}` : i.name))
                .join(', ')}} from '${from}'`
        )
    }
}

function sanitize(value: string) {
    return value.replace(/[:<>]/g, `_`)
}

function toDslName(value: string) {
    return toJsName(sanitize(value))
}

function toTypeName(value: string) {
    return toCamelCase(toDslName(value), true)
}

function toPropName(value: string) {
    return toCamelCase(toJsName(value))
}

function dedup(value: string) {
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
