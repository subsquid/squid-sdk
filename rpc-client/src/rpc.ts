
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
    data?: number | string
    message: string
}
