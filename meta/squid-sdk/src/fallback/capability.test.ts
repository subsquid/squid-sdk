import {BlockBatch, BlockRef, BlockStream, DataSource, StreamRequest} from '@subsquid/util-internal-data-source'
import {describe, expect, it} from 'vitest'

import {makeCapabilityProbe} from './capability'

type Gen = (req: StreamRequest) => AsyncGenerator<BlockBatch<any>>

class MockSource implements DataSource<any> {
    calls: StreamRequest[] = []
    constructor(private gen: Gen) {}
    getStream(req: StreamRequest): BlockStream<any> {
        this.calls.push(req)
        return this.gen(req)
    }
    getFinalizedStream(req: StreamRequest): BlockStream<any> {
        return this.getStream(req)
    }
    async getHead(): Promise<BlockRef> {
        return {number: 0, hash: '0x'}
    }
    async getFinalizedHead(): Promise<BlockRef> {
        return {number: 0, hash: '0x'}
    }
}

const batch = (n: number): BlockBatch<any> => ({blocks: [{header: {number: n, hash: `0x${n}`}}]})
const forkError = () => Object.assign(new Error('fork'), {isSqdForkException: true})

describe('makeCapabilityProbe', () => {
    it('requests a one-block slice at the asked-for block and reports capable when it serves', async () => {
        let s = new MockSource(async function* () {
            yield batch(100)
        })
        expect(await makeCapabilityProbe(s)(100)).toEqual({ok: true})
        expect(s.calls).toEqual([{from: 100, to: 100}])
    })

    it('reports capable when the slice is empty (served the query, nothing matched)', async () => {
        let s = new MockSource(async function* () {})
        expect(await makeCapabilityProbe(s)(100)).toEqual({ok: true})
    })

    it('reports not-capable, with the classified cause, when the source cannot serve the slice', async () => {
        let s = new MockSource(async function* () {
            throw new Error('the method trace_block does not exist')
        })
        let r = await makeCapabilityProbe(s)(100)
        expect(r.ok).toBe(false)
        expect(r.cause?.check).toBe('capability')
        expect(r.cause?.reason).toBe('unknown') // a bare Error → uncategorized
        expect(r.cause?.detail).toContain('trace_block')
    })

    it('classifies a JSON-RPC error (HTTP 200 with an error body) as an rpc failure with its code', async () => {
        let s = new MockSource(async function* () {
            throw Object.assign(new Error('the method debug_traceBlockByNumber does not exist'), {
                name: 'RpcError',
                code: -32601,
            })
        })
        let r = await makeCapabilityProbe(s)(100)
        expect(r.ok).toBe(false)
        expect(r.cause?.reason).toBe('rpc')
        expect(r.cause?.code).toBe(-32601)
    })

    it('treats a ForkException as capable (served + reorg, not an inability to serve)', async () => {
        let s = new MockSource(async function* () {
            throw forkError()
        })
        expect(await makeCapabilityProbe(s)(100)).toEqual({ok: true})
    })

    it('reports not-capable when the slice exceeds the probe timeout', async () => {
        let s = new MockSource(async function* () {
            await new Promise<void>(() => {}) // hang — never yields
        })
        let r = await makeCapabilityProbe(s, {timeoutMs: 20})(100)
        expect(r.ok).toBe(false)
        expect(r.cause?.reason).toBe('timeout')
        expect(r.cause?.detail).toContain('timed out')
    })
})
