import {safeCall} from '@subsquid/util-internal'
import {BlockHeader} from './types'


export function isChain(a: BlockHeader, b: BlockHeader): boolean {
    return a.number == b.parentNumber && a.hash == b.parentHash
}


export class Timeout {
    private timeout?: any
    private epoch = 0

    constructor(private time: number, private cb: () => void) {}

    start(): void {
        let epoch = this.epoch
        this.timeout = setTimeout(() => {
            if (epoch == this.epoch) {
                this.timeout = undefined
                safeCall(this.cb)
            } else {
                this.start()
            }
        }, this.time)
    }

    stop(): void {
        if (this.timeout == null) return
        clearTimeout(this.timeout)
    }

    reset(): void {
        this.epoch += 1
    }
}
