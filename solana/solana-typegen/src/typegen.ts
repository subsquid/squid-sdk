import {Logger} from '@subsquid/logger'
import {def, unexpectedCase} from '@subsquid/util-internal'
import {FileOutput, OutDir, Output} from '@subsquid/util-internal-code-printer'
import {Program} from './program/description'
import {Primitive, Type, TypeKind} from './program/types'
import {toCamelCase} from '@subsquid/util-naming'

export class Typegen {
    private dest: OutDir

    constructor(dest: OutDir, private program: Program, basename: string, private log: Logger) {
        this.dest = dest.child(basename)
    }

    generate(): void {
        this.generateInstructions()
        // this.generateEvents()
        this.generateTypes()
    }

    private generateInstructions() {
        let instructions = this.program.instructions
        if (instructions.length == 0) {
            return
        }

        const out = new TypeModuleOutput(this.dest.path('intructions.ts'))

        out.support.add(`instruction`)

        for (let i of instructions) {
            const argsType: Type =
                i.args.length > 0
                    ? {kind: TypeKind.Struct, fields: i.args}
                    : {kind: TypeKind.Primitive, primitive: 'unit'}

            const typeName = toTsName(i.name)
            out.line()
            out.blockComment(i.docs)
            out.printType(`export type ${typeName} = `, {type: argsType, name: typeName})

            const varName = toJsName(i.name)
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
                        out.line(`${i.accounts[j].name}: ${j},`)
                    }
                })
                out.line(`},`)
                out.printDSL(``, {type: argsType}, `,`)
            })
            out.line(')')
        }

        out.write()
        this.log.info(`saved ${out.file}`)
    }

    // private generateEvents() {
    //     let events = this.program.events
    //     if (events.length == 0) {
    //         return
    //     }
    //     this.useSupport(`event`)
    //     this.useBorsh('ref')
    //     out.line()
    //     out.block(`export const events =`, () => {
    //         for (let e of events) {
    //             out.line(`${e.name}: event(`)
    //             out.indentation(() => {
    //                 out.line(`{`)
    //                 out.indentation(() => {
    //                     out.line(`d${(e.discriminator.length - 2) / 2}: '${e.discriminator}',`)
    //                 })
    //                 out.line(`},`)
    //                 out.line(`ref(() => ${e.name}),`)
    //             })
    //             out.line('),')
    //         }
    //     })
    // }

    private generateTypes() {
        let types = this.program.types
        if (types.length == 0) {
            return
        }

        const out = new TypeModuleOutput(this.dest.path('types.ts'), true)

        out.borsh.add(`Codec`)

        for (let t of types) {
            const typeName = toTsName(t.name)
            if (t.type.kind === TypeKind.Enum) {
                for (const v of t.type.variants) {
                    out.line()
                    out.printType(`export type ${typeName}_${v.name} = `, {type: v.type, name: typeName})
                    out.line()
                    out.printDSL(`export const ${t.name}_${v.name} = `, {type: v.type, name: t.name})
                }
            }
            out.line()
            out.blockComment(t.docs)
            out.printType(`export type ${typeName} = `, {type: t.type, name: typeName})

            const varName = toJsName(t.name)
            out.line()
            out.blockComment(t.docs)
            out.printDSL(`export const ${varName}: Codec<${typeName}> = `, {type: t.type, name: varName})
        }

        out.write()
        this.log.info(`saved ${out.file}`)
    }
}

export class TypeModuleOutput extends FileOutput {
    readonly borsh: Set<string> = new Set()
    readonly support: Set<string> = new Set()
    readonly types: Set<string> = new Set()

    constructor(file: string, private isTypes: boolean = false) {
        super(file)

        this.lazy(() => {
            if (this.borsh.size == 0) return
            this.line(`import {${[...this.borsh].join(', ')}} from '@subsquid/borsh'`)
        })

        this.lazy(() => {
            if (this.support.size == 0) return
            this.line(`import {${[...this.support].join(', ')}} from '../idl.support'`)
        })

        if (!isTypes) {
            this.lazy(() => {
                if (this.types.size == 0) return
                this.line(`import {${[...this.types].join(', ')}} from './types'`)
            })
        }
    }

    printDSL(start: string, {name, type}: {name?: string; type: Type}, end: string = ''): void {
        switch (type.kind) {
            case TypeKind.Primitive:
                this.borsh.add(type.primitive)
                this.line(start + type.primitive + end)
                break
            case TypeKind.Array:
                this.borsh.add('array')
                this.printDSL(start + `array(`, {type: type.type}, `)` + end)
                break
            case TypeKind.FixedArray:
                this.borsh.add('fixedArray')
                this.printDSL(start + `fixedArray(`, {type: type.type}, `, ${type.len})` + end)
                break
            case TypeKind.Option:
                this.borsh.add('option')
                this.printDSL(start + `option(`, {type: type.type}, `)` + end)
                break
            case TypeKind.Struct:
                this.borsh.add('struct')
                this.line(start + `struct({`)
                this.indentation(() => {
                    for (const f of type.fields) {
                        this.blockComment(f.docs)
                        this.printDSL(`${f.name}: `, {type: f.type}, ',')
                    }
                })
                this.line(`})` + end)
                break
            case TypeKind.Tuple:
                this.borsh.add('tuple')
                this.line(start + `tuple([`)
                this.indentation(() => {
                    for (const t of type.tuple) {
                        this.printDSL(``, {type: t}, ',')
                    }
                })
                this.line(`])` + end)
                break
            case TypeKind.Defined:
                this.borsh.add('ref')
                this.types.add(toJsName(type.name))
                this.line(start + (this.isTypes ? `ref(() => ${toJsName(type.name)})` : type.name) + end)
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
                                this.printDSL(`value: `, {type: v.type}, ',')
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
                        this.printType(`${f.name}${isOptional(f.type) ? `?` : ``}: `, {type: f.type})
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
                this.types.add(toTsName(type.name))
                this.line(start + toTsName(type.name) + end)
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
                        this.line(`}`)
                    }
                })
                if (end) this.line(end)
                break
            default:
                throw unexpectedCase(type.kind)
        }
    }
}

function toPascalCase(value: string) {
    const r = toCamelCase(value)
    return r[0].toUpperCase() + r.slice(1)
}

function toJsName(value: string) {
    return value.replace(/[:<>]/g, `_`)
}

function toTsName(value: string) {
    return toPascalCase(toJsName(value)) + `Type`
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
