interface Runtime {
    getEventTypeHash(name: string): string
    getCallTypeHash(name: string): string
}


export interface Event {
    name: string
    args: any
    block: {
        _runtime: Runtime
    }
}


export interface Call {
    name: string
    args: any
    block: {
        _runtime: Runtime
    }
}
