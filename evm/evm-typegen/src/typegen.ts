import { Logger } from '@subsquid/logger'
import { def } from '@subsquid/util-internal'
import { keccak256 } from '@subsquid/evm-abi'
import { getType } from './util/types'
import type { Abi, AbiEvent, AbiFunction, AbiParameter } from 'abitype'
import { FileOutput, OutDir } from '@subsquid/util-internal-code-printer'

export class Typegen {
  private out: FileOutput

  constructor(
    dest: OutDir,
    private abi: Abi,
    basename: string,
    private log: Logger,
  ) {
    this.out = dest.file(basename + '.ts')
  }

  async generate() {
    this.out.line(`import * as p from '@subsquid/evm-codec'`)
    this.out.line(
      `import { event, fun, viewFun, indexed, ContractBase } from '@subsquid/evm-abi'`,
    )
    this.out.line(
      `import type { EventParams as EParams, FunctionArguments, FunctionReturn } from '@subsquid/evm-abi'`,
    )

    this.generateEvents()
    this.generateFunctions()
    this.generateContract()
    this.generateEventTypes()
    this.generateFunctionTypes()

    await this.out.write()
    this.log.info(`saved ${this.out.file}`)
  }

  private generateEvents() {
    let events = this.getEvents()
    if (events.length == 0) {
      return
    }
    this.out.line()
    this.out.block(`export const events =`, () => {
      for (let e of events) {
        this.out.line(
          `${this.getPropName(e)}: event("${this.topic0(e)}", "${this.signature(e)}", {${this.toTypes(
            e.inputs,
          )}}),`,
        )
      }
    })
  }

  private topic0(e: AbiEvent): string {
    return `0x${keccak256(this.signature(e)).toString('hex')}`
  }

  private toTypes(inputs: readonly AbiParameter[]): string {
    return inputs.map((input, idx) => getType(input, idx)).join(', ')
  }

  private generateFunctions() {
    let functions = this.getFunctions()
    if (functions.length == 0) {
      return
    }
    this.out.line()
    this.out.block(`export const functions =`, () => {
      for (let f of functions) {
        let returnType = ''
        if (f.outputs?.length === 1) {
          returnType = getType({ ...f.outputs[0], name: undefined })
        }
        if (f.outputs?.length > 1) {
          returnType = `{${this.toTypes(f.outputs)}}`
        }
        const funType = f.stateMutability === 'view' || f.stateMutability === 'pure' ? 'viewFun' : 'fun'
        this.out.line(
          `${this.getPropName(f)}: ${funType}("${this.functionSelector(
            f,
          )}", "${this.signature(f)}", {${this.toTypes(f.inputs)}}, ${returnType}),`,
        )
      }
    })
  }

  private functionSelector(f: AbiFunction): string {
    const sighash = this.signature(f)
    return `0x${keccak256(sighash).slice(0, 4).toString('hex')}`
  }

  private generateContract() {
    this.out.line()
    this.out.block(`export class Contract extends ContractBase`, () => {
      let functions = this.getFunctions()
      for (let f of functions) {
        if ((f.stateMutability === 'pure' || f.stateMutability === 'view') &&
          f.outputs?.length
        ) {
          this.out.line()
          let argNames = f.inputs.map((a, idx) => a.name || `_${idx}`)
          const ref = this.getPropNameGetter(f)
          const [argsType] = this.toFunctionTypes(f)
          let args = f.inputs
            .map(
              (a, idx) =>
                `${argNames[idx]}: ${argsType}["${argNames[idx]}"]`,
            )
            .join(', ')
          this.out.block(`${this.getPropName(f)}(${args})`, () => {
            this.out.line(
              `return this.eth_call(functions${ref}, {${argNames.join(', ')}})`,
            )
          })
        }
      }
    })
  }

  private canonicalType(param: AbiParameter): string {
    if (!param.type.startsWith('tuple')) {
      return param.type
    }
    const arrayBrackets = param.type.slice(5)
    return `(${(param as any).components.map((param: AbiParameter) =>
      this.canonicalType(param),
    )})${arrayBrackets}`
  }

  private signature(item: AbiEvent | AbiFunction): string {
    return `${item.name}(${item.inputs
      .map((param) => this.canonicalType(param))
      .join(',')})`
  }

  private getPropName(item: AbiEvent | AbiFunction): string {
    if (this.getOverloads(item) == 1) {
      return item.name
    } else if (item.type === 'function') {
      return `'${this.signature(item)}'`
    } else {
      return `'${item.name}(${item.inputs
      .map((param) => this.canonicalType(param) + (param.indexed ? ` indexed` : ``))
      .join(',')})'`
    }
  }

  private getPropNameGetter(item: AbiEvent | AbiFunction): string {
    if (this.getOverloads(item) == 1) {
      return '.' + item.name
    } else{
      return `[${this.getPropName(item)}]`
    }
  }

  private getOverloads(item: AbiEvent | AbiFunction): number {
    if (item.type === 'event') {
      return this.eventOverloads()[item.name]
    } else {
      return this.functionOverloads()[item.name]
    }
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1)
  }

  private getOverloadIndex(item: AbiEvent | AbiFunction): number {
    const abi = [...this.getEvents(), ...this.getFunctions()]
    const overloads = abi.filter((x) => x.name === item.name)
    return overloads.findIndex((x) => x === item)
  }

  private toEventType(e: AbiEvent): string {
    if (this.getOverloads(e) === 1) {
      return `${this.capitalize(e.name)}EventArgs`
    }
    const index = this.getOverloadIndex(e)
    return `${this.capitalize(e.name)}EventArgs_${index}`
  }

  private generateEventTypes() {
    const events = this.getEvents()
    if (events.length == 0) {
      return
    }
    this.out.line()
    this.out.line(`/// Event types`)
    for (let e of events) {
      const propName = this.getPropNameGetter(e)
      this.out.line(
        `export type ${this.toEventType(e)} = EParams<typeof events${propName}>`,
      )
    }
  }

  private toFunctionTypes(f: AbiFunction): [string, string] {
    if (this.getOverloads(f) === 1) {
      return [`${this.capitalize(f.name)}Params`, `${this.capitalize(f.name)}Return`]
    }
    const index = this.getOverloadIndex(f)
    return [`${this.capitalize(f.name)}Params_${index}`, `${this.capitalize(f.name)}Return_${index}`]
  }

  private generateFunctionTypes() {
    let functions = this.getFunctions()
    if (functions.length == 0) {
      return
    }
    this.out.line()
    this.out.line(`/// Function types`)
    for (let f of functions) {
      const propName = this.getPropNameGetter(f)
      const [args, ret] = this.toFunctionTypes(f)
      this.out.line(
        `export type ${args} = FunctionArguments<typeof functions${propName}>`,
      )
      this.out.line(
        `export type ${ret} = FunctionReturn<typeof functions${propName}>`,
      )
      this.out.line()
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
  private getFunctions(): AbiFunction[] {
    return this.abi.filter((f) => f.type === 'function') as AbiFunction[]
  }

  @def
  private getEvents(): AbiEvent[] {
    return this.abi.filter((f) => f.type === 'event') as AbiEvent[]
  }
}
