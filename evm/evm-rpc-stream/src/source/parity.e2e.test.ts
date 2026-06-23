import {DataSourceBuilder, FieldSelection} from '@subsquid/evm-stream'
import {EvmRpcClient, Rpc} from '@subsquid/evm-rpc'
import {BlockStream} from '@subsquid/util-internal-data-source'
import {describe, expect, it} from 'vitest'

import {EvmRpcStreamDataSource} from './data-source'

/**
 * Live parity test (plan §8 / §12b). Fetches the same historical block from a real RPC
 * endpoint (through our RPC source) and from the Portal (the Portal source), and asserts the
 * two outputs are identical — the whole point of reusing the Portal decoder + porting its
 * filter.
 *
 * Network-gated: set `RPC_E2E=1`, `RPC_URL=https://rpc.subsquid.io/eth/<key>` and optionally
 * `PORTAL_URL`. Skipped by default so the normal suite stays offline.
 */

const ENABLED = process.env.RPC_E2E === '1' && !!process.env.RPC_URL
const RPC_URL = process.env.RPC_URL!
const PORTAL_URL = process.env.PORTAL_URL || 'https://portal.sqd.dev/datasets/ethereum-mainnet'
const BLOCK = Number(process.env.RPC_E2E_BLOCK || 22000000)

const FIELDS = {
    block: {timestamp: true, gasUsed: true, miner: true, baseFeePerGas: true},
    transaction: {from: true, to: true, value: true, gas: true, gasUsed: true, status: true, input: true, nonce: true},
    log: {address: true, topics: true, data: true},
} satisfies FieldSelection

async function firstBlock<B extends {header: {number: number}}>(stream: BlockStream<B>, n: number): Promise<B> {
    for await (let batch of stream) {
        let block = batch.blocks.find((b) => b.header.number === n)
        if (block) return block
    }
    throw new Error(`block ${n} not found in stream`)
}

describe.skipIf(!ENABLED)('RPC vs Portal parity', () => {
    it(`block ${BLOCK}: transactions + logs match the Portal output`, async () => {
        let portal = new DataSourceBuilder()
            .setPortal(PORTAL_URL)
            .setBlockRange({from: BLOCK, to: BLOCK})
            .setFields(FIELDS)
            .addTransaction({})
            .addLog({})
            .build()

        let rpc = new EvmRpcStreamDataSource({
            rpc: new Rpc({client: new EvmRpcClient({url: RPC_URL, capacity: 5})}),
            fields: FIELDS,
            requests: [{range: {from: BLOCK, to: BLOCK}, request: {transactions: [{}], logs: [{}]}}],
        })

        let [portalBlock, rpcBlock] = await Promise.all([
            firstBlock(portal.getFinalizedStream({from: BLOCK, to: BLOCK}), BLOCK),
            firstBlock(rpc.getFinalizedStream({from: BLOCK, to: BLOCK}), BLOCK),
        ])

        expect(rpcBlock.transactions).toHaveLength(portalBlock.transactions.length)
        expect(rpcBlock.logs).toHaveLength(portalBlock.logs.length)
        expect(rpcBlock).toEqual(portalBlock)
    }, 120_000)

    // KNOWN GAP — exact trace/stateDiff parity depends on the *node* that produced the
    // dataset, not just a method flag. Against rpc.subsquid.io the trace tree itself diverges
    // from Portal's (e.g. block 22000000: 585 vs 596 traces, traceAddress paths differ such as
    // tx 71 [4,0,0] vs [5,0,0]; stateDiffs 722 vs 702) because a different node/tracer build
    // produces a different call tree. Matching it is the per-network C1 config + chain-specific
    // work (plan S5 / CHAIN_SPECIFIC.md §4.1 parity tiers), out of scope for the spine. Logs +
    // transactions — which have no such node-dependent ambiguity — match exactly (test above).
    it.skip(`block ${BLOCK}: traces + stateDiffs match the Portal output`, async () => {
        // Ethereum mainnet's Portal dataset is produced with the trace_ API; match it.
        const TRACE_FIELDS = {
            block: {timestamp: true},
            trace: {
                callFrom: true,
                callTo: true,
                callValue: true,
                callInput: true,
                createResultAddress: true,
                error: true,
                subtraces: true,
            },
            stateDiff: {kind: true, prev: true, next: true},
        } satisfies FieldSelection

        let portal = new DataSourceBuilder()
            .setPortal(PORTAL_URL)
            .setBlockRange({from: BLOCK, to: BLOCK})
            .setFields(TRACE_FIELDS)
            .addTrace({})
            .addStateDiff({})
            .build()

        let rpc = new EvmRpcStreamDataSource({
            rpc: new Rpc({client: new EvmRpcClient({url: RPC_URL, capacity: 5})}),
            fields: TRACE_FIELDS,
            method: {useTraceApi: true},
            requests: [{range: {from: BLOCK, to: BLOCK}, request: {traces: [{}], stateDiffs: [{}]}}],
        })

        let [portalBlock, rpcBlock] = await Promise.all([
            firstBlock(portal.getFinalizedStream({from: BLOCK, to: BLOCK}), BLOCK),
            firstBlock(rpc.getFinalizedStream({from: BLOCK, to: BLOCK}), BLOCK),
        ])

        expect(rpcBlock.traces).toHaveLength(portalBlock.traces.length)
        expect(rpcBlock.stateDiffs).toHaveLength(portalBlock.stateDiffs.length)
        expect(rpcBlock).toEqual(portalBlock)
    }, 120_000)
})
