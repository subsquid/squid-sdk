import * as ethers from 'ethers'
import {ContractBase, Func} from './abi.support'


const abi = new ethers.Interface([
    {
        type: 'function',
        name: 'aggregate',
        stateMutability: 'nonpayable',
        inputs: [
            {
                name: 'calls',
                type: 'tuple[]',
                components: [
                    {name: 'target', type: 'address'},
                    {name: 'callData', type: 'bytes'},
                ]
            }
        ],
        outputs: [
            {name: 'blockNumber', type: 'uint256'},
            {name: 'returnData', type: 'bytes[]'},
        ]
    },
    {
        name: 'tryAggregate',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            {name: 'requireSuccess', type: 'bool'},
            {
                name: 'calls',
                type: 'tuple[]',
                components: [
                    {name: 'target', type: 'address'},
                    {name: 'callData', type: 'bytes'},
                ]
            }
        ],
        outputs: [
            {
                name: 'returnData',
                type: 'tuple[]',
                components: [
                    {name: 'success', type: 'bool'},
                    {name: 'returnData', type: 'bytes'},
                ]
            },
        ]
    }
])


type AnyFunc = Func<any, {}, any>
type Call = [address: string, bytes: string]


const aggregate = new Func<[calls: Call[]], {}, {blockNumber: bigint, returnData: string[]}>(
    abi, abi.getFunction('aggregate')!.selector
)


const try_aggregate = new Func<[requireSuccess: boolean, calls: Array<[target: string, callData: string]>], {}, Array<{success: boolean, returnData: string}>>(
    abi, abi.getFunction('tryAggregate')!.selector
)


export type MulticallResult<T> = {
    success: true
    value: T
} | {
    success: false
    returnData?: string
    value?: undefined
}


export class Multicall extends ContractBase {
    static aggregate = aggregate
    static try_aggregate = try_aggregate

    aggregate<Args extends any[], R>(
        func: Func<Args, {}, R>,
        address: string,
        calls: Args[],
        paging?: number
    ): Promise<R[]>

    aggregate<Args extends any[], R>(
        func: Func<Args, {}, R>,
        calls: [address: string, args: Args][],
        paging?: number
    ): Promise<R[]>

    aggregate(
        calls: [func: AnyFunc, address: string, args: any[]][],
        paging?: number
    ): Promise<any[]>

    async aggregate(...args: any[]): Promise<any[]> {
        let [calls, funcs, page] = this.makeCalls(args)
        let size = calls.length
        let results = new Array(size)
        for (let [from, to] of splitIntoPages(size, page)) {
            let {returnData} = await this.eth_call(aggregate, [calls.slice(from, to)])
            for (let i = from; i < to; i++) {
                let data = returnData[i - from]
                results[i] = funcs[i].decodeResult(data)
            }
        }
        return results
    }

    tryAggregate<Args extends any[], R>(
        func: Func<Args, {}, R>,
        address: string,
        calls: Args[],
        paging?: number
    ): Promise<MulticallResult<R>[]>

    tryAggregate<Args extends any[], R>(
        func: Func<Args, {}, R>,
        calls: [address: string, args: Args][],
        paging?: number
    ): Promise<MulticallResult<R>[]>

    tryAggregate(
        calls: [func: AnyFunc, address: string, args: any[]][],
        paging?: number
    ): Promise<MulticallResult<any>[]>

    async tryAggregate(...args: any[]): Promise<any[]> {
        let [calls, funcs, page] = this.makeCalls(args)
        let size = calls.length
        let results = new Array(size)
        for (let [from, to] of splitIntoPages(size, page)) {
            let response = await this.eth_call(try_aggregate, [false, calls.slice(from, to)])
            for (let i = from; i < to; i++) {
                let res = response[i - from]
                if (res.success) {
                    try {
                        results[i] = {
                            success: true,
                            value: funcs[i].decodeResult(res.returnData)
                        }
                    } catch(err: any) {
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
        let page = typeof args[args.length-1] == 'number' ? args.pop()! : Number.MAX_SAFE_INTEGER
        switch(args.length) {
            case 1: {
                let list: [func: AnyFunc, address: string, args: any[]][] = args[0]
                let calls = new Array(list.length)
                let funcs = new Array(list.length)
                for (let i = 0; i < list.length; i++) {
                    let [func, address, args] = list[i]
                    calls[i] = [address, func.encode(args)]
                    funcs[i] = func
                }
                return [calls, funcs, page]
            }
            case 2: {
                let func: AnyFunc = args[0]
                let list: [address: string, args: any[]][] = args[1]
                let calls = new Array(list.length)
                let funcs = new Array(list.length)
                for (let i = 0; i < list.length; i++) {
                    let [address, args] = list[i]
                    calls[i] = [address, func.encode(args)]
                    funcs[i] = func
                }
                return [calls, funcs, page]
            }
            case 3: {
                let func: AnyFunc = args[0]
                let address: string = args[1]
                let list: any[][] = args[2]
                let calls = new Array(list.length)
                let funcs = new Array(list.length)
                for (let i = 0; i < list.length; i++) {
                    let args = list[i]
                    calls[i] = [address, func.encode(args)]
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
