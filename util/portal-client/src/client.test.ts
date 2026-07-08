import assert from 'assert'
import {describe, it} from 'vitest'
import {HttpClient} from '@subsquid/http-client'
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
