import assert from 'assert'
import {describe, it} from 'vitest'
import {HttpClient, HttpClientOptions, HttpResponse} from '@subsquid/http-client'
import {PortalClient, type BlockRef} from './client'

const HEAD: BlockRef = {number: 100, hash: '0xabc'}

/**
 * Build a PortalClient whose HTTP layer replays `bodies` (one per request; the
 * last entry repeats). A `null` body models the portal's transient null head.
 */
function mock(bodies: unknown[], headRetrySchedule: number[] = [1, 1, 1]) {
    let http = new HttpClient()
    let urls: string[] = []
    ;(http as any).request = (_method: string, url: string) => {
        let body = bodies[Math.min(urls.length, bodies.length - 1)]
        urls.push(url)
        return Promise.resolve({body})
    }
    let portal = new PortalClient({url: 'http://localhost/datasets/test', http, headRetrySchedule})
    return {portal, urls}
}

describe('PortalClient head null-retries', () => {
    it('retries transient null heads and returns the eventual head', async () => {
        let {portal, urls} = mock([null, null, HEAD])
        let head = await portal.getFinalizedHead()
        assert.deepStrictEqual(head, HEAD)
        assert.strictEqual(urls.length, 3)
        assert.ok(urls[0].endsWith('/finalized-head'))
    })

    it('resolves to undefined after exhausting the schedule on a persistent null', async () => {
        // schedule length 2 => 3 attempts total
        let {portal, urls} = mock([null], [1, 1])
        let head = await portal.getFinalizedHead()
        assert.strictEqual(head, undefined)
        assert.strictEqual(urls.length, 3)
    })

    it('does not retry when the schedule is empty', async () => {
        let {portal, urls} = mock([null], [])
        let head = await portal.getHead()
        assert.strictEqual(head, undefined)
        assert.strictEqual(urls.length, 1)
        assert.ok(urls[0].endsWith('/head'))
    })

    it('returns immediately on a non-null head without retrying', async () => {
        let {portal, urls} = mock([HEAD])
        let head = await portal.getHead()
        assert.deepStrictEqual(head, HEAD)
        assert.strictEqual(urls.length, 1)
    })

    it('does not retry an empty (undefined) body — only JSON null is transient', async () => {
        let {portal, urls} = mock([undefined, HEAD])
        let head = await portal.getHead()
        assert.strictEqual(head, undefined)
        assert.strictEqual(urls.length, 1)
    })

    it('rejects and stops requesting when aborted during backoff', async () => {
        let ac = new AbortController()
        let {portal, urls} = mock([null, HEAD], [1000])
        let p = portal.getFinalizedHead({abort: ac.signal})
        setTimeout(() => ac.abort(), 5)
        await assert.rejects(p)
        assert.strictEqual(urls.length, 1)
    })
})

/**
 * Build a PortalClient over a transport that answers `statuses` in order (the last
 * entry repeats), counting every attempt the retry loop makes. Retry pauses are
 * zeroed so the real loop in `HttpClient.request` runs at full speed.
 */
function retryProbe(statuses: number[], http?: HttpClientOptions | HttpClient) {
    let attempts = 0
    let client = http instanceof HttpClient ? http : new HttpClient({log: null, retrySchedule: [0], ...http})
    // Stands in for node-fetch `Headers`; the retry path only ever looks up `retry-after`.
    let headers = new Headers() as any
    ;(client as any).performRequestWithTimeout = async () => {
        let status = statuses[Math.min(attempts, statuses.length - 1)]
        attempts++
        return new HttpResponse(0, 'http://localhost/datasets/test/head', status, headers, status == 200 ? HEAD : {}, false)
    }
    let portal = new PortalClient({url: 'http://localhost/datasets/test', http: client})
    return {portal, attempts: () => attempts}
}

describe('PortalClient retry budget', () => {
    it('applies its own default when the caller configured none', async () => {
        let {portal, attempts} = retryProbe([503])
        await assert.rejects(portal.getHead())
        // 1 initial attempt + 6 retries
        assert.strictEqual(attempts(), 7)
    })

    it('honors retryAttempts: Infinity instead of capping it at the default', async () => {
        // Eight failures is more than the default budget would survive: under the
        // regression this rejected on the 7th attempt.
        let {portal, attempts} = retryProbe([503, 503, 503, 503, 503, 503, 503, 503, 200], {
            retryAttempts: Infinity,
        })
        assert.deepStrictEqual(await portal.getHead(), HEAD)
        assert.strictEqual(attempts(), 9)
    })

    it('honors a budget lower than the default', async () => {
        let {portal, attempts} = retryProbe([503], {retryAttempts: 1})
        await assert.rejects(portal.getHead())
        assert.strictEqual(attempts(), 2)
    })

    it('honors the budget of a caller-supplied HttpClient', async () => {
        let {portal, attempts} = retryProbe(
            [503],
            new HttpClient({log: null, retrySchedule: [0], retryAttempts: 2})
        )
        await assert.rejects(portal.getHead())
        assert.strictEqual(attempts(), 3)
    })

    it('falls back to the default when a supplied HttpClient configured no retries', async () => {
        let {portal, attempts} = retryProbe([503], new HttpClient({log: null, retrySchedule: [0]}))
        await assert.rejects(portal.getHead())
        assert.strictEqual(attempts(), 7)
    })

    it('lets a per-request budget override the configured one', async () => {
        let {portal, attempts} = retryProbe([503], {retryAttempts: Infinity})
        await assert.rejects(portal.getHead({retryAttempts: 0}))
        assert.strictEqual(attempts(), 1)
    })
})
