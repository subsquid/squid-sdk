
export interface RpcRequest {
    id: number
    jsonrpc: '2.0'
    method: string
    params?: unknown[]
}


export interface RpcResponse {
    id: number
    jsonrpc: '2.0'
    result?: unknown
    error?: RpcErrorInfo
}


export interface RpcErrorInfo {
    code: number
    message: string
    data?: any
}


export interface Connection {
    connect(): Promise<void>
    close(err?: Error): void
    call(req: RpcRequest, timeout?: number): Promise<RpcResponse>
    batchCall(batch: RpcRequest[], timeout?: number): Promise<RpcResponse[]>
}
