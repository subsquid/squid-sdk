import type {DataRequest, EVMDataSource, FieldSelection} from '@subsquid/evm-stream'
import type {RangeRequestList} from '@subsquid/util-internal-range'
import {describe, expect, it, vi} from 'vitest'

import {FallbackDataSource} from '../../fallback/fallback'
import {
    type EvmDownstreamSourceBuilder,
    EvmFallbackDataSourceBuilder,
    EvmPortalDataSourceBuilder,
    EvmRpcDataSourceBuilder,
} from './builder'

// Stub the lazy RPC loader: `require('../rpc')` resolves a directory to lib/index.js when compiled,
// but vitest can't resolve it to the .ts source. So RPC-build tests here verify the builder's wiring
// (which fields/requests it hands to evmRpcStream) rather than the real RPC stack — the network-gated
// e2e test covers the real one. `rpcCalls` records every evmRpcStream config.
const {rpcCalls} = vi.hoisted(() => ({rpcCalls: [] as any[]}))
vi.mock('./load-rpc-stream', () => ({
    loadRpcStream: () => ({
        evmRpcStream: (config: any) => {
            rpcCalls.push(config)
            return {getFinalizedStream() {}, getFinalizedHead() {}, getStream() {}, getHead() {}}
        },
    }),
}))

/** A downstream that records the shared fields + requests it is finalized with, returning a stub. */
function capturing(
    defaultName: string,
    sink: {fields: FieldSelection; requests: RangeRequestList<DataRequest>}[],
    name?: string,
): EvmDownstreamSourceBuilder {
    return {
        defaultName,
        name,
        buildSource(fields, requests) {
            sink.push({fields, requests})
            return {} as EVMDataSource<any> // never streamed in these tests
        },
    }
}

describe('EvmFallbackDataSourceBuilder', () => {
    it('defines the query once and propagates identical fields + merged requests to every downstream', () => {
        const seen: {fields: FieldSelection; requests: RangeRequestList<DataRequest>}[] = []

        const fb = new EvmFallbackDataSourceBuilder()
            .setDownstreamSources([capturing('portal', seen), capturing('rpc', seen)])
            .setFields({log: {topics: true}, transaction: {hash: true}})
            .addLog({where: {address: ['0xabc'], topic0: ['0xdead']}, range: {from: 100}})
            .addTransaction({where: {to: ['0xdef']}, range: {from: 100}})
            .setCapabilityProbe(false)
            .build()

        expect(fb).toBeInstanceOf(FallbackDataSource)
        expect(seen).toHaveLength(2)

        // Same shared field selection handed to both sources.
        expect(seen[0].fields).toEqual({log: {topics: true}, transaction: {hash: true}})
        expect(seen[1].fields).toEqual(seen[0].fields)

        // Same merged requests handed to both sources: the two same-range adds coalesce into one
        // range-request carrying both the log and the transaction filter.
        expect(seen[1].requests).toEqual(seen[0].requests)
        expect(seen[0].requests).toHaveLength(1)
        expect(seen[0].requests[0].range).toEqual({from: 100})
        expect(seen[0].requests[0].request.logs).toEqual([{where: {address: ['0xabc'], topic0: ['0xdead']}}])
        expect(seen[0].requests[0].request.transactions).toEqual([{where: {to: ['0xdef']}}])
    })

    it('applies setBlockRange across the whole shared query', () => {
        const seen: {fields: FieldSelection; requests: RangeRequestList<DataRequest>}[] = []

        new EvmFallbackDataSourceBuilder()
            .setDownstreamSources([capturing('portal', seen)])
            .addLog({where: {address: ['0xabc']}}) // defaults to {from: 0}
            .setBlockRange({from: 500, to: 1000})
            .setCapabilityProbe(false)
            .build()

        expect(seen[0].requests[0].range).toEqual({from: 500, to: 1000})
    })

    it('names sources by index, or by explicit setName / defaultName', () => {
        const seen: any[] = []

        const fb = new EvmFallbackDataSourceBuilder()
            .setDownstreamSources([capturing('portal', seen), capturing('rpc', seen, 'my-archive-node')])
            .setCapabilityProbe(false)
            .build()

        expect(fb.metrics().sources.map((s) => s.name)).toEqual(['portal-0', 'my-archive-node'])
    })

    it('throws a clear error when misconfigured', () => {
        expect(() => new EvmFallbackDataSourceBuilder().build()).toThrow(/downstream/i)
        expect(() => new EvmPortalDataSourceBuilder().buildSource({}, [])).toThrow(/portal/i)
        expect(() => new EvmRpcDataSourceBuilder().buildSource({}, [])).toThrow(/rpc/i)
    })

    it('builds a real Portal downstream via the canonical DataSourceBuilder (no connection)', () => {
        const src = new EvmPortalDataSourceBuilder()
            .setPortal('https://portal.sqd.dev/datasets/ethereum-mainnet')
            .buildSource({log: {topics: true}}, [{range: {from: 0}, request: {logs: [{where: {address: ['0xabc']}}]}}])

        // A real EVMDataSource — construction succeeds and it exposes the DataSource surface. Nothing
        // connects until it is streamed.
        expect(typeof src.getFinalizedStream).toBe('function')
        expect(typeof src.getFinalizedHead).toBe('function')
    })

    it('builds a real Portal downstream as part of a fallback and names the sources', () => {
        const fb = new EvmFallbackDataSourceBuilder()
            .setDownstreamSources([
                new EvmPortalDataSourceBuilder().setPortal('https://portal.sqd.dev/datasets/ethereum-mainnet'),
                new EvmRpcDataSourceBuilder().setRpc({url: 'https://rpc.example'}),
            ])
            .setFields({log: {topics: true}})
            .addLog({where: {address: ['0xabc']}})
            .setCapabilityProbe(false)
            .build()

        expect(fb).toBeInstanceOf(FallbackDataSource)
        expect(fb.metrics().sources.map((s) => s.name)).toEqual(['portal-0', 'rpc-1'])
    })
})

