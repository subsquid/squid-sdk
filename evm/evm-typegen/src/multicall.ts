import * as p from '@subsquid/evm-codec'
import {fun, ContractBase, type AbiFunction, type FunctionReturn, type FunctionArguments} from '@subsquid/evm-abi'

const aggregate = fun('0x252dba42', "aggregate((address,bytes)[])", {
  calls: p.array(p.struct({
    target: p.address,
    callData: p.bytes
  }))
}, {blockNumber: p.uint256, returnData: p.array(p.bytes)})

const tryAggregate = fun('0xbce38bd7', "tryAggregate(bool,(address,bytes)[])", {
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
type Call = {target: string, func: AnyFunc, callData: string}

export class Multicall extends ContractBase {
  static aggregate = aggregate
  static tryAggregate = tryAggregate

  aggregate<TF extends AnyFunc>(
    func: TF,
    address: string,
    calls: FunctionArguments<TF>[],
    pageSize?: number
  ): Promise<FunctionReturn<TF>[]>

  aggregate<TF extends AnyFunc>(
    func: TF,
    calls: (readonly [address: string, args: FunctionArguments<TF>])[],
    pageSize?: number
  ): Promise<FunctionReturn<TF>[]>

  aggregate(
    calls: AggregateTuple[],
    pageSize?: number
  ): Promise<any[]>

  async aggregate(...args: any[]): Promise<any[]> {
    let [calls, pageSize] = this.makeCalls(args)
    if (calls.length === 0) return []

    const pages = Array.from(splitArray(pageSize, calls))
    const results = await Promise.all(
        pages.flatMap(async (page) => {
            const {returnData} = await this.eth_call(aggregate, {calls: page})
            return returnData.map((data, i) => page[i].func.decodeResult(data)) 
        })
    )

    return results
  }

  tryAggregate<TF extends AnyFunc>(
    func: TF,
    address: string,
    calls: FunctionArguments<TF>[],
    pageSize?: number
  ): Promise<MulticallResult<TF>[]>

  tryAggregate<TF extends AnyFunc>(
    func: TF,
    calls: (readonly [address: string, args: FunctionArguments<TF>])[],
    pageSize?: number
  ): Promise<MulticallResult<TF>[]>

  tryAggregate(
    calls: AggregateTuple[],
    pageSize?: number
  ): Promise<MulticallResult<any>[]>

  async tryAggregate(...args: any[]): Promise<any[]> {
    let [calls, pageSize] = this.makeCalls(args)
    if (calls.length === 0) return []

    const pages = Array.from(splitArray(pageSize, calls))
    const results = await Promise.all(
        pages.flatMap(async (page) => {
            const response = await this.eth_call(tryAggregate, {
                requireSuccess: false,
                calls: page,
            })
            return response.map((res, i) => {
              if (res.success) {
                try {
                  return {
                    success: true,
                    value: page[i].func.decodeResult(res.returnData)
                  }
                } catch (err: any) {
                  return {success: false, returnData: res.returnData}
                }
              } else {
                return {success: false}
              }
            }) 
        })
    )

    return results
  }

  private makeCalls(args: any[]): [calls: Call[], page: number] {
    let page = typeof args[args.length - 1] == 'number' ? args.pop()! : Number.MAX_SAFE_INTEGER
    switch (args.length) {
      case 1: {
        let list: AggregateTuple[] = args[0]
        let calls: Call[] = new Array(list.length)
        for (let i = 0; i < list.length; i++) {
          let [func, address, args] = list[i]
          calls[i] = {target: address, callData: func.encode(args), func}
        }
        return [calls, page]
      }
      case 2: {
        let func: AnyFunc = args[0]
        let list: [address: string, args: any][] = args[1]
        let calls: Call[] = new Array(list.length)
        for (let i = 0; i < list.length; i++) {
          let [address, args] = list[i]
          calls[i] = {target: address, callData: func.encode(args), func}
        }
        return [calls, page]
      }
      case 3: {
        let func: AnyFunc = args[0]
        let address: string = args[1]
        let list: any = args[2]
        let calls: Call[] = new Array(list.length)
        for (let i = 0; i < list.length; i++) {
          let args = list[i]
          calls[i] = {target: address, callData: func.encode(args), func}
        }
        return [calls, page]
      }
      default:
        throw new Error(`Unexpected number of arguments: ${args.length}`)
    }
  }
}

function* splitSlice(maxSize: number, beg: number, end?: number): Iterable<[beg: number, end: number]> {
  maxSize = Math.max(1, maxSize)
  end = end ?? Number.MAX_SAFE_INTEGER
  while (beg < end) {
      let left = end - beg
      let splits = Math.ceil(left / maxSize)
      let step = Math.round(left / splits)
      yield [beg, beg + step]
      beg += step
  }
}

function* splitArray<T>(maxSize: number, arr: T[]): Iterable<T[]> {
  if (arr.length <= maxSize) {
      yield arr
  } else {
      for (let [beg, end] of splitSlice(maxSize, 0, arr.length)) {
          yield arr.slice(beg, end)
      }
  }
}