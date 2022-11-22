import {Interface} from '@ethersproject/abi'
import {Logger} from '@subsquid/logger'
import {FileOutput, OutDir} from '@subsquid/util-internal-code-printer'
import {getFullTupleType, getReturnType, getStructType, getTupleType, getType} from './util'


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
            for (let event of events) {
                let signature = event.format('sighash')
                let topic = this.abi.getEventTopic(event)
                this.out.line(`'${signature}': new LogEvent<${getFullTupleType(event.inputs)}>(`)
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
                let signature = f.format('sighash')
                let sighash = this.abi.getSighash(f)
                let pArgs = getTupleType(f.inputs)
                let pArgStruct = getStructType(f.inputs)
                let pResult = getReturnType(f.outputs || [])
                this.out.line(`'${signature}': new Func<${pArgs}, ${pArgStruct}, ${pResult}>(`)
                this.out.indentation(() => this.out.line(`abi, '${sighash}'`))
                this.out.line('),')
            }
        })
    }

    private generateContract() {
        this.out.line()
        this.out.block(`export class Contract extends ContractBase`, () => {
            let functions = Object.values(this.abi.functions)
            let generated = new Set<string>()
            for (let f of functions) {
                if (f.constant && f.outputs?.length && !generated.has(f.name)) {
                    this.out.line()
                    generated.add(f.name)
                    let signature = f.format('sighash')
                    let argNames = f.inputs.map((a, idx) => a.name || `arg${idx}`)
                    let args  = f.inputs.map((a, idx) => `${argNames[idx]}: ${getType(a)}`).join(', ')
                    this.out.block(`${f.name}(${args}): Promise<${getReturnType(f.outputs)}>`, () => {
                        this.out.line(`return this.eth_call(functions['${signature}'], [${argNames.join(', ')}])`)
                    })
                }
            }
        })
    }
}
