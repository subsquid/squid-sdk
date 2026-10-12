import * as fs from 'node:fs'
import * as Path from 'node:path'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {type ConsensusAnchorRule, type ConsensusAnchorValidationMode, parseConsensusAnchorRules, Rpc} from '../src/rpc'
import type {DataRequest} from '../src/types'
import {MockRpcClient} from './helpers/mock-rpc-client'

const logWarn = vi.hoisted(() => vi.fn())

vi.mock('@subsquid/logger', () => ({
    createLogger: () => ({warn: logWarn}),
}))

// BSC mainnet block 363: a regular transfer followed by two system transactions, with
// receipts, call frames and both state-diff shapes as an archive node returns them.
const FIXTURE = JSON.parse(fs.readFileSync(Path.join(__dirname, 'fixtures/bsc/block-363.json'), 'utf-8'))
const BLOCK_NUMBER = 363

const CALL_TRACER = {tracer: 'callTracer', tracerConfig: {onlyTopCall: false, withLog: true}, timeout: undefined}
const PRESTATE_TRACER = {
    tracer: 'prestateTracer',
    tracerConfig: {onlyTopCall: false, diffMode: true},
    timeout: undefined,
}

const ALL_RULES: ConsensusAnchorRule[] = ['status', 'gas', 'system-gas', 'system-fee']

type Damage = 'none' | 'reverted-root' | 'missing-fee-credit'

function mockClient(damage: Damage = 'none'): MockRpcClient {
    let f = structuredClone(FIXTURE)
    if (damage === 'reverted-root') {
        f.callFrames[0].result.error = 'execution reverted'
    } else if (damage === 'missing-fee-credit') {
        // a fee-paying transaction whose state diff changes the system address by more than its fee
        let replay = f.replays[0].stateDiff
        replay['0xfffffffffffffffffffffffffffffffffffffffe'] = {
            balance: {'+': '0x1'},
            code: '=',
            nonce: '=',
            storage: {},
        }
        f.prestateDiffs[0].result.post['0xfffffffffffffffffffffffffffffffffffffffe'] = {balance: '0x1'}
    }

    let client = new MockRpcClient()
    let hash = f.block.hash
    client.setFixture('eth_chainId', undefined, f.chainId)
    client.setFixture('eth_getBlockByNumber', [`0x${BLOCK_NUMBER.toString(16)}`, true], f.block)
    client.setFixture('eth_getBlockByNumber', [`0x${BLOCK_NUMBER.toString(16)}`, false], f.blockWithHashes)
    client.setFixture('eth_getBlockReceipts', ['latest'], f.receipts)
    client.setFixture('eth_getBlockReceipts', [f.block.number], f.receipts)
    client.setFixture('debug_traceBlockByHash', [hash, CALL_TRACER], f.callFrames)
    client.setFixture('debug_traceBlockByHash', [hash, PRESTATE_TRACER], f.prestateDiffs)
    client.setFixture('trace_replayBlockTransactions', [hash, ['stateDiff']], f.replays)
    return client
}

function rpc(client: MockRpcClient, mode: ConsensusAnchorValidationMode, rules = ALL_RULES): Rpc {
    return new Rpc({
        client: client as any,
        consensusAnchorValidation: mode,
        consensusAnchorRules: rules,
    })
}

function request(stateDiffs: 'replay' | 'prestate' | 'none' = 'replay'): DataRequest {
    return {
        transactions: false,
        receipts: true,
        traces: true,
        stateDiffs: stateDiffs !== 'none',
        useDebugApiForStateDiffs: stateDiffs === 'prestate',
    }
}

function observedViolations(): any[] {
    return logWarn.mock.calls
        .filter(([, message]) => String(message).startsWith('consensus anchor violations observed'))
        .map(([fields]) => fields)
}

