import {Logger} from '@subsquid/logger'
import {def, unexpectedCase} from '@subsquid/util-internal'
import {FileOutput, OutDir} from '@subsquid/util-internal-code-printer'
import {Program} from './program/description'
import {Type, TypeKind} from './program/types'

export class Typegen {
    private out: FileOutput
    private borsh: Set<string> = new Set()
    private support: Set<string> = new Set()

    constructor(dest: OutDir, private program: Program, basename: string, private log: Logger) {
        this.out = dest.file(basename + '.ts')
    }

    generate(): void {
        this.out.lazy(() => {
            this.out.line(`import {${[...this.borsh].join(', ')}} from '@subsquid/borsh'`)
        })
        this.out.lazy(() => {
            this.out.line(`import {${[...this.support].join(', ')}} from './idl.support'`)
        })

        this.generateInstructions()
        this.generateEvents()
        this.generateTypes()

        this.out.write()
        this.log.info(`saved ${this.out.file}`)
    }

    private generateInstructions() {
        let instructions = this.program.instructions
        if (instructions.length == 0) {
            return
        }
        this.useSupport(`instruction`)
        this.out.line()
        this.out.block(`export const instructions =`, () => {
            for (let i of instructions) {
                this.out.blockComment(i.docs)
                this.out.line(`${i.name}: instruction(`)
                this.out.indentation(() => {
                    this.out.line(`{`)
                    this.out.indentation(() => {
                        this.out.line(`d${(i.discriminator.length - 2) / 2}: '${i.discriminator}',`)
                    })
                    this.out.line(`},`)
                    this.out.line(`{`)
                    this.out.indentation(() => {
                        for (let j = 0; j < i.accounts.length; j++) {
                            this.out.blockComment(i.accounts[j].docs)
                            this.out.line(`${i.accounts[j].name}: ${j},`)
                        }
                    })
                    this.out.line(`},`)
                    if (i.args.length > 0) {
                        this.useBorsh('struct')
                        this.out.line(`struct({`)
                        this.out.indentation(() => {
                            for (let arg of i.args) {
                                this.out.blockComment(arg.docs)
                                this.printType(`${arg.name}: `, arg.type, `,`)
                            }
                        })
                        this.out.line(`}),`)
                    } else {
                        this.useBorsh('unit')
                        this.out.line(`unit`)
                    }
                })
                this.out.line('),')
            }
        })
    }

    private generateEvents() {
        let events = this.program.events
        if (events.length == 0) {
            return
        }
        this.useSupport(`event`)
        this.useBorsh('ref')
        this.out.line()
        this.out.block(`export const events =`, () => {
            for (let e of events) {
                this.out.line(`${e.name}: event(`)
                this.out.indentation(() => {
                    this.out.line(`{`)
                    this.out.indentation(() => {
                        this.out.line(`d${(e.discriminator.length - 2) / 2}: '${e.discriminator}',`)
                    })
                    this.out.line(`},`)
                    this.out.line(`ref(() => ${e.name}),`)
                })
                this.out.line('),')
            }
        })
    }

    private generateTypes() {
        let types = this.program.types
        if (types.length == 0) {
            return
        }
        for (let t of types) {
            this.out.line()
            this.out.blockComment(t.docs)
            this.printType(`export const ${t.name} = `, t.type)
        }
    }

    private printType(start: string, type: Type, end: string = ''): void {
        switch (type.kind) {
            case TypeKind.Primitive:
                this.useBorsh(type.primitive)
                this.out.line(start + type.primitive + end)
                break
            case TypeKind.Array:
                this.useBorsh('array')
                this.printType(start + `array(`, type.type, `)` + end)
                break
            case TypeKind.FixedArray:
                this.useBorsh('fixedArray')
                this.printType(start + `fixedArray(`, type.type, `, ${type.len})` + end)
                break
            case TypeKind.Option:
                this.useBorsh('option')
                this.printType(start + `option(`, type.type, `)` + end)
                break
            case TypeKind.Struct:
                this.useBorsh('struct')
                this.out.line(start + `struct({`)
                this.out.indentation(() => {
                    for (const f of type.fields) {
                        this.out.blockComment(f.docs)
                        this.printType(`${f.name}: `, f.type, ',')
                    }
                })
                this.out.line(`})` + end)
                break
            case TypeKind.Tuple:
                this.useBorsh('tuple')
                this.out.line(start + `tuple([`)
                this.out.indentation(() => {
                    for (const t of type.tuple) {
                        this.printType(``, t, ',')
                    }
                })
                this.out.line(`])` + end)
                break
            case TypeKind.Defined:
                this.useBorsh('ref')
                this.out.line(start + `ref(() => ${type.name})` + end)
                break
            case TypeKind.Enum:
                this.useBorsh('sum')
                this.out.line(start + `sum(1, {`)
                this.out.indentation(() => {
                    for (let i = 0; i < type.variants.length; i++) {
                        const v = type.variants[i]
                        this.out.line(`${v.name}: {`)
                        this.out.indentation(() => {
                            this.out.line(`discriminator: ${i},`)
                            this.printType(`value: `, v.type, ',')
                        })
                        this.out.line(`},`)
                    }
                })
                this.out.line(`})` + end)
                break
            default:
                throw unexpectedCase(type.kind)
        }
    }

    private useBorsh(value: string) {
        this.borsh.add(value)
    }

    private useSupport(value: string) {
        this.support.add(value)
    }
}
