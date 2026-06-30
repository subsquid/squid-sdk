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
        expect(await makeCapabilityProbe(s)(100)).toBe(true)
        expect(s.calls).toEqual([{from: 100, to: 100}])
    })

    it('reports capable when the slice is empty (served the query, nothing matched)', async () => {
        let s = new MockSource(async function* () {})
        expect(await makeCapabilityProbe(s)(100)).toBe(true)
    })

    it('reports not-capable when the source cannot serve the slice', async () => {
        let s = new MockSource(async function* () {
            throw new Error('the method trace_block does not exist')
        })
        expect(await makeCapabilityProbe(s)(100)).toBe(false)
    })

    it('treats a ForkException as capable (served + reorg, not an inability to serve)', async () => {
        let s = new MockSource(async function* () {
            throw forkError()
        })
        expect(await makeCapabilityProbe(s)(100)).toBe(true)
    })

    it('reports not-capable when the slice exceeds the probe timeout', async () => {
        let s = new MockSource(async function* () {
            await new Promise<void>(() => {}) // hang — never yields
        })
        expect(await makeCapabilityProbe(s, {timeoutMs: 20})(100)).toBe(false)
    })
})
