import type {EVMDataSource} from '@subsquid/evm-stream'
import {describe, expect, it, vi} from 'vitest'

import {FallbackDataSource} from '../../fallback/fallback'
import {EvmFallbackDataSourceBuilder} from './builder'

// Stub the lazy RPC loader: `require('../rpc')` resolves a directory to lib/index.js when compiled,
// but vitest can't resolve it to the .ts source. So `rpc` sources here verify the builder's wiring
// (which fields/requests it hands to evmRpcStream); the network-gated e2e covers the real stack.
const {rpcCalls} = vi.hoisted(() => ({rpcCalls: [] as any[]}))
vi.mock('./load-rpc-stream', () => ({
    loadRpcStream: () => ({
        evmRpcStream: (config: any) => {
            rpcCalls.push(config)
            return {getFinalizedStream() {}, getFinalizedHead() {}, getStream() {}, getHead() {}}
        },
    }),
}))

describe('EvmFallbackDataSourceBuilder', () => {
    it('defines the query once and applies identical fields + merged requests to every source', () => {
        rpcCalls.length = 0

        const fb = new EvmFallbackDataSourceBuilder()
            .setDownstreamSources([
                {type: 'rpc', url: 'https://a.example'},
                {type: 'rpc', url: 'https://b.example'},
            ])
            .setFields({log: {topics: true}, transaction: {hash: true}})
            .addLog({where: {address: ['0xabc'], topic0: ['0xdead']}, range: {from: 100}})
            .addTransaction({where: {to: ['0xdef']}, range: {from: 100}})
            .setCapabilityProbe(false)
            .build()

        expect(fb).toBeInstanceOf(FallbackDataSource)
        expect(rpcCalls).toHaveLength(2)

        // Same shared field selection handed to both sources.
        expect(rpcCalls[0].fields).toEqual({log: {topics: true}, transaction: {hash: true}})
        expect(rpcCalls[1].fields).toEqual(rpcCalls[0].fields)

        // Same merged requests handed to both sources: the two same-range adds coalesce into one
        // range-request carrying both the log and the transaction filter.
        expect(rpcCalls[1].requests).toEqual(rpcCalls[0].requests)
        expect(rpcCalls[0].requests).toHaveLength(1)
        expect(rpcCalls[0].requests[0].range).toEqual({from: 100})
        expect(rpcCalls[0].requests[0].request.logs).toEqual([{where: {address: ['0xabc'], topic0: ['0xdead']}}])
        expect(rpcCalls[0].requests[0].request.transactions).toEqual([{where: {to: ['0xdef']}}])
    })

    it('passes per-source connection options through, stripping the type/name tags', () => {
        rpcCalls.length = 0

        new EvmFallbackDataSourceBuilder()
            .setDownstreamSources([{type: 'rpc', name: 'my-node', url: 'https://a.example', network: 'ethereum-mainnet', capacity: 5}])
            .setCapabilityProbe(false)
            .build()

        expect(rpcCalls[0]).toMatchObject({url: 'https://a.example', network: 'ethereum-mainnet', capacity: 5})
        expect(rpcCalls[0]).not.toHaveProperty('type')
        expect(rpcCalls[0]).not.toHaveProperty('name')
    })

    it('applies setBlockRange across the whole shared query', () => {
        rpcCalls.length = 0

        new EvmFallbackDataSourceBuilder()
            .setDownstreamSources([{type: 'rpc', url: 'https://a.example'}])
            .addLog({where: {address: ['0xabc']}}) // defaults to {from: 0}
            .setBlockRange({from: 500, to: 1000})
            .setCapabilityProbe(false)
            .build()

        expect(rpcCalls[0].requests[0].range).toEqual({from: 500, to: 1000})
    })

    it('names sources by `${type}-${index}`, or by explicit `name`', () => {
        const fb = new EvmFallbackDataSourceBuilder()
            .setDownstreamSources([
                {type: 'portal', url: 'https://portal.sqd.dev/datasets/ethereum-mainnet'},
                {type: 'rpc', url: 'https://a.example', name: 'my-archive-node'},
            ])
            .setCapabilityProbe(false)
            .build()

        expect(fb.metrics().sources.map((s) => s.name)).toEqual(['portal-0', 'my-archive-node'])
    })

    it('throws a clear error when there are no downstream sources', () => {
        expect(() => new EvmFallbackDataSourceBuilder().build()).toThrow(/downstream/i)
    })

    it('builds a real Portal source from a config (no connection) via the canonical DataSourceBuilder', () => {
        const fb = new EvmFallbackDataSourceBuilder()
            .setDownstreamSources([{type: 'portal', url: 'https://portal.sqd.dev/datasets/ethereum-mainnet'}])
            .setFields({log: {topics: true}})
            .addLog({where: {address: ['0xabc']}})
            .setCapabilityProbe(false)
            .build()

        expect(fb).toBeInstanceOf(FallbackDataSource)
        expect(fb.metrics().sources.map((s) => s.name)).toEqual(['portal-0'])
    })

    it('hands the shared query to a `custom` source and uses what it returns', () => {
        const built = {getFinalizedStream() {}, getFinalizedHead() {}, getStream() {}, getHead() {}} as unknown as EVMDataSource<any>
        let seen: {fields: any; requests: any} | undefined

        const fb = new EvmFallbackDataSourceBuilder()
            .setDownstreamSources([
                {
                    type: 'custom',
                    buildSource(fields, requests) {
                        seen = {fields, requests}
                        return built
                    },
                },
            ])
            .setFields({log: {topics: true}})
            .addLog({where: {address: ['0xabc']}})
            .setCapabilityProbe(false)
            .build()

        expect(fb).toBeInstanceOf(FallbackDataSource)
        expect(fb.metrics().sources.map((s) => s.name)).toEqual(['custom-0'])
        // Not exempt: the custom source receives the same shared field selection + query as the rest.
        expect(seen?.fields).toEqual({log: {topics: true}})
        expect(seen?.requests[0].request.logs).toEqual([{where: {address: ['0xabc']}}])
    })
})
