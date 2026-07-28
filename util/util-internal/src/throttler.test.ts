import {describe, expect, it} from 'vitest'
import {Throttler} from './throttler'


function deferred<T>(): {promise: Promise<T>; resolve: (v: T) => void} {
    let resolve!: (v: T) => void
    let promise = new Promise<T>((res) => {
        resolve = res
    })
    return {promise, resolve}
}

function timeout<T>(ms: number, value: T): Promise<T> {
    return new Promise((res) => setTimeout(() => res(value), ms))
}

describe('Throttler', () => {
    it('serves the cached value while a refresh is in flight (prefetch)', async () => {
        let calls = 0
        let hang = deferred<number>()
        let fn = () => {
            calls += 1
            // first fetch succeeds, every subsequent (background) refresh hangs forever
            return calls === 1 ? Promise.resolve(1) : hang.promise
        }
        let throttler = new Throttler(fn, 20).enablePrefetch()

        // first read must await the initial fetch
        expect(await throttler.get()).toBe(1)

        // let the cached value go stale so a refresh is due; the prefetch refresh now hangs
        await timeout(60, undefined)

        // get() must return the last known value promptly and NOT block on the hung refresh.
        // Pre-fix this returned the in-flight (hung) promise and never resolved.
        let result = await Promise.race([throttler.get(), timeout(300, 'HUNG' as const)])
        expect(result).toBe(1)
    })

    it('blocks the very first get() until the initial value is available', async () => {
        let gate = deferred<number>()
        let throttler = new Throttler(() => gate.promise, 20).enablePrefetch()

        let race = Promise.race([throttler.get(), timeout(50, 'PENDING' as const)])
        expect(await race).toBe('PENDING')

        gate.resolve(7)
        expect(await throttler.get()).toBe(7)
    })

    it('non-prefetch throttler awaits a fresh value when stale', async () => {
        let values = [1, 2]
        let i = 0
        let throttler = new Throttler(() => Promise.resolve(values[i++]), 20)

        expect(await throttler.get()).toBe(1)
        await timeout(40, undefined)
        expect(await throttler.get()).toBe(2)
    })
})
