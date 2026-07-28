import {beforeEach, describe, expect, it, vi} from 'vitest'
import {type CallFrameValidationMode, Rpc} from '../src/rpc'
import {toQty} from '../src/util'
import {getChainId, loadBlock, loadDebugFrames} from './helpers/fixture-loader'
import {MockRpcClient} from './helpers/mock-rpc-client'

const logWarn = vi.hoisted(() => vi.fn())

vi.mock('@subsquid/logger', () => ({
    createLogger: () => ({warn: logWarn})
}))


// Ethereum Sepolia block 11319411, captured from the two upstreams configured for the
// chain. The responses differ in exactly one frame - transaction 17 self-destructs a
// contract into itself, and one provider returns that frame with `from` zeroed and
// `to`/`value` dropped:
//
//   intact     {"type":"SELFDESTRUCT","from":"0xe22a..53e0","to":"0xe22a..53e0","value":"0x0",..}
//   malformed  {"type":"SELFDESTRUCT","from":"0x0000..0000",..}
//
// The block is consensus-valid either way, so on 2026-07-21 the malformed response was
// written to the raw archive and stalled ingestion for a week: normalization is the only
// thing that notices, and by then there is no connection left to ask again.
//
// Both fixtures are the complete, unedited responses. The associated block fixture passes
// the block-hash, transactions-root, withdrawals-root and sender-recovery checks in
// `verification.test.ts`; receipts are not part of this fixture.
//
// The two responses also disagree on `logs[].index` in 65 of the 103 entries (block-wide
// numbering vs restarting at 0 per call). That is a separate provider quirk and does not
// reach the data: normalization takes logs from receipts, not from trace frames.
const CHAIN = 'ethereum-sepolia'
const BLOCK = 11319411
const POISONED_TX = '0xf6c6e39b79667c78858e4c5b924a22d834427d7287e8a3b26219fe5dce180065'
const CONTRACT = '0xe22a1e72591acb61ec32a9a1d2a1d0818c2f53e0'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const SEMANTIC_VIOLATION = `frame 0 is executed by 0x0000000000000000000000000000000000000000, but ${CONTRACT} is on top of the call stack`

const TRACE_CONFIG = {
    tracer: 'callTracer',
    tracerConfig: {
        onlyTopCall: false,
        withLog: true
    },
    timeout: undefined
}


type TraceVariant =
    | 'intact'
    | 'malformed'
    | 'semantic-violation'
    | 'many-semantic-violations'
    | 'wrong-transaction'


function framesFor(variant: TraceVariant): any[] {
    let frames = loadDebugFrames(
        CHAIN,
        BLOCK,
        variant === 'malformed' || variant === 'semantic-violation' ? 'malformed' : undefined
    )

    if (variant === 'semantic-violation') {
        // Restore every field normalization needs while keeping the impossible executor.
        frames[17].result.calls[0].to = CONTRACT
    } else if (variant === 'many-semantic-violations') {
        for (let i = 0; i < 5; i++) {
            frames[i].result.from = ZERO_ADDRESS
        }
    } else if (variant === 'wrong-transaction') {
        frames[17].txHash = `0x${'11'.repeat(32)}`
    }

    return frames
}


function mockClient(variant: TraceVariant = 'intact'): MockRpcClient {
    let client = new MockRpcClient()
    let block = loadBlock(CHAIN, BLOCK)
    let blockWithTransactionHashes = {
        ...block,
        transactions: block.transactions.map(tx => typeof tx === 'string' ? tx : tx.hash)
    }
    client.setFixture('eth_chainId', undefined, getChainId(CHAIN))
    client.setFixture('eth_getBlockByNumber', [toQty(BLOCK), true], block)
    client.setFixture('eth_getBlockByNumber', [toQty(BLOCK), false], blockWithTransactionHashes)
    client.setFixture(
        'debug_traceBlockByNumber',
        [toQty(BLOCK), TRACE_CONFIG],
        framesFor(variant)
    )
    return client
}


function fetchBlock(
    client: MockRpcClient,
    callFrameValidation: CallFrameValidationMode,
    transactions = true
) {
    let rpc = new Rpc({
        client: client as any,
        callFrameValidation,
        verifyTxRoot: callFrameValidation === 'reject',
        verifyTxSender: callFrameValidation === 'reject'
    })
    return rpc.getBlockBatch([BLOCK], {
        transactions,
        traces: true,
        useDebugTraceBlockByNumber: true
    })
}


