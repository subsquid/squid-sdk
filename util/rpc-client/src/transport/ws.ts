import assert from 'assert'
import {w3cwebsocket as WebSocket} from 'websocket'
import {RpcConnectionError, RpcProtocolError} from '../errors'
import {Connection, RpcRequest, RpcResponse} from '../interfaces'


const MB = 1024 * 1024


interface RequestHandle {
    resolve(val: RpcResponse): void
    reject(err: Error): void
}


export class WsConnection implements Connection {
    private _ws?: WebSocket
    private connected = false
    private requests = new Map<number, RequestHandle>()

    constructor(private url: string) {}

    connect(): Promise<void> {
        return new Promise<void>((resolve, reject) => {
            if (this.connected) return resolve()
            if (this._ws) return reject(new Error('Already connecting'))

            let ws = this._ws = new WebSocket(this.url, undefined, undefined, undefined, undefined, {
                // default: true
                fragmentOutgoingMessages: true,
                // default: 16K (bump, the Node has issues with too many fragments, e.g. on setCode)
                fragmentationThreshold: MB,
                // default: 1MiB (also align with maxReceivedMessageSize)
                maxReceivedFrameSize: 24 * MB,
                // default: 8MB (however Polkadot api.query.staking.erasStakers.entries(356) is over that, 16M is ok there)
                maxReceivedMessageSize: 24 * MB
            })

            ws.onopen = () => {
                if (this._ws !== ws) return
                this.connected = true
                resolve()
            }

            ws.onerror = () => {
                if (this._ws !== ws) return
                let err = new RpcConnectionError('Socket error')
                this.close(err)
                reject(err)
            }

            ws.onclose = () => {
                if (this._ws !== ws) return
                let err = new RpcConnectionError('Socket connection terminated')
                this.clear(err)
                reject(err)
            }

            ws.onmessage = event => {
                if (this._ws !== ws) return
                try {
                    this.onMessage(event.data)
                } catch(e: any) {
                    this.close(e)
                }
            }
        })
    }

    private clear(err: Error): void {
        for (let handle of this.requests.values()) {
            handle.reject(err)
        }
        this.requests.clear()
        this._ws = undefined
        this.connected = false
    }

    close(err?: Error): void {
        if (this._ws == null) return
        let code: number | undefined
        let reason: string | undefined
        if (err instanceof RpcProtocolError) {
            code = err.code
            reason = err.message
        }
        this._ws.close(code, reason)
        this.clear(err || new RpcConnectionError('Connection was closed'))
    }

    private onMessage(data: string | Buffer | ArrayBuffer): void {
        // https://github.com/Luka967/websocket-close-codes
        if (typeof data != 'string') {
            throw new RpcProtocolError(1003, 'Received non-text frame')
        }
        let msg: RpcResponse | RpcResponse[]
        try {
            msg = JSON.parse(data)
        } catch(e: any) {
            throw new RpcProtocolError(1007, 'Received invalid JSON message')
        }
        if (Array.isArray(msg)) {
            for (let i = 0; i < msg.length; i++) {
                this.handleResponse(msg[i])
            }
        } else {
            this.handleResponse(msg)
        }
    }

    private handleResponse(res: RpcResponse): void {
        // TODO: more strictness, more validation
        let h = this.requests.get(res.id)
        if (h == null) {
            throw new RpcProtocolError(1008, `Got response for unknown request ${res.id}`)
        }
        this.requests.delete(res.id)
        h.resolve(res)
    }

    private ws(): WebSocket {
        assert(this.connected)
        assert(this._ws != null)
        return this._ws
    }

    call(req: RpcRequest, timeout?: number): Promise<RpcResponse> {
        return this.addTimeout(timeout, new Promise((resolve, reject) => {
            this.ws().send(JSON.stringify(req))
            this.requests.set(req.id, {resolve, reject})
        }))
    }

    batchCall(batch: RpcRequest[], timeout?: number): Promise<RpcResponse[]> {
        return this.addTimeout(timeout, new Promise((resolve, reject) => {
            if (batch.length == 0) return resolve([])

            this.ws().send(JSON.stringify(batch))

            let handle: BatchHandle = {
                resolve,
                reject,
                results: new Array(batch.length),
                pending: batch.length
            }

            for (let i = 0; i < batch.length; i++) {
                this.requests.set(batch[i].id, new BatchItemHandle(handle, i))
            }
        }))
    }

    private addTimeout<T>(ms: number | undefined, promise: Promise<T>): Promise<T> {
        if (!ms) return promise
        return new Promise<T>((resolve, reject) => {
            let timer = setTimeout(() => {
                reject(
                    new RpcConnectionError(`Request timed out after ${ms} ms`)
                )
                this.close(
                    new RpcConnectionError('Closing connection, because one of requests timed out')
                )
            }, ms)
            promise.finally(() => clearTimeout(timer)).then(resolve, reject)
        })
    }
}


interface BatchHandle {
    resolve(results: RpcResponse[]): void
    reject(err: Error): void
    results: RpcResponse[]
    pending: number
}


class BatchItemHandle {
    constructor(
        private handle: BatchHandle,
        private idx: number
    ) {}

    resolve(res: RpcResponse): void {
        this.handle.results[this.idx] = res
        this.handle.pending -= 1
        if (this.handle.pending == 0) {
            this.handle.resolve(this.handle.results)
        }
    }

    reject(err: Error): void {
        this.handle.reject(err)
    }
}
