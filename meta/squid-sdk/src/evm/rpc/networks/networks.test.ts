import {describe, expect, it} from 'vitest'

import {evmRpcStream} from '../builder'
import {getNetworkPreset, KNOWN_NETWORKS, NETWORK_PRESETS, resolveNetworkSettings} from './index'

/**
 * Golden tests: each assertion encodes the documented infra deploy config for that network
 * (`infra/.../evm-hotblocks/networks/<net>`), so a drift between a preset and the dataset's real
 * config fails here. (plan §5 S5)
 */
describe('network presets — match the infra deploy config', () => {
    it('ethereum-mainnet: full validation, default trace/diff methods', () => {
        const p = getNetworkPreset('ethereum-mainnet')!
        expect(p.chainId).toBe(1)
        expect(p.rpc).toEqual({
            verifyBlockHash: true,
            verifyTxSender: true,
            verifyTxRoot: true,
            verifyReceiptsRoot: true,
            verifyLogsBloom: true,
        })
        expect(p.method).toEqual({})
    })

    it('optimism + base (OP-stack): state diffs via the debug API', () => {
        for (const slug of ['optimism-mainnet', 'base-mainnet']) {
            const p = getNetworkPreset(slug)!
            expect(p.method).toEqual({useDebugApiForStateDiffs: true})
            expect(p.rpc?.verifyTxSender).toBe(true)
        }
    })

    it('arbitrum-one: full validation, no state diffs in the dataset', () => {
        const p = getNetworkPreset(42161)!
        expect(p.slug).toBe('arbitrum-one')
        expect(p.rpc?.verifyTxSender).toBe(true)
        expect(p.method).toEqual({})
    })

    it('gnosis-mainnet (AuRa): trace_ API; tx-sender/tx-root verification skipped', () => {
        const p = getNetworkPreset('gnosis-mainnet')!
        expect(p.method).toEqual({useTraceApi: true})
        expect(p.rpc?.verifyTxSender).toBeUndefined()
        expect(p.rpc?.verifyTxRoot).toBeUndefined()
        expect(p.rpc?.verifyBlockHash).toBe(true)
    })

    it('polygon-mainnet (Bor): tx-sender skipped, 500-block finality', () => {
        const p = getNetworkPreset('polygon-mainnet')!
        expect(p.rpc?.verifyTxSender).toBeUndefined()
        expect(p.rpc?.finalityConfirmation).toBe(500)
        expect(p.rpc?.verifyBlockHash).toBe(true)
    })

    it('cronos-mainnet (Ethermint): block-hash/tx-root/receipts-root verification skipped', () => {
        const p = getNetworkPreset('cronos-mainnet')!
        expect(p.chainId).toBe(25)
        expect(p.rpc?.verifyBlockHash).toBeUndefined()
        expect(p.rpc?.verifyTxRoot).toBeUndefined()
        expect(p.rpc?.verifyReceiptsRoot).toBeUndefined()
        expect(p.rpc?.verifyTxSender).toBe(true)
    })
})

describe('resolveNetworkSettings', () => {
    it('resolves a preset by slug and by chainId', () => {
        expect(resolveNetworkSettings('optimism-mainnet').method).toEqual({useDebugApiForStateDiffs: true})
        expect(resolveNetworkSettings(10).method).toEqual({useDebugApiForStateDiffs: true})
    })

    it('overlays explicit overrides on the preset', () => {
        const s = resolveNetworkSettings('polygon-mainnet', {
            rpc: {verifyTxSender: true, finalityConfirmation: 256},
            method: {useTraceApi: true},
        })
        expect(s.rpc.verifyTxSender).toBe(true) // override wins
        expect(s.rpc.finalityConfirmation).toBe(256)
        expect(s.rpc.verifyBlockHash).toBe(true) // from preset
        expect(s.method).toEqual({useTraceApi: true})
    })

    it('unknown network with no overrides resolves to empty settings', () => {
        expect(resolveNetworkSettings('nonexistent')).toEqual({rpc: {}, method: {}})
        expect(resolveNetworkSettings()).toEqual({rpc: {}, method: {}})
    })
})

describe('evmRpcStream builder', () => {
    it('constructs an RPC data source from a network preset (no network call)', () => {
        const ds = evmRpcStream({
            url: 'http://localhost:8545',
            network: 'ethereum-mainnet',
            fields: {},
            requests: [{range: {from: 0}, request: {logs: [{}]}}],
        })
        expect(typeof ds.getStream).toBe('function')
        expect(typeof ds.getFinalizedHead).toBe('function')
    })
})

describe('KNOWN_NETWORKS', () => {
    // The `network` autocomplete union (KnownNetwork) is derived from KNOWN_NETWORKS; this keeps it
    // in sync with the shipped presets so the hints never drift from what actually has a preset.
    it('lists exactly the shipped preset slugs', () => {
        expect([...KNOWN_NETWORKS].sort()).toEqual(NETWORK_PRESETS.map((p) => p.slug).sort())
    })
})
