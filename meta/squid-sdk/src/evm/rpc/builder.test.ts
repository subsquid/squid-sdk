import {describe, expect, it} from 'vitest'

import {EvmRpcDataSourceBuilder, isParityUnverified} from './builder'

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

    // The parity warning fires off this predicate — an unknown/omitted network with no explicit
    // rpc/method overrides runs with validation off and unverified Portal parity.
    it('flags parity as unverified for an unknown network with no overrides', () => {
        expect(isParityUnverified({url: 'https://rpc.example', network: 'no-such-network'})).toBe(true)
    })

    it('flags parity as unverified when the network is unset and no overrides are given', () => {
        expect(isParityUnverified({url: 'https://rpc.example'})).toBe(true)
    })

    it('clears the flag when a network preset matches', () => {
        expect(isParityUnverified({url: 'https://rpc.example', network: 'ethereum-mainnet'})).toBe(false)
    })

    it('clears the flag when explicit method/rpc overrides take ownership of the config', () => {
        expect(isParityUnverified({url: 'https://rpc.example', method: {useDebugApiForStateDiffs: true}})).toBe(false)
        expect(isParityUnverified({url: 'https://rpc.example', rpc: {}})).toBe(false)
    })
})
