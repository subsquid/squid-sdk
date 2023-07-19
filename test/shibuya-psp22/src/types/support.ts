export type Result<T, E> = {
    __kind: 'Ok'
    value: T
} | {
    __kind: 'Err'
    value: E
}


export type Option<T> = {
    __kind: 'Some',
    value: T
} | {
    __kind: 'None'
}


export interface Runtime {
    getCallTypeHash(name: string): string
    decodeJsonCall(call: {name: string, args: any}): any
    getEventTypeHash(name: string): string
    decodeJsonEvent(event: {name: string, args: any}): any
    getConstantTypeHash(pallet: string, name: string): string | undefined
    getConstant(pallet: string, name: string): any
    getStorageItemTypeHash(prefix: string, name: string): string | undefined
    getStorage(rpc: RpcClient, blockHash: string, prefix: string, name: string, ...args: any[]): Promise<any>
    queryStorage(rpc: RpcClient, blockHash: string, prefix: string, name: string, keyList?: any[]): Promise<any[]>
    getKeys(rpc: RpcClient, blockHash: string, prefix: string, name: string, ...args: any[]): Promise<any[]>
    getPairs(rpc: RpcClient, blockHash: string, prefix: string, name: string, ...args: any[]): Promise<any[]>
    getKeysPaged(rpc: RpcClient, pageSize: number, blockHash: string, prefix: string, name: string, ...args: any[]): AsyncIterable<any[]>
    getPairsPaged(rpc: RpcClient, pageSize: number, blockHash: string, prefix: string, name: string, ...args: any[]): AsyncIterable<[key: any, value: any][]>
}


interface RpcClient {
    call(method: string, params?: any[]): Promise<any>
    batchCall(calls: {method: string, params?: any[]}[]): Promise<any[]>
}


export interface ChainContext {
    _chain: Chain
}


export interface Chain {
    at(height: number): Chain
    runtime: Runtime
    rpc: RpcClient
}


export interface Event {
    name: string
    args: any
}


export interface EventContext extends ChainContext {
    event: Event
}


export interface Call {
    name: string
    args: any
}


export interface CallContext extends ChainContext {
    call: Call
}


export interface BlockContext extends ChainContext {
    block: Block
}


export interface Block {
    hash: string
    height: number
}


export class StorageBase {
    protected readonly _chain: Chain
    protected readonly blockHash: string

    constructor(ctx: BlockContext)
    constructor(ctx: ChainContext, block: Block)
    constructor(ctx: BlockContext, block?: Block) {
        block = block || ctx.block
        this._chain = ctx._chain.at(block.height)
        this.blockHash = block.hash
    }

    protected getPrefix(): string {
        throw new Error('Not implemented')
    }

    protected getName(): string {
        throw new Error('Not implemented')
    }

    protected getTypeHash(): string | undefined {
        return this._chain.runtime.getStorageItemTypeHash(this.getPrefix(), this.getName())
    }

    /**
     * Checks whether the storage item is defined for the current chain version.
     */
    get isExists(): boolean {
        return this.getTypeHash() != null
    }

    protected get(...args: any[]): Promise<any> {
        return this._chain.runtime.getStorage(this._chain.rpc, this.blockHash, this.getPrefix(), this.getName(), ...args)
    }

    protected getMany(keyList: any[]): Promise<any[]> {
        return this._chain.runtime.queryStorage(this._chain.rpc, this.blockHash, this.getPrefix(), this.getName(), keyList)
    }

    protected getAll(): Promise<any[]> {
        return this._chain.runtime.queryStorage(this._chain.rpc, this.blockHash, this.getPrefix(), this.getName())
    }

    protected getKeys(...args: any[]): Promise<any[]> {
        return this._chain.runtime.getKeys(this._chain.rpc, this.blockHash, this.getPrefix(), this.getName(), ...args)
    }

    protected getKeysPaged(pageSize: number, ...args: any[]): AsyncIterable<any[]> {
        return this._chain.runtime.getKeysPaged(this._chain.rpc, pageSize, this.blockHash, this.getPrefix(), this.getName(), ...args)
    }

    protected getPairs(...args: any[]): Promise<[k: any, v: any][]> {
        return this._chain.runtime.getPairs(this._chain.rpc, this.blockHash, this.getPrefix(), this.getName(), ...args)
    }

    protected getPairsPaged(pageSize: number, ...args: any[]): AsyncIterable<[k: any, v: any][]> {
        return this._chain.runtime.getPairsPaged(this._chain.rpc, pageSize, this.blockHash, this.getPrefix(), this.getName(), ...args)
    }
}
