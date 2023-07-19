
export interface ChainContext {
    _chain: {
        runtime: {
            getEventTypeHash(name: string): string
            getCallTypeHash(name: string): string
        }
    }
}

export interface Event {
    name: string
    args: any
}

export interface Call {
    name: string
    args: any
}
