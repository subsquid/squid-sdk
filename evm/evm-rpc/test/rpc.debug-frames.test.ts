import * as fs from 'fs'
import * as Path from 'path'
import {beforeEach, describe, expect, it, vi} from 'vitest'
import {type CallFrameValidationMode, Rpc} from '../src/rpc'
import {SELFDESTRUCT_TRACER} from '../src/selfdestruct-tracer'
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
// Without an opcode trace to recover it from, the malformed frame keeps the block out.
const MALFORMED_REJECTION =
    `invalid debug call frames for transaction ${POISONED_TX}: selfdestruct frame 0 has no beneficiary ` +
    `(selfdestruct from a revm-based tracer: frame 0 is incomplete, executed by ${CONTRACT})`
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
        expect(blocks[0]._errorMessage).toEqual(MALFORMED_REJECTION)
    })

    it('validates structure when the caller requests transaction hashes', async () => {
        let blocks = await fetchBlock(mockClient('malformed'), 'off', false)

        expect(blocks[0].block.transactions.every(tx => typeof tx === 'string')).toBe(true)
        expect(blocks[0]._isInvalid).toBe(true)
        expect(blocks[0]._errorMessage).toEqual(MALFORMED_REJECTION)
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


function readSelfdestructFixture(path: string): any {
    let file = Path.resolve(__dirname, 'fixtures/selfdestruct', path)
    return JSON.parse(fs.readFileSync(file, 'utf-8'))
}


/**
 * A recorded opcode-tracer answer, in the shape the tracer returns.
 */
function recordedOpcodeTrace(name: string): {hash: string, answer: any} {
    let recorded = readSelfdestructFixture(`recovery/${name}`)
    return {
        hash: recorded.transactionHash,
        answer: {
            evs: recorded.events,
            blockHash: recorded.blockHash,
            txHash: recorded.transactionHash
        }
    }
}


/**
 * Serves a recorded block and its call traces exactly as a node returned them.
 * The opcode tracer is served only for the transactions given.
 */
function recordedBlockClient(
    chain: string,
    number: number,
    opcodeTraces: {hash: string, answer: any}[] = [],
    frames = loadDebugFrames(chain, number)
): MockRpcClient {
    let client = new MockRpcClient()
    let block = loadBlock(chain, number)
    let blockWithTransactionHashes = {
        ...block,
        transactions: block.transactions.map(tx => typeof tx === 'string' ? tx : tx.hash)
    }
    client.setFixture('eth_chainId', undefined, getChainId(chain))
    client.setFixture('eth_getBlockByNumber', [toQty(number), true], block)
    client.setFixture('eth_getBlockByNumber', [toQty(number), false], blockWithTransactionHashes)
    client.setFixture('debug_traceBlockByNumber', [toQty(number), TRACE_CONFIG], frames)
    for (let {hash, answer} of opcodeTraces) {
        client.setFixture('debug_traceTransaction', [hash, {tracer: SELFDESTRUCT_TRACER}], answer)
    }
    return client
}


function fetchRecordedBlock(
    client: MockRpcClient,
    number: number,
    callFrameValidation: CallFrameValidationMode = 'off'
) {
    let rpc = new Rpc({
        client: client as any,
        callFrameValidation,
        verifyTxRoot: callFrameValidation === 'reject',
        verifyTxSender: callFrameValidation === 'reject'
    })
    return rpc.getBlockBatch([number], {
        transactions: true,
        traces: true,
        useDebugTraceBlockByNumber: true
    })
}


const MODES: CallFrameValidationMode[] = ['off', 'observe', 'reject']


describe('selfdestruct frames from revm-based tracers', () => {
    beforeEach(() => {
        logWarn.mockReset()
    })

    // Ethereum mainnet block 25735294 from a reth node: transaction 98 carries an
    // incomplete selfdestruct frame at 0/2/6/0/2.
    const MAINNET_BLOCK = 25735294
    const MAINNET_TX = '0x22d29894e6cdb8cf4dbbf71c7d6ba8ec0d597c8f130c500c93b19762828b1d6d'
    const MAINNET_EXECUTOR = '0xf92060aa5e079a0a90119bac558b8c93454d0467'

    it('recovers an incomplete frame from the opcode tracer', async () => {
        let client = recordedBlockClient('ethereum', MAINNET_BLOCK, [recordedOpcodeTrace('25735294-98.json')])

        let blocks = await fetchRecordedBlock(client, MAINNET_BLOCK)

        expect(blocks[0]._isInvalid).toBeFalsy()
        let complete = readSelfdestructFixture('defective/25735294-98.json').complete
        expect(blocks[0].debugFrames?.[98]?.result).toEqual(complete)
    })

    it('rejects the incomplete frame when the upstream will not run the tracer', async () => {
        let client = recordedBlockClient('ethereum', MAINNET_BLOCK)

        let blocks = await fetchRecordedBlock(client, MAINNET_BLOCK)

        expect(blocks[0]._isInvalid).toBe(true)
        expect(blocks[0]._errorMessage).toEqual(
            `invalid debug call frames for transaction ${MAINNET_TX}: ` +
            'selfdestruct frame 0/2/6/0/2 has no beneficiary ' +
            `(selfdestruct from a revm-based tracer: frame 0/2/6/0/2 is incomplete, executed by ${MAINNET_EXECUTOR})`
        )
    })

    // A transaction hash does not name a block. An answer traced in another block
    // (the same transaction re-included by a reorg) carries another balance at the
    // opcode, so it must not be copied into this block's frames.
    it('refuses a recovery trace from another block', async () => {
        let trace = recordedOpcodeTrace('25735294-98.json')
        trace.answer.blockHash = `0x${'11'.repeat(32)}`
        let client = recordedBlockClient('ethereum', MAINNET_BLOCK, [trace])

        let blocks = await fetchRecordedBlock(client, MAINNET_BLOCK)

        expect(blocks[0]._isInvalid).toBe(true)
        expect(blocks[0]._errorMessage).toContain('selfdestruct frame 0/2/6/0/2 has no beneficiary')
        expect(logWarn).toHaveBeenCalledWith(
            expect.objectContaining({
                transactionHash: MAINNET_TX,
                reason: expect.stringContaining('the tracer ran the transaction in block 0x1111')
            }),
            'no opcode trace to recover selfdestruct frames from'
        )
    })

    // A geth dev block whose selfdestruct genuinely repeats an earlier transfer of
    // the same amount. Confirming it has to be enough to let the block through.
    it('accepts a frame the opcode tracer confirms', async () => {
        let client = recordedBlockClient('geth-dev', 7, [recordedOpcodeTrace('geth-dev-legitimate-repeat.json')])
        let frames = loadDebugFrames('geth-dev', 7)

        let blocks = await fetchRecordedBlock(client, 7)

        expect(blocks[0]._isInvalid).toBeFalsy()
        expect(blocks[0].debugFrames).toEqual(frames)
    })

    it('holds back a suspect frame nothing settled', async () => {
        let blocks = await fetchRecordedBlock(recordedBlockClient('geth-dev', 7), 7)

        expect(blocks[0]._isInvalid).toBe(true)
        expect(blocks[0]._errorMessage).toContain('repeats the transfer')
    })

    // An anvil block: a contract called with value selfdestructs to itself, and the
    // tracer reports the call that funded it instead. Such a frame is structurally
    // mappable, so without an opcode trace it must be rejected even where semantic
    // validation would not look at it.
    it('rejects a stale-entry frame in every validation mode', async () => {
        for (let mode of MODES) {
            let blocks = await fetchRecordedBlock(recordedBlockClient('anvil', 16), 16, mode)

            expect(blocks[0]._isInvalid, mode).toBe(true)
            expect(blocks[0]._errorMessage, mode).toEqual(
                'invalid debug call frames for transaction ' +
                '0x68d21eb519525ad6e56c20d15d24ef273dcea1f7aee5bb4207bbdc93c510241e: ' +
                'a selfdestruct frame does not match the opcode ' +
                '(selfdestruct from a revm-based tracer: ' +
                'frame 0/0 repeats the transfer 0x2279b7a0a67db372996a5fab50d91eaa73d2ebe6 ' +
                '-> 0x5fbdb2315678afecb367f032d93f642f64180aa3, ' +
                'executed by 0x5fbdb2315678afecb367f032d93f642f64180aa3)'
            )
        }
    })

    // A contract created and destroyed in one transaction burns its balance. The
    // events come from a local replay of the recorded constructor.
    it('keeps a burned balance of a contract created in the transaction in every mode', async () => {
        let recorded = readSelfdestructFixture('balance/created-in-tx.json')
        let block = recorded.block
        let number = parseInt(block.number)
        let hash = block.transactions[0].hash

        for (let mode of MODES) {
            let client = new MockRpcClient()
            client.setFixture('eth_chainId', undefined, getChainId('anvil'))
            client.setFixture('eth_getBlockByNumber', [toQty(number), true], block)
            client.setFixture(
                'debug_traceBlockByNumber',
                [toQty(number), TRACE_CONFIG],
                [{txHash: hash, result: recorded.trace}]
            )
            client.setFixture(
                'debug_traceTransaction',
                [hash, {tracer: SELFDESTRUCT_TRACER}],
                {evs: recorded.events, blockHash: block.hash, txHash: hash}
            )

            let blocks = await fetchRecordedBlock(client, number, mode)

            expect(blocks[0]._isInvalid, `${mode}: ${blocks[0]._errorMessage}`).toBeFalsy()
            expect(blocks[0].debugFrames?.[0]?.result, mode).toEqual(recorded.trace)
        }
    })
})
