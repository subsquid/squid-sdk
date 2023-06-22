
export interface RpcClient {
    call<T=any>(method: string, params?: unknown[]): Promise<T>
    batchCall(batch: {method: string, params?: unknown[]}[]): Promise<any[]>
}


export interface Chain {
    readonly client: RpcClient
}
