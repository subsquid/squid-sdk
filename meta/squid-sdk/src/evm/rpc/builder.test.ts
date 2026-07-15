import {LogLevel, type LogRecord, setRootSink} from '@subsquid/logger'
import {describe, expect, it} from 'vitest'

import {EvmRpcDataSourceBuilder} from './builder'

/** Capture the parity warnings emitted while `build` runs (see {@link EvmRpcDataSourceBuilder}). */
function parityWarnings(build: () => void): LogRecord[] {
    let records: LogRecord[] = []
    setRootSink((rec) => records.push(rec))
    build()
    return records.filter((r) => r.level >= LogLevel.WARN && /parity/i.test(r.msg ?? ''))
}

describe('EvmRpcDataSourceBuilder', () => {
    it('builds a standalone RPC data source from a fluent query (no connection)', () => {
        const src = new EvmRpcDataSourceBuilder()
            .setRpc({url: 'https://rpc.example', network: 'ethereum-mainnet'})
            .setFields({log: {topics: true, data: true}})
            .addLog({where: {address: ['0xabc']}, range: {from: 10}})
            .build()

        // A real EVMDataSource — construction succeeds and it exposes the DataSource surface. Nothing
        // connects until it is streamed.
        expect(typeof src.getFinalizedStream).toBe('function')
        expect(typeof src.getFinalizedHead).toBe('function')
    })

    it('accepts a bare URL string', () => {
        const src = new EvmRpcDataSourceBuilder().setRpc('https://rpc.example').build()
        expect(typeof src.getFinalizedStream).toBe('function')
    })

    it('throws when the endpoint is not set', () => {
        expect(() => new EvmRpcDataSourceBuilder().build()).toThrow(/rpc/i)
    })

    it('warns that dataset parity is unverified for an unknown network with no overrides', () => {
        let warnings = parityWarnings(() =>
            new EvmRpcDataSourceBuilder().setRpc({url: 'https://rpc.example', network: 'no-such-network'}).build(),
        )
        expect(warnings).toHaveLength(1)
    })

    it('warns when the network is unset and no overrides are given', () => {
        let warnings = parityWarnings(() => new EvmRpcDataSourceBuilder().setRpc('https://rpc.example').build())
        expect(warnings).toHaveLength(1)
    })

    it('does not warn when a network preset matches', () => {
        let warnings = parityWarnings(() =>
            new EvmRpcDataSourceBuilder().setRpc({url: 'https://rpc.example', network: 'ethereum-mainnet'}).build(),
        )
        expect(warnings).toHaveLength(0)
    })

    it('does not warn when explicit method/rpc overrides take ownership of the config', () => {
        let warnings = parityWarnings(() =>
            new EvmRpcDataSourceBuilder()
                .setRpc({url: 'https://rpc.example', method: {useDebugApiForStateDiffs: true}})
                .build(),
        )
        expect(warnings).toHaveLength(0)
    })
})
