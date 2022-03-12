
export type Result<T, E> = {
    __kind: 'Ok'
    value: T
} | {
    __kind: 'Err'
    value: E
}


interface Event {
    name: string
    params: {value: unknown}[]
}


export interface EventContext {
    _chain: {
        getEventHash(eventName: string): string
        decodeEvent(event: Event): any
    }
    block: {
        height: number
    }
    event: Event
}


interface Call {
    name: string
    args: {value: unknown}[]
}


export interface CallContext {
    _chain: {
        getCallHash(name: string): string
        decodeCall(call: Call): any
    }
    block: {
        height: number
    }
    extrinsic: Call
}


let showLatestWarning = true
export function deprecateLatest(): void {
    if (showLatestWarning) {
        showLatestWarning = false
        console.warn(`.isLatest, .asLatest properties are deprecated, if you believe this is a mistake, please leave a comment at https://github.com/subsquid/squid/issues/9`)
    }
}


export interface StorageContext {
    _chain: {
        getStorageItemTypeHash(prefix: string, name: string): string | undefined
        getStorage(blockHash: string, prefix: string, name: string, ...args: any[]): Promise<any>
    }
    block: {
        hash: string
    }
}
