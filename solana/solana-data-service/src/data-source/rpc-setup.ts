import {RpcClient} from '@subsquid/rpc-client'
import {Rpc, RpcApi} from '@subsquid/solana-rpc'


export function createRpc(url: string): RpcApi {
    let client = new RpcClient({
        url,
        capacity: Number.MAX_SAFE_INTEGER,
        fixUnsafeIntegers: true,
        requestTimeout: 20000,
        retryAttempts: 5
    })
    return new Rpc(client)
}