describe('consensus anchor validation', () => {
    beforeEach(() => {
        logWarn.mockReset()
    })

    for (let shape of ['replay', 'prestate'] as const) {
        it(`accepts a correct block (${shape} state diffs)`, async () => {
            let [block] = await rpc(mockClient(), 'reject').getBlockBatch([BLOCK_NUMBER], request(shape))
            expect(block._isInvalid).toBeFalsy()
            expect(logWarn).not.toHaveBeenCalled()
        })

        it(`rejects a state diff that contradicts the fee (${shape})`, async () => {
            let [block] = await rpc(mockClient('missing-fee-credit'), 'reject').getBlockBatch(
                [BLOCK_NUMBER],
                request(shape),
            )
            expect(block._isInvalid).toBe(true)
            expect(block._errorMessage).toMatch(/^consensus anchor violation \(system-fee\) for transaction 0x/)
        })
    }

    it('rejects a trace whose root reverted in a successful transaction', async () => {
        let [block] = await rpc(mockClient('reverted-root'), 'reject').getBlockBatch([BLOCK_NUMBER], request())
        expect(block._isInvalid).toBe(true)
        expect(block._errorMessage).toBe(
            `consensus anchor violation (status) for transaction ${FIXTURE.block.transactions[0].hash}: expected root frame without error, got root frame error "execution reverted"`,
        )
        expect(logWarn).toHaveBeenCalledWith(
            expect.objectContaining({blockNumber: BLOCK_NUMBER, transactionIndex: 0}),
            'consensus anchor violation; block rejected',
        )
    })

    it('logs and accepts in observe mode', async () => {
        let [block] = await rpc(mockClient('reverted-root'), 'observe').getBlockBatch([BLOCK_NUMBER], request())
        expect(block._isInvalid).toBeFalsy()
        let [fields] = observedViolations()
        expect(fields).toMatchObject({
            blockNumber: BLOCK_NUMBER,
            consensusAnchorValidation: 'observe',
            violatingTransactionCount: 1,
            violationSamples: [{rule: 'status', transactionIndex: 0}],
        })
    })

    it('does nothing when off', async () => {
        let [block] = await rpc(mockClient('reverted-root'), 'off').getBlockBatch([BLOCK_NUMBER], request())
        expect(block._isInvalid).toBeFalsy()
        expect(logWarn).not.toHaveBeenCalled()
    })

    it('is off by default', async () => {
        let client = mockClient('reverted-root')
        let [block] = await new Rpc({client: client as any}).getBlockBatch([BLOCK_NUMBER], request())
        expect(block._isInvalid).toBeFalsy()
    })

    it('applies only the selected rules', async () => {
        let [block] = await rpc(mockClient('missing-fee-credit'), 'reject', ['status', 'gas']).getBlockBatch(
            [BLOCK_NUMBER],
            request(),
        )
        expect(block._isInvalid).toBeFalsy()
    })

    it('checks traces without state diffs', async () => {
        let [block] = await rpc(mockClient('reverted-root'), 'reject').getBlockBatch([BLOCK_NUMBER], request('none'))
        expect(block._isInvalid).toBe(true)
        let [ok] = await rpc(mockClient('missing-fee-credit'), 'reject').getBlockBatch([BLOCK_NUMBER], request('none'))
        expect(ok._isInvalid).toBeFalsy()
    })

    it('restores transaction hashes when full transactions were not requested', async () => {
        let [block] = await rpc(mockClient(), 'reject').getBlockBatch([BLOCK_NUMBER], request())
        expect(block.block.transactions.every((tx) => typeof tx === 'string')).toBe(true)
    })

    it('rejects invalid configuration', () => {
        let client = mockClient() as any
        expect(() => new Rpc({client, consensusAnchorValidation: 'strict' as any})).toThrow(/unsupported/)
        expect(() => new Rpc({client, consensusAnchorRules: ['balance' as any]})).toThrow(
            /unknown consensus anchor rule/,
        )
    })
})

describe('parseConsensusAnchorRules', () => {
    it('parses a list', () => {
        expect(parseConsensusAnchorRules('status, gas,system-gas,system-fee')).toEqual(ALL_RULES)
    })

    it('refuses unknown or empty lists', () => {
        expect(() => parseConsensusAnchorRules('status,fees')).toThrow(/unknown consensus anchor rule "fees"/)
        expect(() => parseConsensusAnchorRules(' , ')).toThrow(/empty/)
    })
})
