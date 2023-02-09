import {w3cwebsocket as WebSocket} from "websocket"
import {RpcErrorInfo, RpcResponse} from "./rpc"

const MEGABYTE = 1024 * 1024


interface Handle {
    resolve(val?: any): void
    reject(err: Error): void
}


type Call = string | [method: string] | [method: string, params?: unknown[]]


export class RpcClient {
    private ids = 0
    private requests: Record<number | string, Handle> = {}
    private sendQueue: string[] = []
    private ws: WebSocket
    private connection: Promise<void>
    private error?: Error
    private _connected = false
    public onclose?: (err: Error) => void

    constructor(private url: string) {
        this.ws = new WebSocket(this.url, undefined, undefined, undefined, undefined, {
            // default: true
            fragmentOutgoingMessages: true,
            // default: 16K (bump, the Node has issues with too many fragments, e.g. on setCode)
            fragmentationThreshold: MEGABYTE,
            // default: 1MiB (also align with maxReceivedMessageSize)
            maxReceivedFrameSize: 24 * MEGABYTE,
            // default: 8MB (however Polkadot api.query.staking.erasStakers.entries(356) is over that, 16M is ok there)
            maxReceivedMessageSize: 24 * MEGABYTE
        })

        this.connection = new Promise((resolve, reject) => {
            this.ws.onopen = () => {
                this._connected = true
                for (let i = 0; i < this.sendQueue.length; i++) {
                    this.ws.send(this.sendQueue[i])
                }
                this.sendQueue.length = 0
                resolve()
            }

            this.ws.onerror = () => {
                this.setError(new RpcConnectionError('Socket error'))
                reject(this.error)
            }

            this.ws.onclose = () => {
                let err = this.error || new RpcConnectionError('Connection terminated')
                this.setError(err)
                reject(err)
                this.onclose?.(err)
            }
        })

        this.connection.catch(err => {})

        this.ws.onmessage = event => {
            try {
                this.onMessage(event.data)
            } catch(e: any) {
                this.close(e)
            }
        }
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
        let h = this.requests[res.id]
        if (h == null) {
            throw new RpcProtocolError(undefined, `Got response for unknown request ${res.id}`)
        }
        delete this.requests[res.id]
        if (res.error) {
            h.reject(new RpcError(res.error))
        } else {
            h.resolve(res.result)
        }
    }

    close(err?: Error): void {
        if (this.error) return
        err = err || new RpcConnectionError('Connection was closed')
        this.setError(err)
        let code: number | undefined
        if (err instanceof RpcProtocolError) {
            code = err.code
        }
        this.ws.close(code)
    }

    private setError(err: Error): void {
        if (this.error) return
        this.error = err
        this.rejectRequests(err)
        this.sendQueue.length = 0
    }

    private rejectRequests(err: Error): void {
        for (let key in this.requests) {
            this.requests[key].reject(err)
        }
        this.requests = {}
    }

    connect(): Promise<void> {
        if (this.error) return Promise.reject(this.error)
        return this.connection
    }

    get isConnected(): boolean {
        return this._connected && this.error == null
    }

    call<T=any>(method: string, params?: unknown[]): Promise<T> {
        return this._callWithId(this.ids++, method, params)
    }

    _callWithId<T=any>(id: number| string, method: string, params?: unknown[]): Promise<T> {
        return new Promise((resolve, reject) => {
            if (this.error) return reject(this.error)
            let payload = JSON.stringify({
                id,
                jsonrpc: '2.0',
                method,
                params
            })
            this.requests[id] = {resolve, reject}
            this.send(payload)
        })
    }

    batch(calls: Call[]): Promise<(any | Error)[]> {
        return new Promise((resolve, reject) => {
            if (this.error) return reject(this.error)
            if (calls.length == 0) return resolve([])
            let results: any[] = new Array(calls.length)
            let received = 0
            let offset = this.ids

            function receive(id: number, error?: Error, result?: unknown): void {
                results[id - offset] = error || result
                received += 1
                if (results.length == received) {
                    resolve(results)
                }
            }

            let requests: Record<number, Handle> = {}
            let msg = calls.map(call => {
                let method: string
                let params: unknown[] | undefined
                if (typeof call == 'string') {
                    method = call
                } else {
                    method = call[0]
                    params = call[1]
                }
                let id = this.ids++
                requests[id] = {
                    resolve(val: unknown) {
                        receive(id, undefined, val)
                    },
                    reject(err: Error) {
                        receive(id, err)
                    }
                }
                return {
                    id,
                    jsonrpc: '2.0',
                    method,
                    params
                }
            })
            let payload = JSON.stringify(msg)
            Object.assign(this.requests, requests)
            this.send(payload)
        })
    }

    private send(payload: string): void {
        if (this.ws.readyState == WebSocket.OPEN) {
            this.ws.send(payload)
        } else {
            this.sendQueue.push(payload)
        }
    }
}


/**
 * Server violated RPC protocol
 */
export class RpcProtocolError extends Error {
    constructor(public readonly code?: number, msg?: string) {
        super(msg)
    }

    get name(): string {
        return 'RpcProtocolError'
    }
}


/**
 * Received error message from server
 */
export class RpcError extends Error {
    public readonly code: number
    public readonly data?: number | string

    constructor(info: RpcErrorInfo) {
        super(info.message)
        this.code = info.code
        this.data = info.data
    }

    get name(): string {
        return 'RpcError'
    }
}


/**
 * Problem with websocket connection
 */
export class RpcConnectionError extends Error {
    get name(): string {
        return 'RpcConnectionError'
    }
}
