
export interface RpcClient {
    call<T=any>(method: string, params?: unknown[]): Promise<T>
}


export interface Chain {
    readonly client: RpcClient
}
