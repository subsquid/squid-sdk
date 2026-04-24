import type {Logger} from '@subsquid/logger'
import {FileOutput, type OutDir} from '@subsquid/util-internal-code-printer'
import type {Abi} from 'abitype'
import {type ContractDef, type EventDef, type FieldDef, type FunctionDef, type TypeDef, describe} from './description'

type Import = {name: string; alias?: string; type?: boolean}

export class Typegen {
    private dest: OutDir
    private contract: ContractDef
    private modules = new Set<'events' | 'functions'>()

    constructor(
        dest: OutDir,
        abi: Abi,
        basename: string,
        private log: Logger,
    ) {
        this.dest = dest.child(basename)
        this.contract = describe(abi)
    }

    async generate(): Promise<void> {
        if (this.contract.events.length > 0) {
            this.generateEvents()
            this.modules.add('events')
        }
        if (this.contract.functions.length > 0) {
            this.generateFunctions()
            this.modules.add('functions')
        }
        this.generateContract()
        this.writeIndex()
    }

    private generateEvents(): void {
        const out = new TypeModuleOutput(this.dest.path('events.ts'))
        out.import('support', 'event')
        out.import('support', 'EventParams', 'EParams', true)

        for (let i = 0; i < this.contract.events.length; i++) {
            if (i > 0) out.line()
            out.printEvent(this.contract.events[i])
        }

        out.write()
        this.log.info(`saved ${out.file}`)
    }

    private generateFunctions(): void {
        const out = new TypeModuleOutput(this.dest.path('functions.ts'))
        out.import('support', 'FunctionArguments', undefined, true)
        out.import('support', 'FunctionReturn', undefined, true)

        for (let i = 0; i < this.contract.functions.length; i++) {
            if (i > 0) out.line()
            out.printFunction(this.contract.functions[i])
        }

        out.write()
        this.log.info(`saved ${out.file}`)
    }

    private generateContract(): void {
        const viewFns = this.contract.functions.filter((f) => f.kind === 'viewFun' && f.outputs.length > 0)

        const out = new TypeModuleOutput(this.dest.path('contract.ts'))
        out.import('support', 'ContractBase')

        for (const f of viewFns) {
            out.importFrom('./functions.js', {name: f.key})
            if (f.inputs.length > 0) {
                out.importFrom('./functions.js', {name: f.paramsTypeName, type: true})
            }
        }

        out.line('export class Contract extends ContractBase {')
        out.indentation(() => {
            for (let i = 0; i < viewFns.length; i++) {
                const f = viewFns[i]
                if (i > 0) out.line()
                const argNames = f.inputs.map((a) => a.name)
                const argList = f.inputs
                    .map((a) => `${a.name}: ${f.paramsTypeName}[${JSON.stringify(a.name)}]`)
                    .join(', ')
                out.line(`${f.key}(${argList}) {`)
                out.indentation(() => {
                    const argsObj = argNames.length === 0 ? '{}' : `{${argNames.join(', ')}}`
                    out.line(`return this.eth_call(${f.key}, ${argsObj})`)
                })
                out.line('}')
            }
        })
        out.line('}')

        out.write()
        this.log.info(`saved ${out.file}`)
    }

    private writeIndex(): void {
        const out = new FileOutput(this.dest.path('index.ts'))
        for (const m of this.modules) {
            out.line(`export * as ${m} from './${m}.js'`)
        }
        out.line()
        out.line(`export { Contract } from './contract.js'`)
        out.write()
        this.log.info(`saved ${out.file}`)
    }
}

const EVM_CODEC_MODULE = '@subsquid/evm-codec'
const SUPPORT_MODULE = '../abi.support.js'

const BUCKETS = {
    evmCodec: EVM_CODEC_MODULE,
    support: SUPPORT_MODULE,
} as const

class TypeModuleOutput extends FileOutput {
    // Seeded so evm-codec + abi.support always appear first in the output.
    private imports = new Map<string, Import[]>([
        [EVM_CODEC_MODULE, []],
        [SUPPORT_MODULE, []],
    ])

    constructor(file: string) {
        super(file)
        this.lazy(() => {
            let printed = 0
            for (const [from, imps] of this.imports) {
                printed += this.printImports(from, imps)
            }
            if (printed > 0) this.line()
        })
    }

    import(bucket: keyof typeof BUCKETS, name: string, alias?: string, type = false): void {
        this.importFrom(BUCKETS[bucket], {name, alias, type})
    }

