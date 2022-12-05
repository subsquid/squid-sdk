import {isReady as isCryptoReady, waitReady as initCrypto} from '@polkadot/wasm-crypto'


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
