import {EventFragment, FunctionFragment, Interface} from '@ethersproject/abi'
import {Logger} from '@subsquid/logger'
import {def} from '@subsquid/util-internal'
import {FileOutput, OutDir} from '@subsquid/util-internal-code-printer'
import {getFullTupleType, getReturnType, getStructType, getTupleType, getType} from './util/types'


export class Typegen {
    private out: FileOutput

    constructor(private dest: OutDir, private abi: Interface, private basename: string, private log: Logger) {
        this.out = dest.file(basename + '.ts')
    }

    generate(): void {
        this.out.line("import * as ethers from 'ethers'")
        this.out.line("import {LogEvent, Func, ContractBase} from './abi.support'")
        this.out.line(`import {ABI_JSON} from './${this.basename}.abi'`)
        this.out.line()
        this.out.line("export const abi = new ethers.utils.Interface(ABI_JSON);")

        this.generateEvents()
        this.generateFunctions()
        this.generateContract()

        this.writeAbi()
        this.out.write()
        this.log.info(`saved ${this.out.file}`)
    }

    private writeAbi() {
        let out = this.dest.file(this.basename + '.abi.ts')
        let json = this.abi.format('json') as string
        json = JSON.stringify(JSON.parse(json), null, 4)
        out.line(`export const ABI_JSON = ${json}`)
        out.write()
        this.log.info(`saved ${out.file}`)
    }

    private generateEvents() {
        let events = Object.values(this.abi.events)
        if (events.length == 0) {
            return
        }
        this.out.line()
        this.out.block(`export const events =`, () => {
            for (let e of events) {
                let topic = this.abi.getEventTopic(e)
                this.out.line(`${this.getPropName(e)}: new LogEvent<${getFullTupleType(e.inputs)}>(`)
                this.out.indentation(() => this.out.line(`abi, '${topic}'`))
                this.out.line('),')
            }
        })
    }

    private generateFunctions() {
        let functions = Object.values(this.abi.functions)
        if (functions.length == 0) {
            return
        }
        this.out.line()
        this.out.block(`export const functions =`, () => {
            for (let f of functions) {
                let sighash = this.abi.getSighash(f)
                let pArgs = getTupleType(f.inputs)
                let pArgStruct = getStructType(f.inputs)
                let pResult = getReturnType(f.outputs || [])
                this.out.line(`${this.getPropName(f)}: new Func<${pArgs}, ${pArgStruct}, ${pResult}>(`)
                this.out.indentation(() => this.out.line(`abi, '${sighash}'`))
                this.out.line('),')
            }
        })
    }

    private generateContract() {
        this.out.line()
        this.out.block(`export class Contract extends ContractBase`, () => {
            let functions = Object.values(this.abi.functions)
            for (let f of functions) {
                if (f.constant && f.outputs?.length) {
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

    private getRef(item: EventFragment | FunctionFragment): string {
        let key = this.getPropName(item)
        if (key[0] == "'") {
            return `[${key}]`
        } else {
            return '.' + key
        }
    }

    private getPropName(item: EventFragment | FunctionFragment): string {
        if (this.getOverloads(item) == 1) {
            return item.name
        } else {
            return `'${item.format('sighash')}'`
        }
    }

    private getOverloads(item: EventFragment | FunctionFragment): number {
        if (item instanceof EventFragment) {
            return this.eventOverloads()[item.name]
        } else {
            return this.functionOverloads()[item.name]
        }
    }

    @def
    private functionOverloads(): Record<string, number> {
        let overloads: Record<string, number> = {}
        for (let item of Object.values(this.abi.functions)) {
            overloads[item.name] = (overloads[item.name] || 0) + 1
        }
        return overloads
    }

    @def
    private eventOverloads(): Record<string, number> {
        let overloads: Record<string, number> = {}
        for (let item of Object.values(this.abi.events)) {
            overloads[item.name] = (overloads[item.name] || 0) + 1
        }
        return overloads
    }
}
