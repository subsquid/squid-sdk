import {isReady as isCryptoReady, waitReady as initCrypto} from '@polkadot/wasm-crypto/bundle'
import {xxhashAsU8a} from "@polkadot/util-crypto";


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

export function xx64concat(data: Uint8Array): Uint8Array {
    return Buffer.concat([xxhashAsU8a(data, 64), data])
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


