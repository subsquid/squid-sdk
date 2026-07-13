import type {DataRequest, EVMDataSource, FieldSelection} from '@subsquid/evm-stream'
import type {RangeRequestList} from '@subsquid/util-internal-range'
import {describe, expect, it} from 'vitest'

import {FallbackDataSource} from '../../fallback/fallback'
import {
    type EvmDownstreamSourceBuilder,
    EvmFallbackDataSourceBuilder,
    EvmPortalDataSourceBuilder,
    EvmRpcDataSourceBuilder,
} from './builder'

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
})
