import * as p from '@subsquid/evm-codec'
import {fun, ContractBase, type AbiFunction, type FunctionReturn, type FunctionArguments} from '@subsquid/evm-abi'

const aggregate = fun('0x252dba42', {
  calls: p.array(p.struct({
    target: p.address,
    callData: p.bytes
  }))
}, {blockNumber: p.uint256, returnData: p.array(p.bytes)})

const tryAggregate = fun('0xbce38bd7', {
  requireSuccess: p.bool,
  calls: p.array(p.struct({target: p.address, callData: p.bytes}))
}, p.array(p.struct({success: p.bool, returnData: p.bytes})))

export type MulticallResult<T extends AbiFunction<any, any>> = {
  success: true
  value: FunctionReturn<T>
} | {
  success: false
  returnData?: string
  value?: undefined
}

type AnyFunc = AbiFunction<any, any>
type AggregateTuple<T extends AnyFunc = AnyFunc> = [func: T, address: string, args: T extends AnyFunc ? FunctionArguments<T> : never]
type Call = {target: string, callData: string}

export class Multicall extends ContractBase {
  static aggregate = aggregate
  static tryAggregate = tryAggregate

  aggregate<TF extends AnyFunc>(
    func: TF,
    address: string,
    calls: FunctionArguments<TF>[],
    paging?: number
  ): Promise<FunctionReturn<TF>[]>

  aggregate<TF extends AnyFunc>(
    func: TF,
    calls: (readonly [address: string, args: FunctionArguments<TF>])[],
    paging?: number
  ): Promise<FunctionReturn<TF>[]>

  aggregate(
    calls: AggregateTuple[],
    paging?: number
  ): Promise<any[]>

  async aggregate(...args: any[]): Promise<any[]> {
    let [calls, funcs, page] = this.makeCalls(args)
    let size = calls.length
    let results = new Array(size)
    for (let [from, to] of splitIntoPages(size, page)) {
      let {returnData} = await this.eth_call(aggregate, {calls: calls.slice(from, to)})
      for (let i = from; i < to; i++) {
        let data = returnData[i - from]
        results[i] = funcs[i].decodeResult(data)
      }
    }
    return results
  }

  tryAggregate<TF extends AnyFunc>(
    func: TF,
    address: string,
    calls: FunctionArguments<TF>[],
    paging?: number
  ): Promise<MulticallResult<TF>[]>

  tryAggregate<TF extends AnyFunc>(
    func: TF,
    calls: (readonly [address: string, args: FunctionArguments<TF>])[],
    paging?: number
  ): Promise<MulticallResult<TF>[]>

  tryAggregate(
    calls: AggregateTuple[],
    paging?: number
  ): Promise<MulticallResult<any>[]>

  async tryAggregate(...args: any[]): Promise<any[]> {
    let [calls, funcs, page] = this.makeCalls(args)
    let size = calls.length
    let results = new Array(size)
    for (let [from, to] of splitIntoPages(size, page)) {
      let response = await this.eth_call(tryAggregate, {
        requireSuccess: false,
        calls: calls.slice(from, to)
      })
      for (let i = from; i < to; i++) {
        let res = response[i - from]
        if (res.success) {
          try {
            results[i] = {
              success: true,
              value: funcs[i].decodeResult(res.returnData)
            }
          } catch (err: any) {
            results[i] = {success: false, returnData: res.returnData}
          }
        } else {
          results[i] = {success: false}
        }
      }
    }
    return results
  }

  private makeCalls(args: any[]): [calls: Call[], funcs: AnyFunc[], page: number] {
    let page = typeof args[args.length - 1] == 'number' ? args.pop()! : Number.MAX_SAFE_INTEGER
    switch (args.length) {
      case 1: {
        let list: AggregateTuple[] = args[0]
        let calls: Call[] = new Array(list.length)
        let funcs = new Array(list.length)
        for (let i = 0; i < list.length; i++) {
          let [func, address, args] = list[i]
          calls[i] = {target: address, callData: func.encode(args)}
          funcs[i] = func
        }
        return [calls, funcs, page]
      }
      case 2: {
        let func: AnyFunc = args[0]
        let list: [address: string, args: any][] = args[1]
        let calls: Call[] = new Array(list.length)
        let funcs = new Array(list.length)
        for (let i = 0; i < list.length; i++) {
          let [address, args] = list[i]
          calls[i] = {target: address, callData: func.encode(args)}
          funcs[i] = func
        }
        return [calls, funcs, page]
      }
      case 3: {
        let func: AnyFunc = args[0]
        let address: string = args[1]
        let list: any = args[2]
        let calls: Call[] = new Array(list.length)
        let funcs = new Array(list.length)
        for (let i = 0; i < list.length; i++) {
          let args = list[i]
          calls[i] = {target: address, callData: func.encode(args)}
          funcs[i] = func
        }
        return [calls, funcs, page]
      }
      default:
        throw new Error('unexpected number of arguments')
    }
  }
}


function* splitIntoPages(size: number, page: number): Iterable<[from: number, to: number]> {
  let from = 0
  while (size) {
    let step = Math.min(page, size)
    let to = from + step
    yield [from, to]
    size -= step
    from = to
  }
}