describe('debug call frames', () => {
    beforeEach(() => {
        logWarn.mockReset()
    })

    it('accepts the intact response', async () => {
        let blocks = await fetchBlock(mockClient(), 'reject')

        expect(blocks.length).toEqual(1)
        expect(blocks[0]._isInvalid).toBeFalsy()
        expect(blocks[0].debugFrames?.length).toEqual(103)
        expect(blocks[0].debugFrames?.[17]?.result.calls?.[0]).toMatchObject({
            type: 'SELFDESTRUCT',
            from: '0xe22a1e72591acb61ec32a9a1d2a1d0818c2f53e0',
            to: CONTRACT
        })
    })

    it('always rejects a response normalization cannot map', async () => {
        let blocks = await fetchBlock(mockClient('malformed'), 'off')

        expect(blocks.length).toEqual(1)
        expect(blocks[0]._isInvalid).toBe(true)
        expect(blocks[0]._errorMessage).toEqual(
            `invalid debug call frames for transaction ${POISONED_TX}: selfdestruct frame 0 has no beneficiary`
        )
    })

    it('validates structure when the caller requests transaction hashes', async () => {
        let blocks = await fetchBlock(mockClient('malformed'), 'off', false)

        expect(blocks[0].block.transactions.every(tx => typeof tx === 'string')).toBe(true)
        expect(blocks[0]._isInvalid).toBe(true)
        expect(blocks[0]._errorMessage).toEqual(
            `invalid debug call frames for transaction ${POISONED_TX}: selfdestruct frame 0 has no beneficiary`
        )
    })

    it('leaves semantic checks disabled in off mode', async () => {
        let blocks = await fetchBlock(mockClient('semantic-violation'), 'off')

        expect(blocks.length).toEqual(1)
        expect(blocks[0]._isInvalid).toBeFalsy()
        let frame = blocks[0].debugFrames?.[17]?.result.calls?.[0]
        expect(frame).toMatchObject({
            from: '0x0000000000000000000000000000000000000000',
            to: CONTRACT
        })
        expect(logWarn).not.toHaveBeenCalled()
    })

    it('shadow-logs semantic violations in observe mode', async () => {
        let blocks = await fetchBlock(mockClient('semantic-violation'), 'observe')

        expect(blocks[0]._isInvalid).toBeFalsy()
        expect(logWarn).toHaveBeenCalledTimes(1)
        expect(logWarn).toHaveBeenCalledWith(
            expect.objectContaining({
                blockNumber: BLOCK,
                callFrameValidation: 'observe',
                violatingTransactionCount: 1,
                violationSamples: [{
                    transactionIndex: 17,
                    transactionHash: POISONED_TX,
                    violation: SEMANTIC_VIOLATION
                }],
                omittedViolationCount: 0
            }),
            'debug call frame consistency violations observed in 1 transaction; block accepted'
        )
    })

    it('aggregates many semantic violations into one bounded warning', async () => {
        let blocks = await fetchBlock(mockClient('many-semantic-violations'), 'observe')

        expect(blocks[0]._isInvalid).toBeFalsy()
        expect(logWarn).toHaveBeenCalledTimes(1)

        let [context, message] = logWarn.mock.calls[0]
        expect(context).toMatchObject({
            blockNumber: BLOCK,
            callFrameValidation: 'observe',
            violatingTransactionCount: 5,
            omittedViolationCount: 2
        })
        expect(context.violationSamples).toHaveLength(3)
        expect(message).toBe(
            'debug call frame consistency violations observed in 5 transactions; block accepted'
        )
    })

    it('rejects semantic violations in reject mode', async () => {
        let blocks = await fetchBlock(mockClient('semantic-violation'), 'reject')

        expect(blocks[0]._isInvalid).toBe(true)
        expect(blocks[0]._errorMessage).toEqual(
            `invalid debug call frames for transaction ${POISONED_TX}: ${SEMANTIC_VIOLATION}`
        )
    })

    it('fetches transaction details for reject mode but preserves a hash-only result', async () => {
        let blocks = await fetchBlock(mockClient('semantic-violation'), 'reject', false)

        expect(blocks[0].block.transactions.every(tx => typeof tx === 'string')).toBe(true)
        expect(blocks[0]._isInvalid).toBe(true)
        expect(blocks[0]._errorMessage).toEqual(
            `invalid debug call frames for transaction ${POISONED_TX}: ${SEMANTIC_VIOLATION}`
        )
    })

    it('requires transaction anchors before reject mode can start', () => {
        expect(() => new Rpc({
            client: mockClient() as any,
            callFrameValidation: 'reject'
        })).toThrow("callFrameValidation 'reject' requires verifyTxRoot and verifyTxSender")
    })

    it('rejects unknown validation modes at startup', () => {
        expect(() => new Rpc({
            client: mockClient() as any,
            callFrameValidation: 'unexpected' as CallFrameValidationMode
        })).toThrow('unsupported callFrameValidation mode: unexpected')
    })

    it('rejects a response associated with the wrong transaction', async () => {
        let blocks = await fetchBlock(mockClient('wrong-transaction'), 'off')

        expect(blocks[0]._isInvalid).toBe(true)
        expect(blocks[0]._errorMessage).toContain('response is labelled with transaction 0x1111')
    })
})
