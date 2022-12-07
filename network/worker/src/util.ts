import {isReady as isCryptoReady, waitReady as initCrypto} from '@polkadot/wasm-crypto'
import {createLogger} from '@subsquid/logger'


export {isCryptoReady, initCrypto}


export class FIFOCache<T> {
    private items: (T | undefined)[]
    private next = 0

    constructor(size: number) {
        this.items = new Array(size)
    }

    push(item: T): void {
        this.items[this.next] = item
        this.next = (this.next + 1) % this.items.length
    }

    find(test: (item: T) => any): T | undefined {
        for (let i = 0; i < this.items.length; i++) {
            let item = this.items[i]
            if (item !== undefined && test(item)) return item
        }
        return undefined
    }
}


export type Async<T> = T | Promise<T>


export function toBuffer(data: Uint8Array): Buffer {
    if (Buffer.isBuffer(data)) {
        return data
    } else {
        return Buffer.from(data.buffer, data.byteOffset, data.byteLength)
    }
}


const LOG = createLogger('sys')


export function safeCall(cb: () => void): void {
    try {
        cb()
    } catch(err: any) {
        LOG.error(err, 'callback exception')
    }
}


export class Abort implements AbortSignal {
    private _isAborted = false
    private callbacks?: (() => void)[]

    abort(): void {
        if (this._isAborted) return
        this._isAborted = true
        let cbs = this.callbacks
        if (cbs) {
            this.callbacks = undefined
            for (let i = 0; i < cbs.length; i++) {
                safeCall(cbs[i])
            }
        }
    }

    get isAborted(): boolean {
        return this._isAborted
    }

    get isLive(): boolean {
        return !this._isAborted
    }

    onAbort(cb: () => void): void {
        if (this.isAborted) {
            safeCall(cb)
        } else if (this.callbacks) {
            this.callbacks.push(cb)
        } else {
            this.callbacks = [cb]
        }
    }
}


export interface AbortSignal {
    readonly isAborted: boolean
    readonly isLive: boolean
    onAbort(cb: () => void): void
}


export class Future<T> {
    public readonly promise: Promise<T>
    private _resolve!: (value: T) => void
    private _reject!: (err: Error) => void
    private _isReady = false

    constructor() {
        this.promise = new Promise<T>((resolve, reject) => {
            this._resolve = resolve
            this._reject = reject
        })
    }

    resolve(value: T): void {
        this._isReady = true
        this._resolve(value)
    }

    reject(err: Error): void {
        this._isReady = true
        this._reject(err)
    }

    get isReady(): boolean {
        return this._isReady
    }
}


