import * as fs from 'node:fs'
import * as Path from 'node:path'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {Rpc, type TraceReplayCompletenessMode} from '../src/rpc'
import type {DataRequest} from '../src/types'
import {calculateStateSyncTxHash} from '../src/verification'
import {MockRpcClient} from './helpers/mock-rpc-client'

const logWarn = vi.hoisted(() => vi.fn())

vi.mock('@subsquid/logger', () => ({
    createLogger: () => ({warn: logWarn}),
}))

// BSC mainnet block 363: three transactions, each with its trace_replayBlockTransactions entry.
const FIXTURE = JSON.parse(fs.readFileSync(Path.join(__dirname, 'fixtures/bsc/block-363.json'), 'utf-8'))
const BLOCK_NUMBER = 363
const TX_COUNT = FIXTURE.block.transactions.length

const REQUEST: DataRequest = {
    transactions: true,
    stateDiffs: true,
}

/**
 * `keepReplays` replays survive, mimicking a provider that answers with a truncated
 * (or, at 0, empty) list.
 */
function mockClient(keepReplays = TX_COUNT, chainId = FIXTURE.chainId, block = FIXTURE.block): MockRpcClient {
    let client = new MockRpcClient()
    let number = `0x${BLOCK_NUMBER.toString(16)}`
    client.setFixture('eth_chainId', undefined, chainId)
    client.setFixture('eth_getBlockByNumber', [number, true], block)
    client.setFixture('eth_getBlockByNumber', [number, false], FIXTURE.blockWithHashes)
    client.setFixture(
        'trace_replayBlockTransactions',
        [block.hash, ['stateDiff']],
        FIXTURE.replays.slice(0, keepReplays),
    )
    return client
}

function rpc(client: MockRpcClient, mode?: TraceReplayCompletenessMode): Rpc {
    return new Rpc({client: client as any, traceReplayCompleteness: mode})
}

function missingReplayWarnings(): any[] {
    return logWarn.mock.calls
        .filter(([, message]) => String(message).startsWith('trace replays are missing'))
        .map(([fields]) => fields)
}

describe('trace replay completeness', () => {
    beforeEach(() => {
        logWarn.mockReset()
    })

    for (let mode of ['observe', 'reject'] as const) {
        it(`accepts a block with a replay per transaction (${mode})`, async () => {
            let [block] = await rpc(mockClient(), mode).getBlockBatch([BLOCK_NUMBER], REQUEST)
            expect(block._isInvalid).toBeFalsy()
            expect(block.traceReplays).toHaveLength(TX_COUNT)
            expect(missingReplayWarnings()).toHaveLength(0)
        })
    }

    for (let [shape, keep] of [['an empty', 0], ['a truncated', 1]] as const) {
        it(`rejects ${shape} replay list`, async () => {
            let [block] = await rpc(mockClient(keep), 'reject').getBlockBatch([BLOCK_NUMBER], REQUEST)
            expect(block._isInvalid).toBe(true)
            expect(block._errorMessage).toBe(
                `trace_replayBlockTransactions returned no replay for ${TX_COUNT - keep} of ${TX_COUNT} transactions`,
            )
        })

        it(`warns about ${shape} replay list and accepts it in observe mode`, async () => {
            let [block] = await rpc(mockClient(keep), 'observe').getBlockBatch([BLOCK_NUMBER], REQUEST)
            expect(block._isInvalid).toBeFalsy()
            expect(block.traceReplays).toHaveLength(keep)
            expect(missingReplayWarnings()).toEqual([
                expect.objectContaining({
                    blockNumber: BLOCK_NUMBER,
                    blockHash: FIXTURE.block.hash,
                    transactionCount: TX_COUNT,
                    replayCount: keep,
                    missingCount: TX_COUNT - keep,
                    missingSample: FIXTURE.block.transactions.slice(keep).map((tx: any) => tx.hash),
                }),
            ])
        })
    }

    it('does nothing when off, and is off by default', async () => {
        for (let mode of ['off', undefined] as const) {
            let [block] = await rpc(mockClient(0), mode).getBlockBatch([BLOCK_NUMBER], REQUEST)
            expect(block._isInvalid).toBeFalsy()
        }
        expect(missingReplayWarnings()).toHaveLength(0)
    })

    it("does not expect a replay of Bor's state-sync transaction", async () => {
        let block = structuredClone(FIXTURE.block)
        let last = block.transactions[TX_COUNT - 1]
        last.hash = calculateStateSyncTxHash(block.number, block.hash)
        let client = mockClient(TX_COUNT - 1, '0x89', block)

        let [result] = await rpc(client, 'reject').getBlockBatch([BLOCK_NUMBER], REQUEST)
        expect(result._isInvalid).toBeFalsy()

        // but still expects one for every other transaction
        let [truncated] = await rpc(mockClient(TX_COUNT - 2, '0x89', block), 'reject').getBlockBatch(
            [BLOCK_NUMBER],
            REQUEST,
        )
        expect(truncated._isInvalid).toBe(true)
        expect(truncated._errorMessage).toBe(
            `trace_replayBlockTransactions returned no replay for 1 of ${TX_COUNT} transactions`,
        )
    })
})
