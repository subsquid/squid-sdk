import {HttpClient} from '@subsquid/http-client'
import assert from 'assert'


interface RpcRequest {
    id: number
    jsonrpc: '2.0'
    method: string
    params?: unknown[]
}


interface RpcResponse {
    id: number
    jsonrpc: '2.0'
    result?: unknown
    error?: RpcErrorInfo
}


interface RpcErrorInfo {
    code: number
    data?: number | string
    message: string
}


export class RpcError extends Error {
    constructor(
        public readonly info: RpcErrorInfo,
        public readonly call: RpcCall
    ) {
        super('rpc error')
    }
}


export interface RpcCall {
    method: string
    params?: unknown[]
}


export class RpcClient {
    private ids = 0

    constructor(private http: HttpClient) {}

    async call<T>(method: string, params?: unknown[]): Promise<T> {
        let call: RpcRequest = {
            id: this.ids++,
            jsonrpc: '2.0',
            method,
            params
        }

        let res: RpcResponse = await this.http.post('/', {json: call})

        if (res.error) {
            throw new RpcError(res.error, {method, params})
        } else {
            return res.result as T
        }
    }

    async batch(calls: RpcCall[]): Promise<any[]> {
        let req: RpcRequest[] = calls.map(call => {
            return {
                id: this.ids++,
                jsonrpc: '2.0',
                ...call
            }
        })

        let response: RpcResponse[] = await this.http.post('/', {json: req})

        assert(response.length == req.length)

        let result = new Array<any>(response.length)
        for (let res of response) {
            let idx = res.id - req[0].id
            if (res.error) {
                throw new RpcError(res.error, calls[idx])
            }
            result[idx] = res.result
        }
        return result
    }
}
