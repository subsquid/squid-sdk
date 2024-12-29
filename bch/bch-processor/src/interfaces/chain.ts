import { TransactionBCHWithAddress } from "../ds-rpc/rpc.js"
import { Bytes } from "./base.js"

export interface RpcClient {
    call<T=any>(method: string, params?: unknown[]): Promise<T>
    batchCall(batch: {method: string, params?: unknown[]}[]): Promise<any[]>
    getRawTransaction(hash: Bytes): Promise<string>
    getTransaction(hash: Bytes): Promise<TransactionBCHWithAddress>
}


export interface Chain {
    readonly client: RpcClient
}
