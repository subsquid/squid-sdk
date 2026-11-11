import {createServer, type Server} from 'node:http'
import type {AddressInfo} from 'node:net'

export interface JsonRpcRequest {
    id: unknown
    method: string
    params?: unknown[]
}

/** A JSON-RPC reply body: `{result}` or `{error}`, without `jsonrpc` and `id`. */
export type JsonRpcReply = {result: unknown} | {error: {code: number; message: string}}

/**
 * Serves JSON-RPC over HTTP on a free local port, answering single and batch requests with
 * `handle`. Returns the URL and a function that stops the server.
 */
export async function serveJsonRpc(
    handle: (request: JsonRpcRequest) => JsonRpcReply,
): Promise<{url: string; close: () => Promise<void>}> {
    let reply = (request: JsonRpcRequest) => ({jsonrpc: '2.0', id: request.id, ...handle(request)})
    let server: Server = createServer((req, res) => {
        let body = ''
        req.setEncoding('utf8')
        req.on('data', (chunk) => {
            body += chunk
        })
        req.on('end', () => {
            let response: unknown
            try {
                let request = JSON.parse(body)
                response = Array.isArray(request) ? request.map(reply) : reply(request)
            } catch (err) {
                response = {jsonrpc: '2.0', id: null, error: {code: -32700, message: String(err)}}
            }
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify(response))
        })
    })
    await new Promise<void>((resolve, reject) => {
        server.once('error', reject)
        server.listen(0, '127.0.0.1', () => {
            server.off('error', reject)
            resolve()
        })
    })
    return {
        url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
        close: () =>
            new Promise<void>((resolve, reject) => {
                server.close((err) => (err ? reject(err) : resolve()))
                server.closeAllConnections()
            }),
    }
}
