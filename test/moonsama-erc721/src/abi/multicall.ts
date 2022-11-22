import * as ethers from 'ethers'
import {ContractBase, Func} from './abi.support'


const abi = new ethers.utils.Interface([
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


const aggregate = new Func<[calls: Call[]], {}, {blockNumber: ethers.BigNumber, returnData: string[]}>(
    abi, abi.getSighash('aggregate')
)


const try_aggregate = new Func<[requireSuccess: boolean, calls: Array<[target: string, callData: string]>], {}, Array<{success: boolean, returnData: string}>>(
    abi, abi.getSighash('tryAggregate')
)


export type MulticallResult<T> = {
    success: true
    value: T
} | {
    success: false
    value?: undefined
}


export class Multicall extends ContractBase {
    aggregate<Args extends any[], R>(func: Func<Args, {}, R>, address: string, calls: Args[]): Promise<R[]>
    aggregate<Args extends any[], R>(func: Func<Args, {}, R>, calls: [address: string, args: Args][]): Promise<R[]>
    aggregate(calls: [func: AnyFunc, address: string, args: any[]][]): Promise<any[]>
    async aggregate(...args: any[]): Promise<any[]> {
        let [calls, funcs] = this.makeCalls(args)
        let {returnData} = await this.eth_call(aggregate, [calls])
        let results = new Array(returnData.length)
        for (let i = 0; i < returnData.length; i++) {
            results[i] = funcs[i].decodeResult(returnData[i])
        }
        return results
    }

    tryAggregate<Args extends any[], R>(func: Func<Args, {}, R>, address: string, calls: Args[]): Promise<MulticallResult<R>[]>
    tryAggregate<Args extends any[], R>(func: Func<Args, {}, R>, calls: [address: string, args: Args][]): Promise<MulticallResult<R>[]>
    tryAggregate(calls: [func: AnyFunc, address: string, args: any[]][]): Promise<MulticallResult<any>[]>
    async tryAggregate(...args: any[]): Promise<any[]> {
        let [calls, funcs] = this.makeCalls(args)
        let response = await this.eth_call(try_aggregate, [false, calls])
        let results = new Array(response.length)
        for (let i = 0; i < response.length; i++) {
            let res = response[i]
            if (res.success) {
                results[i] = {
                    success: true,
                    value: funcs[i].decodeResult(res.returnData)
                }
            } else {
                results[i] = {success: false}
            }
        }
        return results
    }

    private makeCalls(args: any[]): [calls: Call[], funcs: AnyFunc[]] {
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
                return [calls, funcs]
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
                return [calls, funcs]
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
                return [calls, funcs]
            }
            default:
                throw new Error('unexpected number of arguments')
        }
    }
}
