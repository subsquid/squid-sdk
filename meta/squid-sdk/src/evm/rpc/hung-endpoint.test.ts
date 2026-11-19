import {type AddressInfo, createServer, type Server, type Socket} from 'net'

import type {BlockRef, BlockStream, DataSource} from '@subsquid/util-internal-data-source'
import {LogLevel, setLogLevelCallback} from '@subsquid/logger'
import {afterEach, beforeEach, describe, expect, it} from 'vitest'

import {FallbackDataSource} from '../../fallback/fallback'
import {evmRpcStream} from './builder'

setLogLevelCallback((ns) => (ns.startsWith('sqd:') ? LogLevel.ERROR : undefined))

/**
 * A real TCP endpoint that accepts connections and reads requests but never responds — the #611
 * failure mode. Unlike a never-settling mock promise, a request against it holds one of the RPC
 * client's `capacity` slots until the request itself settles, so these tests can observe whether a
 * hung request is actually released (via the client's `requestTimeout`) or merely abandoned.
 */
class HungEndpoint {
    requests = 0
    private sockets = new Set<Socket>()
    private server: Server = createServer((socket) => {
        this.sockets.add(socket)
        socket.on('close', () => this.sockets.delete(socket))
        socket.on('data', (chunk) => {
            this.requests += chunk.toString('latin1').match(/^POST /gm)?.length ?? 0
        })
        socket.on('error', () => {})
    })

    async listen(): Promise<string> {
        await new Promise<void>((resolve) => this.server.listen(0, '127.0.0.1', resolve))
        return `http://127.0.0.1:${(this.server.address() as AddressInfo).port}`
    }

    async close(): Promise<void> {
        for (let s of this.sockets) s.destroy()
        await new Promise<void>((resolve) => this.server.close(() => resolve()))
    }
}

const PENDING = Symbol('pending')

function settleWithin<T>(p: Promise<T>, ms: number): Promise<T | typeof PENDING | {error: unknown}> {
    let settled = p.then(
        (v) => v,
        (error) => ({error}),
    )
    return Promise.race([settled, new Promise<typeof PENDING>((r) => setTimeout(() => r(PENDING), ms))])
}

async function until(cond: () => boolean, ms: number): Promise<void> {
    let deadline = Date.now() + ms
    while (!cond() && Date.now() < deadline) await new Promise((r) => setTimeout(r, 10))
}

function rpcSource(url: string, opts: {requestTimeout?: number; capacity?: number}) {
    return evmRpcStream({
        url,
        network: 'ethereum-mainnet',
        fields: {},
        requests: [{range: {from: 0}, request: {}}],
        ...opts,
    })
}

describe('RPC source against an endpoint that accepts connections but never responds', () => {
    let endpoint: HungEndpoint
    let url: string

    beforeEach(async () => {
        endpoint = new HungEndpoint()
        url = await endpoint.listen()
    })

    afterEach(async () => {
        await endpoint.close()
    })

    it('requestTimeout turns a hung head request into an error', async () => {
        let src = rpcSource(url, {requestTimeout: 100})
        let r = await settleWithin(src.getHead(), 2000)
        expect(r).toMatchObject({error: expect.anything()})
    })

    it('a timed-out request releases its capacity slot, so later requests still reach the endpoint', async () => {
        let src = rpcSource(url, {requestTimeout: 100, capacity: 1})
        for (let i = 0; i < 3; i++) {
            expect(await settleWithin(src.getHead(), 2000)).toMatchObject({error: expect.anything()})
        }
        expect(endpoint.requests).toBe(3)
    })

    // Characterizes the leak the client timeout fixes: abandoning the promise (as an outer
    // `withTimeout` does) leaves the request in flight, so with every slot taken nothing else is sent.
    it('without requestTimeout, a hung request holds its slot and blocks every later request', async () => {
        let src = rpcSource(url, {requestTimeout: 0, capacity: 1})
        let first = src.getHead()
        first.catch(() => {})
        await until(() => endpoint.requests === 1, 2000)
        expect(endpoint.requests).toBe(1)

        let second = src.getHead()
        second.catch(() => {})
        expect(await settleWithin(second, 300)).toBe(PENDING)
        expect(endpoint.requests).toBe(1) // never sent: the only slot is held by the hung request
    })

    it('a fallback whose active RPC source hangs fails getHead over to the next source', async () => {
        let healthy: DataSource<unknown> = {
            getStream: () => (async function* () {})() as BlockStream<unknown>,
            getFinalizedStream: () => (async function* () {})() as BlockStream<unknown>,
            getHead: async (): Promise<BlockRef> => ({number: 7, hash: '0x7'}),
            getFinalizedHead: async (): Promise<BlockRef> => ({number: 7, hash: '0x7'}),
        }
        let fb = new FallbackDataSource<unknown>({
            sources: [
                {name: 'hung-rpc', source: rpcSource(url, {requestTimeout: 100}) as DataSource<unknown>},
                {name: 'healthy', source: healthy},
            ],
            getBlockRef: () => ({number: 0, hash: '0x0'}),
        })

        expect(await settleWithin(fb.getHead(), 3000)).toEqual({number: 7, hash: '0x7'})
        expect(await settleWithin(fb.getFinalizedHead(), 3000)).toEqual({number: 7, hash: '0x7'})
        expect(fb.metrics().sources[0]).toMatchObject({
            health: 'unhealthy',
            cause: {check: 'liveness', reason: 'timeout'},
        })
    })
})