describe('standalone source builders', () => {
    it('builds a standalone Portal source with its own field selection + query (no connection)', () => {
        const src = new EvmPortalDataSourceBuilder()
            .setPortal('https://portal.sqd.dev/datasets/ethereum-mainnet')
            .setFields({log: {topics: true}})
            .addLog({where: {address: ['0xabc']}, range: {from: 10}})
            .build()

        expect(typeof src.getFinalizedStream).toBe('function')
        expect(typeof src.getFinalizedHead).toBe('function')
    })

    it('builds a standalone RPC source, passing its own field selection + query to evmRpcStream', () => {
        rpcCalls.length = 0
        const src = new EvmRpcDataSourceBuilder()
            .setRpc({url: 'https://rpc.example', network: 'ethereum-mainnet'})
            .setFields({log: {topics: true}})
            .addLog({where: {address: ['0xabc']}, range: {from: 10}})
            .build()

        expect(typeof src.getFinalizedStream).toBe('function')
        expect(rpcCalls).toHaveLength(1)
        expect(rpcCalls[0]).toMatchObject({url: 'https://rpc.example', network: 'ethereum-mainnet', fields: {log: {topics: true}}})
        expect(rpcCalls[0].requests[0].request.logs).toEqual([{where: {address: ['0xabc']}}])
    })

    it('injects the fallback shared query into an RPC downstream (not the downstream\'s own)', () => {
        rpcCalls.length = 0
        new EvmFallbackDataSourceBuilder()
            .setDownstreamSources([new EvmRpcDataSourceBuilder().setRpc({url: 'https://rpc.example'})])
            .setFields({transaction: {hash: true}})
            .addTransaction({where: {to: ['0xdef']}, range: {from: 5}})
            .setCapabilityProbe(false)
            .build()

        expect(rpcCalls).toHaveLength(1)
        expect(rpcCalls[0].fields).toEqual({transaction: {hash: true}})
        expect(rpcCalls[0].requests[0].request.transactions).toEqual([{where: {to: ['0xdef']}}])
    })

    it('rejects a downstream that also sets its own query inside a fallback', () => {
        // Portal downstream carrying its own query.
        expect(() =>
            new EvmFallbackDataSourceBuilder()
                .setDownstreamSources([
                    new EvmPortalDataSourceBuilder().setPortal('https://portal.sqd.dev/datasets/ethereum-mainnet').addLog({where: {address: ['0xabc']}}),
                ])
                .setFields({log: {topics: true}})
                .build(),
        ).toThrow(/inside a fallback/i)

        // RPC downstream carrying its own field selection.
        expect(() =>
            new EvmFallbackDataSourceBuilder()
                .setDownstreamSources([new EvmRpcDataSourceBuilder().setRpc({url: 'https://rpc.invalid'}).setFields({log: {topics: true}})])
                .addLog({where: {address: ['0xabc']}})
                .build(),
        ).toThrow(/inside a fallback/i)
    })
})
