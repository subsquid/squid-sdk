import assert from 'assert'

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

    protected readonly _abi!: any

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
        const fragment = this._abi.getFunction(name)
        const data = this._abi.encodeFunctionData(fragment, args)
        const result = await this._chain.client.call('eth_call', [{to: this.address, data}, this.blockHeight])
        const decoded = this._abi.decodeFunctionResult(fragment, result)
        return decoded.length > 1 ? decoded : decoded[0]
    }
}

export function decodeEvent(abi: any, signature: string, data: EvmLog): any {
    return abi.decodeEventLog(abi.getEvent(signature), data.data || '', data.topics)
}

export function decodeFunction(abi: any, signature: string, data: EvmTransaction | string): any {
    return abi.decodeFunctionData(signature, typeof data === 'string' ? data : data.data)
}
