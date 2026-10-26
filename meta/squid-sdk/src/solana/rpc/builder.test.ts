import {describe, expect, it} from 'vitest'

import {SolanaRpcDataSourceBuilder} from './builder'
import {coarseRequest} from './source/data-source'

const PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'

describe('SolanaRpcDataSourceBuilder', () => {
    it('builds a standalone RPC data source from a fluent query (no connection)', () => {
        const src = new SolanaRpcDataSourceBuilder()
            .setRpc({url: 'https://rpc.example'})
            .setFields({instruction: {programId: true, data: true}})
            .addInstruction({where: {programId: [PROGRAM]}, range: {from: 250_000_000}})
            .build()

        // A real SolanaDataSource — construction succeeds and it exposes the DataSource surface.
        // Nothing connects until it is streamed.
        expect(typeof src.getFinalizedStream).toBe('function')
        expect(typeof src.getFinalizedHead).toBe('function')
    })

    it('accepts a bare URL string', () => {
        const src = new SolanaRpcDataSourceBuilder().setRpc('https://rpc.example').build()
        expect(typeof src.getFinalizedStream).toBe('function')
    })

    it('throws when the endpoint is not set', () => {
        expect(() => new SolanaRpcDataSourceBuilder().build()).toThrow(/rpc/i)
    })
})

describe('coarseRequest', () => {
    it('needs transaction details for any transaction-derived item filter', () => {
        for (let request of [
            {transactions: [{}]},
            {instructions: [{}]},
            {logs: [{}]},
            {balances: [{}]},
            {tokenBalances: [{}]},
        ]) {
            expect(coarseRequest([{range: {from: 0}, request}])).toEqual({transactions: true, rewards: false})
        }
    })

    it('fetches rewards only for a reward filter', () => {
        expect(coarseRequest([{range: {from: 0}, request: {rewards: [{}]}}])).toEqual({
            transactions: false,
            rewards: true,
        })
    })

    it('fetches neither for a header-only query', () => {
        expect(coarseRequest([{range: {from: 0}, request: {includeAllBlocks: true}}])).toEqual({
            transactions: false,
            rewards: false,
        })
    })

    it('unions across ranges', () => {
        expect(
            coarseRequest([
                {range: {from: 0, to: 10}, request: {rewards: [{}]}},
                {range: {from: 11}, request: {instructions: [{}]}},
            ]),
        ).toEqual({transactions: true, rewards: true})
    })
})
