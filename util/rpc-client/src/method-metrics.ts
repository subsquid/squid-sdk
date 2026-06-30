import {HttpError} from '@subsquid/http-client'
import {RpcError, RpcProtocolError} from './errors'
import {RpcRequest, RpcResponse} from './interfaces'


/**
 * Per-method request tally counted by batch element, keyed by a triplet of
 * labels: RPC method name, HTTP status code, and JSON-RPC error code.
 */
export class MethodMetrics {
    private items: Record<string, Record<string, Record<string, number>>> = {}

    private inc(method: string, httpCode: string, rpcCode: string): void {
        let byHttp = this.items[method]
        if (!byHttp) byHttp = this.items[method] = {}
        let byRpc = byHttp[httpCode]
        if (!byRpc) byRpc = byHttp[httpCode] = {}
        byRpc[rpcCode] = (byRpc[rpcCode] || 0) + 1
    }

    record(method: string, res: RpcResponse): void {
        let rpcCode = res.error ? res.error.code.toString() : ''
        this.inc(method, '200', rpcCode)
    }

    recordBatch(calls: RpcRequest[], responses: RpcResponse[]): void {
        for (let i = 0; i < calls.length; i++) {
            this.record(calls[i].method, responses[i])
        }
    }

    recordError(call: RpcRequest, err: unknown): void {
        let {httpCode, rpcCode} = extractTransportLabels(err)
        this.inc(call.method, httpCode, rpcCode)
    }

    recordBatchError(calls: RpcRequest[], err: unknown): void {
        let {httpCode, rpcCode} = extractTransportLabels(err)
        for (let i = 0; i < calls.length; i++) {
            this.inc(calls[i].method, httpCode, rpcCode)
        }
    }

    *getMethodMetrics() {
        for (let [method, byHttp] of Object.entries(this.items)) {
            for (let [httpCode, byRpc] of Object.entries(byHttp)) {
                for (let [rpcCode, count] of Object.entries(byRpc)) {
                    yield {method, httpCode, rpcCode, count}
                }
            }
        }
    }
}


function extractTransportLabels(err: unknown) {
    if (err instanceof HttpError) {
        return {httpCode: err.response.status.toString(), rpcCode: ''}
    }
    if (err instanceof RpcError || err instanceof RpcProtocolError) {
        return {httpCode: '200', rpcCode: err.code.toString()}
    }
    return {httpCode: '', rpcCode: ''}
}
