export interface Chain {
    getEventHash(name: string): string
    getCallHash(name: string): string
}

export interface ChainContext {
    _chain: Chain
}

export interface Event {
    name: string
    args: any
}

export interface Call {
    name: string
    args: any
}
