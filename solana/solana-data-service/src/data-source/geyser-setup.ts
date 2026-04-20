import {RpcClient} from '@subsquid/rpc-client'
import {Geyser} from './geyser'


export interface GeyserOptions {
    geyserProxy: string
    geyserBlockQueueSize?: number
}


export function createGeyser(options: GeyserOptions): Geyser {
    let rpc = new RpcClient({
        url: options.geyserProxy,
        requestTimeout: 10_000
    })
    return new Geyser(rpc, options.geyserBlockQueueSize)
}
