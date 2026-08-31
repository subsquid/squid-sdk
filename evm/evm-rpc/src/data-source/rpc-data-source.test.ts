import {describe, expect, it} from 'vitest'

import {EvmRpcDataSource} from './rpc-data-source'

describe('EvmRpcDataSource', () => {
    it('answers getHeight with eth_blockNumber, not a block lookup', async () => {
        // The fallback's freshness machinery polls heads once per batch per standby at tip pace,
        // so the poll must be the cheapest call the provider offers.
        let calls: string[] = []
        let rpc = {
            getHeight: async () => {
                calls.push('eth_blockNumber')
                return 100
            },
            getConcurrency: () => 10,
        }
        let src = new EvmRpcDataSource({rpc: rpc as never, req: {}})

        expect(await src.getHeight()).toBe(100)
        expect(calls).toEqual(['eth_blockNumber'])
    })
})
