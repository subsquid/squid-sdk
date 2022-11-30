
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


export interface Chain {
    getEventHash(eventName: string): string
    decodeEvent(event: Event): any
    getCallHash(name: string): string
    decodeCall(call: Call): any
    getStorageItemTypeHash(prefix: string, name: string): string | undefined
    getStorage(blockHash: string, prefix: string, name: string, ...args: any[]): Promise<any>
    queryStorage2(blockHash: string, prefix: string, name: string, keyList?: any[]): Promise<any[]>
    getKeys(blockHash: string, prefix: string, name: string, ...args: any[]): Promise<any[]>
    getPairs(blockHash: string, prefix: string, name: string, ...args: any[]): Promise<any[]>
    getKeysPaged(pageSize: number, blockHash: string, prefix: string, name: string, ...args: any[]): AsyncIterable<any[]>
    getPairsPaged(pageSize: number, blockHash: string, prefix: string, name: string, ...args: any[]): AsyncIterable<[key: any, value: any][]>
    getConstantTypeHash(pallet: string, name: string): string | undefined
    getConstant(pallet: string, name: string): any
}


export interface ChainContext {
    _chain: Chain
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
}


export class StorageBase {
    protected readonly _chain: Chain
    protected readonly blockHash: string

    constructor(ctx: BlockContext)
    constructor(ctx: ChainContext, block: Block)
    constructor(ctx: BlockContext, block?: Block) {
        block = block || ctx.block
        this.blockHash = block.hash
        this._chain = ctx._chain
    }

    protected getPrefix(): string {
        throw new Error('Not implemented')
    }

    protected getName(): string {
        throw new Error('Not implemented')
    }

    protected getTypeHash(): string | undefined {
        return this._chain.getStorageItemTypeHash(this.getPrefix(), this.getName())
    }

    /**
     * Checks whether the storage item is defined for the current chain version.
     */
    get isExists(): boolean {
        return this.getTypeHash() != null
    }

    protected get(...args: any[]): Promise<any> {
        return this._chain.getStorage(this.blockHash, this.getPrefix(), this.getName(), ...args)
    }

    protected getMany(keyList: any[]): Promise<any[]> {
        return this._chain.queryStorage2(this.blockHash, this.getPrefix(), this.getName(), keyList)
    }

    protected getAll(): Promise<any[]> {
        return this._chain.queryStorage2(this.blockHash, this.getPrefix(), this.getName())
    }

    protected getKeys(...args: any[]): Promise<any[]> {
        return this._chain.getKeys(this.blockHash, this.getPrefix(), this.getName(), ...args)
    }

    protected getKeysPaged(pageSize: number, ...args: any[]): AsyncIterable<any[]> {
        return this._chain.getKeysPaged(pageSize, this.blockHash, this.getPrefix(), this.getName(), ...args)
    }

    protected getPairs(...args: any[]): Promise<[k: any, v: any][]> {
        return this._chain.getPairs(this.blockHash, this.getPrefix(), this.getName(), ...args)
    }

    protected getPairsPaged(pageSize: number, ...args: any[]): AsyncIterable<[k: any, v: any][]> {
        return this._chain.getPairsPaged(pageSize, this.blockHash, this.getPrefix(), this.getName(), ...args)
    }
}
