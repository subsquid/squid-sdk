import type {EVMDataSource, FieldSelection} from '@subsquid/evm-stream'
import type {BlockRef, BlockStream, StreamRequest} from '@subsquid/util-internal-data-source'
import {describe, expect, it} from 'vitest'

import {
    type EvmDownstreamSourceBuilder,
    EvmFallbackDataSourceBuilder,
    EvmPortalDataSourceBuilder,
    EvmRpcDataSourceBuilder,
} from './builder'

/**
 * Live end-to-end test: drive a fallback built from a real Portal source and a real RPC source,
 * and assert it streams correctly and fails over when the primary is unavailable. Network-gated
 * (`RPC_E2E=1`, `RPC_URL=...`); skipped by default.
 */

const ENABLED = process.env.RPC_E2E === '1' && !!process.env.RPC_URL
const RPC_URL = process.env.RPC_URL!
const PORTAL_URL = process.env.PORTAL_URL || 'https://portal.sqd.dev/datasets/ethereum-mainnet'
const FROM = Number(process.env.RPC_E2E_BLOCK || 22000000)
const TO = FROM + 2

const FIELDS = {
    transaction: {from: true, to: true, value: true},
    log: {address: true, topics: true},
} satisfies FieldSelection

/** Build a fallback over `primary` + a real RPC source, with the shared query defined once here. */
function fallback(primary: EvmDownstreamSourceBuilder) {
    return new EvmFallbackDataSourceBuilder()
        .setDownstreamSources([primary, new EvmRpcDataSourceBuilder().setRpc({url: RPC_URL, capacity: 5})])
        .setBlockRange({from: FROM, to: TO})
        .setFields(FIELDS)
        .addTransaction({})
        .addLog({})
        .build()
}

async function streamNumbers(source: {getFinalizedStream(req: StreamRequest): BlockStream<any>}): Promise<number[]> {
    let out: number[] = []
    for await (let batch of source.getFinalizedStream({from: FROM, to: TO})) {
        out.push(...batch.blocks.map((b: any) => b.header.number))
    }
    return out
}

// An EVM source that always fails — used to force a failover to the next source. Injected via the
// public `EvmDownstreamSourceBuilder` interface (the escape hatch for an arbitrary pre-built source).
class BrokenSource implements EVMDataSource<typeof FIELDS> {
    async getHead(): Promise<BlockRef> {
        throw new Error('primary down')
    }
    async getFinalizedHead(): Promise<BlockRef> {
        throw new Error('primary down')
    }
    // biome-ignore lint: intentionally throwing async generator
    async *getStream(): BlockStream<any> {
        throw new Error('primary down')
    }
    async *getFinalizedStream(): BlockStream<any> {
        throw new Error('primary down')
    }
}

const brokenPrimary: EvmDownstreamSourceBuilder = {
    defaultName: 'broken',
    buildSource: () => new BrokenSource(),
}

describe.skipIf(!ENABLED)('EVM fallback — live', () => {
    it('streams a range through the primary (Portal)', async () => {
        let fb = fallback(new EvmPortalDataSourceBuilder().setPortal(PORTAL_URL))

        expect(await streamNumbers(fb)).toEqual([FROM, FROM + 1, TO])
    }, 120_000)

    it('fails over to the RPC source when the primary is down', async () => {
        let fb = fallback(brokenPrimary)

        expect(fb.activeIndex).toBeUndefined()
        expect(await streamNumbers(fb)).toEqual([FROM, FROM + 1, TO])
        expect(fb.activeIndex).toBe(1) // RPC took over
        expect(fb.switchCount).toBeGreaterThanOrEqual(1)
    }, 120_000)
})
