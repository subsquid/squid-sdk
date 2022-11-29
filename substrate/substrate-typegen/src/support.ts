
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
    queryStorage(blockHash: string, prefix: string, name: string, ...args: any[]): Promise<any[]>
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
