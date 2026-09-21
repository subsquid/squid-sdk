import {describe, expect, it, vi} from 'vitest'

import {FallbackDataSource} from '../../fallback/fallback'
import {SolanaFallbackDataSourceBuilder} from './builder'

// Stub the lazy RPC loader: `require('../rpc/builder')` resolves a directory to lib/index.js when
// compiled, but vitest can't resolve it to the .ts source. So `rpc` sources here verify the builder's
// wiring (which fields/requests it hands to solanaRpcStream); the network-gated e2e covers the real
// stack.
const {rpcCalls} = vi.hoisted(() => ({rpcCalls: [] as any[]}))
vi.mock('./load-rpc-stream', () => ({
    loadRpcStream: () => ({
        solanaRpcStream: (config: any) => {
            rpcCalls.push(config)
            return {getFinalizedStream() {}, getFinalizedHead() {}, getStream() {}, getHead() {}}
        },
    }),
}))

const PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'

describe('SolanaFallbackDataSourceBuilder', () => {
    it('defines the query once and applies identical fields + merged requests to every source', () => {
        rpcCalls.length = 0

        const fb = new SolanaFallbackDataSourceBuilder()
            .setDownstreamSources([
                {type: 'rpc', url: 'https://a.example'},
                {type: 'rpc', url: 'https://b.example'},
            ])
            .setFields({instruction: {programId: true, data: true}, transaction: {signatures: true}})
            .addInstruction({where: {programId: [PROGRAM]}, range: {from: 100}})
            .addTransaction({where: {feePayer: ['abc']}, range: {from: 100}})
            .setCapabilityProbe(false)
            .build()

        expect(fb).toBeInstanceOf(FallbackDataSource)
        expect(rpcCalls).toHaveLength(2)

        // Same shared field selection handed to both sources.
        expect(rpcCalls[0].fields).toEqual({instruction: {programId: true, data: true}, transaction: {signatures: true}})
        expect(rpcCalls[1].fields).toEqual(rpcCalls[0].fields)

        // Same merged requests handed to both sources: the two same-range adds coalesce into one
        // range-request carrying both the instruction and the transaction filter.
        expect(rpcCalls[1].requests).toEqual(rpcCalls[0].requests)
        expect(rpcCalls[0].requests).toHaveLength(1)
        expect(rpcCalls[0].requests[0].range).toEqual({from: 100})
        expect(rpcCalls[0].requests[0].request.instructions).toEqual([{where: {programId: [PROGRAM]}}])
        expect(rpcCalls[0].requests[0].request.transactions).toEqual([{where: {feePayer: ['abc']}}])
    })

    it('passes per-source connection options through, stripping the type/name tags', () => {
        rpcCalls.length = 0

        new SolanaFallbackDataSourceBuilder()
            .setDownstreamSources([{type: 'rpc', name: 'my-node', url: 'https://a.example', capacity: 5}])
            .setCapabilityProbe(false)
            .build()

        expect(rpcCalls[0]).toMatchObject({url: 'https://a.example', capacity: 5})
        expect(rpcCalls[0].type).toBeUndefined()
        expect(rpcCalls[0].name).toBeUndefined()
    })

    it('requires at least one downstream source', () => {
        expect(() => new SolanaFallbackDataSourceBuilder().build()).toThrow(/No downstream sources/)
    })

    it('names sources by type and index when no name is given', () => {
        rpcCalls.length = 0

        const fb = new SolanaFallbackDataSourceBuilder()
            .setDownstreamSources([
                {type: 'rpc', url: 'https://a.example'},
                {type: 'rpc', name: 'standby', url: 'https://b.example'},
            ])
            .setCapabilityProbe(false)
            .build()

        expect(fb.metrics().sources.map((s) => s.name)).toEqual(['rpc-0', 'standby'])
    })

    it('builds a custom source with the shared fields and requests', () => {
        let seen: any = null

        new SolanaFallbackDataSourceBuilder()
            .setDownstreamSources([
                {
                    type: 'custom',
                    buildSource(fields, requests) {
                        seen = {fields, requests}
                        return {getFinalizedStream() {}, getFinalizedHead() {}, getStream() {}, getHead() {}} as any
                    },
                },
            ])
            .setFields({log: {message: true}})
            .addLog({where: {programId: [PROGRAM]}, range: {from: 7}})
            .setCapabilityProbe(false)
            .build()

        expect(seen.fields).toEqual({log: {message: true}})
        expect(seen.requests).toHaveLength(1)
        expect(seen.requests[0].request.logs).toEqual([{where: {programId: [PROGRAM]}}])
    })
})
