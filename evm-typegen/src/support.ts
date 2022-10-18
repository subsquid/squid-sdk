import assert from 'assert'
import {Interface} from '@ethersproject/abi'

export interface EvmLog {
    data: string
    topics: string[]
}

export interface EvmTransaction {
    data: string
}

interface Chain {
    client: {
        call: <T = any>(method: string, params?: unknown[]) => Promise<T>
    }
}

export interface ChainContext {
    _chain: Chain
}

export interface BlockContext {
    _chain: Chain
    block: Block
}

export interface Block {
    height: number
}

export abstract class BaseContract {
    private readonly _chain: Chain
    private readonly blockHeight: number

    protected readonly _abi!: Interface

    readonly address: string

    constructor(ctx: BlockContext, blockOrAddress: Block | string, address?: string) {
        this._chain = ctx._chain
        if (typeof blockOrAddress === 'string') {
            this.blockHeight = ctx.block.height
            this.address = blockOrAddress.toLowerCase()
        } else {
            assert(address != null)
            this.blockHeight = blockOrAddress.height
            this.address = address.toLowerCase()
        }
    }

    protected async call(name: string, args: any[]): Promise<any> {
        const data = this._abi.encodeFunctionData(name, args)
        const result = await this._chain.client.call('eth_call', [{to: this.address, data}, this.blockHeight])
        const decoded = this._abi.decodeFunctionResult(name, result)
        return decoded.length > 1 ? decoded : decoded[0]
    }
}

export class BaseFunctions {
    static _abi: Interface

    static decodeFunction(signature: string, data: EvmTransaction | string): any {
        return this._abi.decodeFunctionData(signature, typeof data === 'string' ? data : data.data)
    }
}

export class BaseEvents {
    static _abi: Interface

    static decodeEvent(signature: string, data: EvmLog): any {
        return this._abi.decodeEventLog(signature, data.data || '', data.topics)
    }

    static a = {
        function () {

        }
    }
}
