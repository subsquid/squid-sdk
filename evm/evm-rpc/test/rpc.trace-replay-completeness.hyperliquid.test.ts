import * as fs from 'node:fs'
import * as Path from 'node:path'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {Rpc, type TraceReplayCompletenessMode} from '../src/rpc'
import type {DataRequest} from '../src/types'
import {toQty} from '../src/util'
import {MockRpcClient} from './helpers/mock-rpc-client'

const logWarn = vi.hoisted(() => vi.fn())

vi.mock('@subsquid/logger', () => ({
    createLogger: () => ({warn: logWarn, debug: () => {}, info: () => {}, error: () => {}}),
}))

// HyperEVM mainnet answers, see the fixture's note
const FIXTURE = JSON.parse(
    fs.readFileSync(Path.join(__dirname, 'fixtures/hyperliquid/trace-replay-system-txs.json'), 'utf-8'),
)
const TRACERS = ['trace', 'stateDiff']
const REQUEST: DataRequest = {transactions: true, traces: true, useTraceApi: true, stateDiffs: true}
const MODES = ['off', 'observe', 'reject'] as const

const isSystemTx = (tx: any) => tx.gasPrice === '0x0'

async function fetch(block: any, replays: any[], mode: TraceReplayCompletenessMode) {
    let client = new MockRpcClient()
    client.setFixture('eth_chainId', undefined, '0x3e7')
    client.setFixture('eth_getBlockByNumber', [block.number, true], block)
    client.setFixture('trace_replayBlockTransactions', [block.hash, TRACERS], replays)
    let rpc = new Rpc({client: client as any, traceReplayCompleteness: mode})
    let [got] = await rpc.getBlockBatch([parseInt(block.number)], REQUEST)
    return got
}

function completenessWarnings(): any[] {
    return logWarn.mock.calls
        .filter(([, message]) => String(message).startsWith('trace replays are missing'))
        .map(([fields]) => fields)
}

// A replay per transaction, made from the body (the raw archive keeps no trace API data)
function replaysOf(txs: any[]) {
    return txs.map(tx => ({transactionHash: tx.hash, output: '0x', stateDiff: {}, trace: []}))
}

describe('trace replay completeness on HyperEVM system transactions', () => {
    beforeEach(() => {
        logWarn.mockReset()
    })

    for (let live of FIXTURE.live) {
        for (let mode of MODES) {
            it(`accepts block ${live.number}: body and replays both have the system transactions (${mode})`, async () => {
                let {block, replays} = live.full
                expect(block.transactions.filter(isSystemTx).length).toBeGreaterThan(0)
                let got = await fetch(block, replays, mode)
                expect(got._isInvalid).toBeFalsy()
                expect(got.traceReplays).toHaveLength(block.transactions.length)
                expect(completenessWarnings()).toHaveLength(0)
            })

            it(`rejects block ${live.number}: body without the system transactions, replays with them (${mode})`, async () => {
                // Not #599's check: the foreign-replay check that predates it fires in every mode
                let {block, replays} = live.bodyWithoutSystemTxs
                expect(replays.length).toBeGreaterThan(block.transactions.length)
                let got = await fetch(block, replays, mode)
                expect(got._isInvalid).toBe(true)
                expect(got._errorMessage).toBe('trace_replayBlockTransactions returned a trace of a different block')
            })

            it(`block ${live.number}: a node that would not replay the system transactions (${mode})`, async () => {
                let {block, replays} = live.full
                let system = new Set(block.transactions.filter(isSystemTx).map((tx: any) => tx.hash))
                let got = await fetch(block, replays.filter((r: any) => !system.has(r.transactionHash)), mode)
                if (mode === 'reject') {
                    expect(got._isInvalid).toBe(true)
                    expect(got._errorMessage).toContain(`returned no replay for ${system.size} of`)
                } else {
                    expect(got._isInvalid).toBeFalsy()
                    expect(completenessWarnings()).toHaveLength(mode === 'observe' ? 1 : 0)
                }
            })
        }
    }

    for (let mode of MODES) {
        it(`raw archive block: accepts a replay per transaction, system ones included (${mode})`, async () => {
            let block = FIXTURE.raw.block
            expect(block.transactions.filter(isSystemTx).length).toBeGreaterThan(0)
            let got = await fetch(block, replaysOf(block.transactions), mode)
            expect(got._isInvalid).toBeFalsy()
            expect(completenessWarnings()).toHaveLength(0)
        })

        it(`raw archive block: replays without the system transactions (${mode})`, async () => {
            let block = FIXTURE.raw.block
            let got = await fetch(block, replaysOf(block.transactions.filter((tx: any) => !isSystemTx(tx))), mode)
            expect(!!got._isInvalid).toBe(mode === 'reject')
            expect(completenessWarnings()).toHaveLength(mode === 'observe' ? 1 : 0)
        })
    }

    it('block number fixture sanity', () => {
        expect(toQty(FIXTURE.live[0].number)).toBe(FIXTURE.live[0].full.block.number)
    })
})
