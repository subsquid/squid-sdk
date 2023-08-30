import type {Runtime} from '@subsquid/substrate-runtime'


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
