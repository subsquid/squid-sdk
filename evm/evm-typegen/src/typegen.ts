import {Abi, AbiEvent, AbiFunction} from 'abitype'
import {Logger} from '@subsquid/logger'
import {def} from '@subsquid/util-internal'
import {FileOutput, OutDir} from '@subsquid/util-internal-code-printer'
import {
    getEventParamTypes,
    getNamedType,
    getReturnType,
    getType,
    stringifyParams
} from './util/types'
import {toEventHash, toFunctionHash, toFunctionSignature} from "viem";

type AbiItem = AbiEvent | AbiFunction

type Docs = {
    methods: Record<string, string>
    events: Record<string, string>
}

export class Typegen {
    private out: FileOutput

    constructor(private dest: OutDir, private abi: Abi, private basename: string, private docs: Docs, private log: Logger) {
        this.out = dest.file(basename + '.ts')
    }

    generate(): void {
        this.out.line("import {LogEvent, Func, ContractBase} from '@subsquid/evm-utils'")
        this.out.line()

        this.generateTypes()
        this.generateEvents()
        this.generateFunctions()
        this.generateContract()

        this.out.write()
        this.log.info(`saved ${this.out.file}`)
    }

    private generateTypes() {
        const events = this.getEvents()
        const functions = this.getFunctions()
        if (events.length > 0) {
            this.out.line()
            this.out.block(`export type EventTypes =`, () => {
                for (let e of events) {
                    this.out.line(`${this.getPropName(e)}: ${getEventParamTypes(e.inputs)},`)
                }
            })
        }
        if (functions.length > 0) {
            this.out.line()
            this.out.block(`export type FunctionTypes =`, () => {
                for (let f of functions) {
                    this.out.line(`${this.getPropName(f)}: {args: ${getNamedType(f.inputs)}, return: ${getReturnType(f.outputs)}},`)
                }
            })
        }
    }


    private generateEvents() {
        let events = this.getEvents()
        if (events.length == 0) {
            return
        }
        this.out.line()
        this.out.block(`export const events =`, () => {
            for (let e of events) {
                if (this.docs.events[toFunctionSignature(e)]) {
                    this.docs.events[toFunctionSignature(e)]
                      .split('\n').forEach(l => this.out.line(l))
                }
                this.out.line(`${this.getPropName(e)}: new LogEvent<EventTypes["${e.name}"]>(`)
                this.out.indentation(() => this.out.line(`'${toEventHash(e)}', ${stringifyParams(e.inputs)}`))
                this.out.line('),')
            }
        })
    }

    private generateFunctions() {
        let functions = this.getFunctions()
        if (functions.length == 0) {
            return
        }
        this.out.line()
        this.out.block(`export const functions =`, () => {
            for (let f of functions) {
                let sighash = toFunctionHash(f).slice(0, 10)
                const propName = this.getPropName(f)
                if (this.docs.methods[toFunctionSignature(f)]) {
                    this.docs.methods[toFunctionSignature(f)]
                      .split('\n').forEach(l => this.out.line(l))
                }
                this.out.line(`${propName}: new Func<FunctionTypes["${this.trimPropName(propName)}"]["args"], FunctionTypes["${this.trimPropName(propName)}"]["return"]>(`)
                this.out.indentation(() => this.out.line(`'${sighash}',`))
                this.out.indentation(() => this.out.line(`${stringifyParams(f.inputs)},`))
                this.out.indentation(() => this.out.line(`${stringifyParams(f.outputs)}`))
                this.out.line('),')
            }
        })
    }

    private generateContract() {
        this.out.line()
        this.out.block(`export class Contract extends ContractBase`, () => {
            let functions = this.getFunctions()
            for (let f of functions) {
                if ((f.stateMutability === 'pure' || f.stateMutability === 'view') && f.outputs?.length) {
                    this.out.line()
                    let argNames = f.inputs.map((a, idx) => a.name || `arg${idx}`)
                    let args  = f.inputs.map((a, idx) => `${argNames[idx]}: ${getType(a)}`).join(', ')
                    this.out.block(`${this.getPropName(f)}(${args}): Promise<${getReturnType(f.outputs)}>`, () => {
                        this.out.line(`return this.eth_call(functions${this.getRef(f)}, [${argNames.join(', ')}])`)
                    })
                }
            }
        })
    }

    private getRef(item: AbiItem): string {
        let key = this.getPropName(item)
        if (key[0] == "'") {
            return `[${key}]`
        } else {
            return '.' + key
        }
    }

    private getPropName(item: AbiItem): string {
        if (this.getOverloads(item) == 1) {
            return item.name
        } else {
            return `'${toFunctionSignature(item)}'`
        }
    }

    private trimPropName(name: string): string {
        return name.replace(/^'/g, '').replace(/'$/g, '')
    }

    private getOverloads(item: AbiItem): number {
        if (item.type === 'function') {
            return this.functionOverloads()[item.name]
        } else {
            return this.eventOverloads()[item.name]
        }
    }

    @def
    private functionOverloads(): Record<string, number> {
        let overloads: Record<string, number> = {}
        for (let item of this.getFunctions()) {
            overloads[item.name] = (overloads[item.name] || 0) + 1
        }
        return overloads
    }

    @def
    private eventOverloads(): Record<string, number> {
        let overloads: Record<string, number> = {}
        for (let item of this.getEvents()) {
            overloads[item.name] = (overloads[item.name] || 0) + 1
        }
        return overloads
    }

    @def
    private getFunctions() {
        return this.abi.filter(f => f.type === 'function') as AbiFunction[]
    }

    @def
    private getEvents() {
        return this.abi.filter(f => f.type === 'event') as AbiEvent[]
    }
}
