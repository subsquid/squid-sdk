import {Func, StorageItem} from '@subsquid/evm-support'

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

export interface Chain {
    client: {
        call: <T = any>(method: string, params?: unknown[]) => Promise<T>
    }
}

export class ContractBase {
    private readonly _chain: Chain
    private readonly blockHeight: number
    readonly address: string

    constructor(ctx: BlockContext, address: string)
    constructor(ctx: ChainContext, block: Block, address: string)
    constructor(ctx: BlockContext, blockOrAddress: Block | string, address?: string) {
        this._chain = ctx._chain
        if (typeof blockOrAddress === 'string') {
            this.blockHeight = ctx.block.height
            this.address = blockOrAddress.toLowerCase()
        } else {
            if (address == null) {
                throw new Error('missing contract address')
            }
            this.blockHeight = blockOrAddress.height
            this.address = address.toLowerCase()
        }
    }

    async eth_call<Args extends any[], FieldArgs, Result>(
        func: Func<Args, FieldArgs, Result>,
        args: Args
    ): Promise<Result> {
        let data = func.encode(args)
        let result = await this._chain.client.call('eth_call', [
            {to: this.address, data},
            '0x' + this.blockHeight.toString(16),
        ])
        return func.decodeResult(result)
    }

    async eth_getStorage<V>(item: StorageItem<V>): Promise<V> {
        let result = await this._chain.client.call('eth_getStorageAt', [
            this.address,
            item.key,
            '0x' + this.blockHeight.toString(16),
        ])
        return item.decode(result)
    }
}
