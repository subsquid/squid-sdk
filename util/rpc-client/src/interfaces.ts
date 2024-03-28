export interface RpcCall {
    method: string
    params?: unknown[]
}


export interface RpcRequest extends RpcCall {
    id: number
    jsonrpc: '2.0'
}


export interface RpcNotification {
    jsonrpc: '2.0'
    method: string
    params?: any
}


export interface RpcResponse {
    id: number
    jsonrpc: '2.0'
    result?: unknown
    error?: RpcErrorInfo
}


export type RpcIncomingMessage = RpcNotification | RpcResponse


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


export type HttpHeaders = Record<string, string>
