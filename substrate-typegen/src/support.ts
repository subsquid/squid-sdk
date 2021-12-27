
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
