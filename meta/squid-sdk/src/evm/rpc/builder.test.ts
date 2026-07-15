import {describe, expect, it} from 'vitest'

import {EvmRpcDataSourceBuilder} from './builder'

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
})