    importFrom(from: string, imp: Import): void {
        let list = this.imports.get(from)
        if (!list) {
            list = []
            this.imports.set(from, list)
        }
        list.push(imp)
    }

    private printImports(from: string, imports: Import[]): number {
        if (imports.length === 0) return 0
        const seen = new Set<string>()
        const values: Import[] = []
        const types: Import[] = []
        for (const imp of imports) {
            const key = `${imp.type ? 't' : 'v'}:${imp.name}:${imp.alias || ''}`
            if (seen.has(key)) continue
            seen.add(key)
            ;(imp.type ? types : values).push(imp)
        }
        const fmt = (list: Import[]) =>
            list
                .map((i) => (i.alias ? `${i.name} as ${i.alias}` : i.name))
                .sort()
                .join(', ')
        if (values.length > 0) this.line(`import { ${fmt(values)} } from '${from}'`)
        if (types.length > 0) this.line(`import type { ${fmt(types)} } from '${from}'`)
        return (values.length > 0 ? 1 : 0) + (types.length > 0 ? 1 : 0)
    }

    printEvent(e: EventDef): void {
        this.line(`// ${e.signature}`)
        if (e.inputs.length === 0) {
            this.line(`export const ${e.key} = event('${e.topic}', {})`)
        } else {
            this.line(`export const ${e.key} = event('${e.topic}', {`)
            this.indentation(() => {
                for (const f of e.inputs) this.printFieldDsl(f, ',')
            })
            this.line('})')
        }
        this.line(`export type ${e.typeName} = EParams<typeof ${e.key}>`)
    }

    printFunction(f: FunctionDef): void {
        this.import('support', f.kind)

        this.line(`// ${f.signature}`)
        const prefix = `export const ${f.key} = ${f.kind}('${f.selector}', `
        const hasInputs = f.inputs.length > 0
        const hasOutputs = f.outputs.length > 0
        const singleReturn = f.outputs.length === 1

        if (!hasInputs && !hasOutputs) {
            this.line(`${prefix}{})`)
        } else if (!hasInputs && singleReturn) {
            this.printTypeDsl(`${prefix}{}, `, f.outputs[0].type, ')')
        } else if (!hasInputs) {
            this.import('evmCodec', 'struct')
            this.line(`${prefix}{}, struct({`)
            this.indentation(() => {
                for (const o of f.outputs) this.printFieldDsl(o, ',')
            })
            this.line('}))')
        } else {
            this.line(`${prefix}{`)
            this.indentation(() => {
                for (const inp of f.inputs) this.printFieldDsl(inp, ',')
            })
            if (!hasOutputs) {
                this.line('})')
            } else if (singleReturn) {
                this.printTypeDsl('}, ', f.outputs[0].type, ')')
            } else {
                this.import('evmCodec', 'struct')
                this.line('}, struct({')
                this.indentation(() => {
                    for (const o of f.outputs) this.printFieldDsl(o, ',')
                })
                this.line('}))')
            }
        }

        this.line(`export type ${f.paramsTypeName} = FunctionArguments<typeof ${f.key}>`)
        this.line(`export type ${f.returnTypeName} = FunctionReturn<typeof ${f.key}>`)
    }

    private printFieldDsl(f: FieldDef, end: string): void {
        const start = `${propKey(f.name)}: `
        if (f.indexed) {
            this.import('support', 'indexed')
            this.printTypeDsl(`${start}indexed(`, f.type, `)${end}`)
            return
        }
        this.printTypeDsl(start, f.type, end)
    }

    private printTypeDsl(start: string, type: TypeDef, end: string): void {
        switch (type.kind) {
            case 'primitive':
                this.import('evmCodec', type.name)
                this.line(start + type.name + end)
                return
            case 'array':
                this.import('evmCodec', 'array')
                this.printTypeDsl(`${start}array(`, type.item, `)${end}`)
                return
            case 'fixedArray':
                this.import('evmCodec', 'fixedSizeArray')
                this.printTypeDsl(`${start}fixedSizeArray(`, type.item, `, ${type.size})${end}`)
                return
            case 'tuple': {
                this.import('evmCodec', 'struct')
                if (type.fields.length === 0) {
                    this.line(`${start}struct({})${end}`)
                    return
                }
                this.line(`${start}struct({`)
                this.indentation(() => {
                    for (const f of type.fields) this.printFieldDsl(f, ',')
                })
                this.line(`})${end}`)
                return
            }
        }
    }
}

function propKey(name: string): string {
    if (/^[a-zA-Z_$][0-9a-zA-Z_$]*$/.test(name)) return name
    return JSON.stringify(name)
}
